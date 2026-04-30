import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Download, FileText } from 'lucide-react-native';
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

  useEffect(() => {
    (async () => {
      if (!token || !invoice_no) {
        setLoading(false);
        return;
      }
      const res = await apiFetch<{ status: boolean; data?: Record<string, any> }>(
        'invoice/get_invoice_by_id.php',
        { method: 'GET', token, query: { id: invoice_no } }
      );
      if (res.status && res.data) {
        setData(res.data);
      }
      setLoading(false);
    })();
  }, [token, invoice_no]);

  const generatePDF = async () => {
    if (!data || isGenerating) return;
    setIsGenerating(true);

    const products = (data.products || []) as any[];

    const htmlContent = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              background-color: white;
              color: black;
              margin: 0;
              padding: 20px;
              font-size: 14px;
              line-height: 1.4;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider {
              border-bottom: 1px dashed black;
              margin: 10px 0;
            }
            .flex { display: flex; justify-content: space-between; }
            .mb-5 { margin-bottom: 5px; }
            .h1 { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .table { width: 100%; border-collapse: collapse; }
            .table th, .table td { text-align: left; padding: 4px 0; }
            .table th { border-bottom: 1px dashed black; }
            .text-right { text-align: right; }
            .total { font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center">
              <div class="h1">${data.company_name || 'COMPANY NAME'}</div>
              <div>RECEIPT / INVOICE</div>
            </div>
            <div class="divider"></div>
            <div class="flex mb-5">
              <span>Invoice No:</span>
              <span class="bold">${data.invoice_no}</span>
            </div>
            <div class="flex mb-5">
              <span>Date:</span>
              <span>${data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            </div>
            <div class="divider"></div>
            <div class="mb-5"><b>Customer:</b> ${data.customer_name || '—'}</div>
            <div class="mb-5"><b>Phone:</b> ${data.customer_phone || '—'}</div>
            <div class="divider"></div>
            <table class="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                ${products.map(p => `
                  <tr>
                    <td>${p.product_name || 'Product #' + p.product_id}</td>
                    <td class="text-right">${p.qty}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="divider"></div>
            <div class="flex total">
              <span>TOTAL</span>
              <span>Rs. ${data.total_amount}</span>
            </div>
            <div class="divider"></div>
            <div class="center" style="margin-top: 20px;">
              Thank you!
            </div>
          </div>
        </body>
      </html>
    `;

    try {
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

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptContainer}>
          <View style={styles.receiptPaper}>
            <Text style={styles.companyName}>{data.company_name || 'COMPANY NAME'}</Text>
            <Text style={styles.centerText}>RECEIPT / INVOICE</Text>
            
            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.text}>Invoice No:</Text>
              <Text style={[styles.text, styles.bold]}>{data.invoice_no}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.text}>Date:</Text>
              <Text style={styles.text}>{data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</Text>
            </View>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <Text style={styles.text}>Customer: {data.customer_name || '—'}</Text>
            <Text style={styles.text}>Phone: {data.customer_phone || '—'}</Text>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.bold]}>Item</Text>
              <Text style={[styles.col2, styles.bold]}>Qty</Text>
            </View>

            {products.map((p, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{p.product_name || `Product #${p.product_id}`}</Text>
                <Text style={styles.col2}>× {p.qty}</Text>
              </View>
            ))}

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>₹ {data.total_amount}</Text>
            </View>

            <View style={styles.dividerWrapper}>
              <Text style={styles.divider} numberOfLines={1} ellipsizeMode="clip">
                - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
              </Text>
            </View>

            <Text style={[styles.centerText, { marginTop: 16 }]}>Thank you!</Text>
          </View>

          <TouchableOpacity style={styles.downloadBtn} onPress={generatePDF} disabled={isGenerating}>
            <Download size={20} color="#fff" />
            <Text style={styles.downloadBtnText}>{isGenerating ? 'Processing...' : 'Download Invoice'}</Text>
          </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#000',
  },
  centerText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    fontSize: 14,
    color: '#000',
  },
  dividerWrapper: {
    overflow: 'hidden',
    marginVertical: 12,
  },
  divider: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#000',
    letterSpacing: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  text: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#000',
    marginBottom: 2,
  },
  bold: {
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  col1: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#000',
  },
  col2: {
    width: 60,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#000',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  totalLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    width: '100%',
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

