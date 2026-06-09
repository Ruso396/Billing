import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FileText } from 'lucide-react-native';
import { InvoiceDownloadIcon, InvoiceWhatsAppIcon } from '../components/InvoiceActionIcons';
import { colors, radii, shadows, space, typography } from '../theme/tokens';
import { Image, Linking } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, Loader, EmptyState } from '../components/ui';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type RouteParams = { invoice_no: string };

export default function InvoiceDetailScreen() {
  const { token } = useAuth();
  const route = useRoute();
  const { invoice_no } = (route.params || {}) as RouteParams;
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token || !invoice_no) {
        setLoading(false);
        return;
      }
      const res = await apiFetch<{ status: boolean; data?: Record<string, any> }>(
        'invoice/get_invoice_by_id.php',
        { method: 'GET', query: { id: invoice_no } }
      );
      if (res.status && res.data) {
        setData(res.data);
        console.log("PRODUCTS DATA:", res.data.products);
      }
      setLoading(false);
    })();
  }, [token, invoice_no]);

  const getInvoiceHTML = () => {
    if (!data) return '';
    const products = (data.products || []) as any[];
    const date = data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
    const time = data.created_at ? new Date(data.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
    const logoUrl = data.logo ? `${API_BASE_URL.replace(/\/api$/, '')}/${data.logo}` : null;

    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              background-color: white;
              color: black;
              margin: 0;
              padding: 10px;
              font-size: 12px;
              line-height: 1.4;
            }
            .receipt {
              max-width: 320px;
              margin: 0 auto;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider {
              border-bottom: 1px dashed black;
              margin: 8px 0;
            }
            .flex { display: flex; justify-content: space-between; }
            .mb-5 { margin-bottom: 5px; }
            .h1 { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 4px; }
            .table th, .table td { text-align: left; padding: 2px 0; }
            .text-right { text-align: right; }
            .total { font-size: 16px; font-weight: bold; }
            .logo { height: 60px; object-fit: contain; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${logoUrl ? `<img src="${logoUrl}" class="logo" />` : ''}
            <div class="center">
              <div class="h1">${data.company_name || 'COMPANY NAME'}</div>
              <div>${data.company_address || ''}</div>
              <div>Ph: ${data.phone || ''}</div>
              <div>GSTIN: ${data.gstin || ''}</div>
            </div>
            <div class="divider"></div>
            <div class="flex mb-5">
              <span>Bill ${data.invoice_no}</span>
              <span>${date} ${time}</span>
            </div>
            <div class="mb-5">Customer: ${data.customer_name || '---'}</div>
            <div class="mb-5">Phone: ${data.customer_phone || ''}</div>
            <div class="divider"></div>
            <div class="flex bold">
              <span style="flex: 2">Item</span>
              <span style="flex: 1; text-align: right">Rate</span>
              <span style="flex: 1; text-align: right">Qty</span>
              <span style="flex: 1; text-align: right">Amt</span>
            </div>
            <div class="divider"></div>
            ${products.map(p => {
              const amount = (parseFloat(p.price) || 0) * (p.qty || 0);
              const gst = (amount * (parseFloat(p.gst) || 0)) / 100;
              return `
                <div style="margin-bottom: 4px;">
                  <div class="flex">
                    <span style="flex: 2">${p.display_name || p.name || "Item"}</span>
                    <span style="flex: 1; text-align: right">${p.price}</span>
                    <span style="flex: 1; text-align: right">${p.qty}</span>
                    <span style="flex: 1; text-align: right">${amount.toFixed(2)}</span>
                  </div>
                  <div style="font-size: 10px; margin-left: 4px;">
                    GST @${p.gst}% : ₹${gst.toFixed(2)}
                  </div>
                </div>
              `;
            }).join('')}
            <div class="divider"></div>
            <div class="flex">
              <span>Total Items</span>
              <span>${products.length}</span>
            </div>
            <div class="flex">
              <span>Subtotal</span>
              <span>₹${data.sub_total}</span>
            </div>
            <div class="flex">
              <span>Tax</span>
              <span>₹${data.gst_total}</span>
            </div>
            <div class="divider"></div>
            <div class="flex total">
              <span>Total Amount</span>
              <span>₹${data.total_amount}</span>
            </div>
            <div class="divider"></div>
            <div class="center" style="margin: 6px 0;">
              <span style="text-transform: uppercase;">${data.payment_method}</span> ₹${data.paid_amount}
            </div>
            ${data.balance_amount > 0 ? `
            <div class="flex" style="margin-bottom: 6px;">
              <span>Balance Due</span>
              <span class="bold">₹${data.balance_amount}</span>
            </div>
            ` : ''}
            <div class="divider"></div>
            <div class="center" style="font-size: 10px; margin-top: 4px;">
              PLEASE NOTE - EXCHANGES ALLOWED ONLY WITHIN 3 DAYS
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const generatePDF = async () => {
    if (!data || isGenerating) return;
    setIsGenerating(true);

    try {
      const htmlContent = getInvoiceHTML();
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF generated, but sharing is not available on this device.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendWhatsAppMessage = async () => {
    if (!data) return;

    try {
      // 1. Format phone: Only digits, start with 91 if 10 digits
      let phone = data.customer_phone?.replace(/\D/g, '') || '';
      if (phone.length === 10) {
        phone = '91' + phone;
      }

      // 2. Build pre-filled message
      const message = encodeURIComponent(
        `Hello ${data.customer_name || 'Customer'},\nYour invoice #${data.invoice_no} is ready.\nTotal: ₹${data.total_amount}\nPaid: ₹${data.paid_amount}\nBalance: ₹${data.balance_amount}`
      );

      // 3. Create URL
      const url = `https://wa.me/${phone}?text=${message}`;

      // 4. Check if WhatsApp can be opened
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <Loader message="Loading invoice…" />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <EmptyState icon={FileText} title="Invoice not found" description="Check the number and try again." />
      </Screen>
    );
  }

  const products = (data.products || []) as any[];
  const date = data.created_at ? new Date(data.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');
  const time = data.created_at ? new Date(data.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const logoUrl = data.logo ? `${API_BASE_URL.replace(/\/api$/, '')}/${data.logo}` : null;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptContainer}>
          <View style={styles.receiptPaper}>
            {logoUrl && (
              <View style={styles.logoWrap}>
                <Image source={{ uri: logoUrl }} style={styles.logo} />
              </View>
            )}

            <View style={styles.center}>
              <Text style={styles.companyName}>{data.company_name || 'COMPANY NAME'}</Text>
              <Text style={styles.metaText}>{data.company_address}</Text>
              <Text style={styles.metaText}>Ph: {data.phone}</Text>
              <Text style={styles.metaText}>GSTIN: {data.gstin}</Text>
            </View>
            
            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Bill {data.invoice_no}</Text>
              <Text style={styles.text}>{date} {time}</Text>
            </View>

            <View style={{ marginTop: 4 }}>
              <Text style={styles.text}>Customer: {data.customer_name || '---'}</Text>
              <Text style={styles.text}>Phone: {data.customer_phone || ''}</Text>
            </View>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.colName, styles.bold]}>Item</Text>
              <Text style={[styles.colRate, styles.bold, styles.textRight]}>Rate</Text>
              <Text style={[styles.colQty, styles.bold, styles.textRight]}>Qty</Text>
              <Text style={[styles.colAmt, styles.bold, styles.textRight]}>Amt</Text>
            </View>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            {products.map((p, i) => {
              const amount = (parseFloat(p.price) || 0) * (p.qty || 0);
              const gst = (amount * (parseFloat(p.gst) || 0)) / 100;
              return (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={styles.tableRow}>
                    <Text style={styles.colName}>{p.display_name || p.name || "Item"}</Text>
                    <Text style={[styles.colRate, styles.textRight]}>{p.price}</Text>
                    <Text style={[styles.colQty, styles.textRight]}>{p.qty}</Text>
                    <Text style={[styles.colAmt, styles.textRight]}>{amount.toFixed(2)}</Text>
                  </View>
                  <Text style={styles.gstDetail}>
                    GST @{p.gst}% : ₹{gst.toFixed(2)}
                  </Text>
                </View>
              );
            })}

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Total Items</Text>
              <Text style={styles.text}>{products.length}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Subtotal</Text>
              <Text style={styles.text}>₹{data.sub_total}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Tax</Text>
              <Text style={styles.text}>₹{data.gst_total}</Text>
            </View>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹ {data.total_amount}</Text>
            </View>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.paymentInfo}>
              <Text style={[styles.text, styles.bold, { textTransform: 'uppercase' }]}>
                {data.payment_method} ₹{data.paid_amount}
              </Text>
            </View>

            {data.balance_amount > 0 && (
              <View style={[styles.row, { marginTop: 4 }]}>
                <Text style={styles.text}>Balance Due</Text>
                <Text style={[styles.text, styles.bold]}>₹{data.balance_amount}</Text>
              </View>
            )}

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <Text style={styles.footerNote}>
              PLEASE NOTE - EXCHANGES ALLOWED ONLY WITHIN 3 DAYS
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={generatePDF}
              disabled={isGenerating}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrap, styles.downloadIconWrap]}>
                <InvoiceDownloadIcon size={30} />
              </View>
              <Text style={styles.actionLabel}>{isGenerating ? 'Processing' : 'Download'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={sendWhatsAppMessage}
              activeOpacity={0.75}
            >
              <View style={[styles.actionIconWrap, styles.whatsappIconWrap]}>
                <View style={styles.whatsappIconSlot}>
                  <InvoiceWhatsAppIcon size={30} />
                </View>
              </View>
              <Text style={styles.actionLabel}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { 
    padding: 16, 
    paddingBottom: 40,
    alignItems: 'center',
  },
  receiptContainer: {
    width: '100%',
    maxWidth: 380, // narrow feel
    alignItems: 'center',
  },
  receiptPaper: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyName: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    color: '#000',
  },
  metaText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    fontSize: 12,
    color: '#000',
    marginBottom: 2,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: {
    height: 60,
    width: 120,
    resizeMode: 'contain',
  },
  dividerWrapper: {
    overflow: 'hidden',
    marginVertical: 8,
  },
  divider: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
  },
  textRight: {
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
  },
  colName: {
    flex: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
  },
  colRate: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
  },
  colQty: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
  },
  colAmt: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#000',
  },
  gstDetail: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    marginLeft: 4,
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  paymentInfo: {
    alignItems: 'center',
    marginVertical: 6,
  },
  footerNote: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    color: '#000',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 40,
    marginTop: space.xl,
    paddingTop: space.md,
    width: '100%',
  },
  actionItem: {
    alignItems: 'center',
    minWidth: 88,
  },
  actionIconWrap: {
    width: 58,
    height: 58,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  downloadIconWrap: {
    backgroundColor: '#F0F7FF',
  },
  whatsappIconWrap: {
    backgroundColor: '#F0FAF0',
    borderColor: '#D8F0D8',
  },
  whatsappIconSlot: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionLabel: {
    ...typography.caption,
    marginTop: 8,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
  },
});

