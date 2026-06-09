import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Trash2, ShoppingBag, Search, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppCard } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';

type Product = {
  id: number;
  product_name: string;
  product_code?: string;
  barcode?: string;
  price: string;
  stock: string;
  gst_percentage: string;
  unit?: string;
  status?: string;
};

type Line = { product: Product; qty: number };

export default function BillingScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [customer_name, setCustomerName] = useState('');
  const [customer_phone, setCustomerPhone] = useState('');
  const [customer_gst_no, setCustomerGstNo] = useState('');
  const [billType, setBillType] = useState<'cash_bill' | 'gst_bill'>('cash_bill');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [paid_amount, setPaidAmount] = useState('');
  const [picker, setPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Record<number, { product: Product; qty: number }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Product[] }>('product/get.php', {
      method: 'GET',
      token,
      query: { company_id: user.company_id },
    });
    if (res.status && res.data) {
      setProducts(res.data.filter((p) => (p.status || 'active') === 'active'));
    }
  }, [token, user?.company_id]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const getRemainingStock = useCallback(
    (productId: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return 0;
      const originalStock = parseFloat(product.stock) || 0;
      const qtyInCart = lines.find((l) => l.product.id === productId)?.qty || 0;
      return originalStock - qtyInCart;
    },
    [products, lines]
  );

  const updateCartQty = (id: number, delta: number) => {
    const existingIdx = lines.findIndex((l) => l.product.id === id);
    if (existingIdx < 0) return;

    const item = lines[existingIdx];
    const nextQty = item.qty + delta;

    if (nextQty < 1) return;

    if (delta > 0) {
      const remaining = getRemainingStock(id);
      if (remaining < delta) {
        Alert.alert('Stock not available', 'Cannot exceed available stock.');
        return;
      }
    }

    const nextLines = [...lines];
    nextLines[existingIdx] = { ...item, qty: nextQty };
    setLines(nextLines);
  };

  const totals = useMemo(() => {
    let sub = 0;
    let gst = 0;
    for (const l of lines) {
      const p = parseFloat(l.product.price) || 0;
      const g = parseFloat(l.product.gst_percentage) || 0;
      const lineSub = p * l.qty;
      sub += lineSub;
      if (billType === 'gst_bill') {
        gst += lineSub * (g / 100);
      }
    }
    const total = sub + gst;
    return { sub_total: sub, gst_total: gst, total_amount: total };
  }, [lines, billType]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lower = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const name = p.product_name.toLowerCase();
      const code = (p.product_code || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      return name.includes(lower) || code.includes(lower) || barcode.includes(lower) || code === lower;
    });
  }, [products, searchQuery]);

  const toggleSelectProduct = (p: Product) => {
    const isSelected = !!selectedProducts[p.id];
    if (!isSelected) {
      const availableStock = getRemainingStock(p.id);
      if (availableStock <= 0) {
        Alert.alert('Stock not available', 'This product is out of stock.');
        return;
      }
    }

    setSelectedProducts((prev) => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
      } else {
        next[p.id] = { product: p, qty: 1 };
      }
      return next;
    });
  };

  const updateQty = (id: number, delta: number) => {
    const item = selectedProducts[id];
    if (!item) return;

    const nextQty = item.qty + delta;
    if (nextQty < 1) return;

    const availableStock = getRemainingStock(id);
    if (nextQty > availableStock) {
      Alert.alert('Stock not available', 'Cannot exceed available stock.');
      return;
    }

    setSelectedProducts((prev) => ({
      ...prev,
      [id]: { ...item, qty: nextQty },
    }));
  };

  const handleAddToCart = () => {
    const selectedList = Object.values(selectedProducts);
    if (selectedList.length === 0) return;

    let hasError = false;
    const nextLines = [...lines];

    for (const selected of selectedList) {
      const existingIdx = nextLines.findIndex((l) => l.product.id === selected.product.id);
      const availableStock = parseFloat(selected.product.stock) || 0;

      if (existingIdx >= 0) {
        const proposedQty = nextLines[existingIdx].qty + selected.qty;
        if (proposedQty > availableStock) {
          hasError = true;
          nextLines[existingIdx] = {
            ...nextLines[existingIdx],
            qty: availableStock,
          };
        } else {
          nextLines[existingIdx] = {
            ...nextLines[existingIdx],
            qty: proposedQty,
          };
        }
      } else {
        if (selected.qty > availableStock) {
          hasError = true;
          nextLines.push({ product: selected.product, qty: availableStock });
        } else {
          nextLines.push({ product: selected.product, qty: selected.qty });
        }
      }
    }

    setLines(nextLines);
    if (hasError) {
      Alert.alert('Stock Limit Reached', 'Some items exceeded available stock and were adjusted.');
    }
    setPicker(false);
  };

  const saveOrGetCustomer = async () => {
    if (!user?.company_id) return null;

    // Sanitize phone to exactly 10 digits
    const cleanPhone = customer_phone.replace(/\D/g, '').slice(-10);

    const payload = {
      company_id: Number(user.company_id),
      name: customer_name.trim(),
      phone: cleanPhone,
      gst_no: billType === 'gst_bill' && customer_gst_no.trim() ? customer_gst_no.trim() : null,  // Send null if empty
    };

    console.log("FINAL PAYLOAD (Customer Save):", JSON.stringify(payload, null, 2));

    const res = await apiFetch<{ status: boolean; customer_id?: number; message?: string }>('customer/customer_save.php', {
      method: 'POST',
      body: payload,
      token,
    });

    console.log("Customer Response:", res);

    if (res.status && res.customer_id) {
      return res.customer_id;
    }
    throw new Error(res.message || 'Failed to save customer');
  };

  const submit = async () => {
    if (isSubmitting) return;
    if (!token || !user?.company_id) {
      return;
    }
    const cleanPhone = customer_phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      Alert.alert('Validation', 'Customer phone must be exactly 10 digits');
      return;
    }
    if (!customer_name.trim() || lines.length === 0) {
      Alert.alert('Validation', 'Customer name and at least one product required');
      return;
    }
    if (billType === 'gst_bill' && !customer_gst_no.trim()) {
      Alert.alert('Validation', 'GST number is required for GST bill');
      return;
    }
    if (paymentMethod !== 'credit' && (parseFloat(paid_amount) || 0) <= 0) {
      Alert.alert('Validation', 'Enter received amount');
      return;
    }

    // Safety check before submit
    for (const l of lines) {
      const availableStock = parseFloat(l.product.stock) || 0;
      if (l.qty > availableStock) {
        Alert.alert('Stock not available', `Item "${l.product.product_name}" exceeds available stock`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Step 1: Save or get customer ID
      const customer_id = await saveOrGetCustomer();

      if (!customer_id) {
        throw new Error("Customer registration failed. Cannot create invoice without a valid customer ID.");
      }

      // Step 2: Build products array with details matching web app
      const productsArray = lines.map((l) => ({
        product_id: Number(l.product.id),
        name: l.product.product_name,
        price: Number(l.product.price),
        gst: Number(l.product.gst_percentage),
        qty: Number(l.qty),
      }));

      // Step 3: Payment logic
      let paid_amount_val = 0;
      let balance_amount_val = 0;
      let payment_status_val = 'paid';

      if (paymentMethod === 'credit') {
        paid_amount_val = 0;
        balance_amount_val = totals.total_amount;
        payment_status_val = 'pending';  // Changed from 'not_paid' to 'pending'
      } else {
        const received = parseFloat(paid_amount) || 0;
        paid_amount_val = Math.min(received, totals.total_amount);
        balance_amount_val = Math.max(0, totals.total_amount - paid_amount_val);
        payment_status_val = balance_amount_val > 0 ? 'partial' : 'paid';
      }

      // Step 4: Build final JSON body
      const cleanPhone = customer_phone.replace(/\D/g, '').slice(-10);
      
      const invoicePayload = {
        customer_id: Number(customer_id),
        customer_name: customer_name.trim(),
        customer_phone: cleanPhone,
        products: productsArray,  // Send as array
        sub_total: Number(totals.sub_total),
        gst_total: Number(totals.gst_total),
        total_amount: Number(totals.total_amount),
        gst_type: billType === 'gst_bill' ? 'with_gst' : 'without_gst',
        gst_no: billType === 'gst_bill' ? customer_gst_no.trim() : "",
        payment_method: paymentMethod,
        payment_status: payment_status_val,
        paid_amount: Number(paid_amount_val),
        balance_amount: Number(balance_amount_val),
        payment_type: paymentMethod === 'credit' ? 'credit' : paymentMethod,
        cashier_id: Number(user.id),
        company_id: Number(user.company_id),
      };

      console.log("Invoice Payload:", invoicePayload);

      const res = await apiFetch<{ status: boolean; message?: string; invoice_no?: string }>(
        'invoice/create_invoice.php',
        { 
          method: 'POST',
          body: invoicePayload,
          token,
        }
      );

      console.log('=== API RESPONSE ===', res);

      if (res.status) {
        const invoiceNo = res.invoice_no ?? 'Unknown';

        // Refresh products/stock immediately
        loadProducts();

        Alert.alert('Success', `Invoice ${invoiceNo} created`, [
          {
            text: 'View Invoice',
            onPress: () => {
              // Navigate to InvoiceDetail screen via parent if needed (matching InvoicesScreen logic)
              const parent = navigation.getParent();
              if (parent) {
                (parent as any).navigate('InvoiceDetail', {
                  invoice_no: invoiceNo,
                });
              } else {
                (navigation as any).navigate('InvoiceDetail', {
                  invoice_no: invoiceNo,
                });
              }

              // Reset form
              resetForm();
            },
          },
          {
            text: 'Create Another',
            onPress: () => {
              resetForm();
            },
          },
        ]);
      } else {
        Alert.alert('Error', res.message ?? 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Invoice creation error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerGstNo('');
    setPaidAmount('');
    setBillType('cash_bill');
    setPaymentMethod('cash');
    setSelectedProducts({});
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Billing" subtitle="New sale" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + 32, paddingHorizontal: space.xl }}
      >
        <AppCard style={{ marginBottom: space.lg }}>
          <Text style={styles.section}>Customer</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Customer name"
            placeholderTextColor={colors.subtle}
            value={customer_name}
            onChangeText={setCustomerName}
          />
          <Text style={styles.label}>Phone (10 digits)</Text>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor={colors.subtle}
            value={customer_phone}
            onChangeText={setCustomerPhone}
            keyboardType="number-pad"
            maxLength={10}
          />

          <Text style={styles.section}>Bill Type</Text>
          <View style={styles.billTypeContainer}>
            <TouchableOpacity
              style={[styles.billTypeBtn, billType === 'cash_bill' && styles.billTypeBtnActive]}
              onPress={() => setBillType('cash_bill')}
            >
              <Text style={[styles.billTypeText, billType === 'cash_bill' && styles.billTypeTextActive]}>Cash Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.billTypeBtn, billType === 'gst_bill' && styles.billTypeBtnActive]}
              onPress={() => setBillType('gst_bill')}
            >
              <Text style={[styles.billTypeText, billType === 'gst_bill' && styles.billTypeTextActive]}>GST Bill</Text>
            </TouchableOpacity>
          </View>

          {billType === 'gst_bill' && (
            <>
              <Text style={styles.label}>GST Number</Text>
              <TextInput
                style={styles.input}
                placeholder="GST Number"
                placeholderTextColor={colors.subtle}
                value={customer_gst_no}
                onChangeText={setCustomerGstNo}
                maxLength={15}
              />
            </>
          )}
        </AppCard>

        <AppButton
          title="Add product line"
          variant="secondary"
          onPress={() => {
            setSearchQuery('');
            setSelectedProducts({});
            setPicker(true);
          }}
        />

        {lines.length > 0 ? (
          <AppCard style={{ marginTop: space.lg }}>
            <Text style={styles.section}>Cart</Text>
            {lines.map((l) => (
              <View key={l.product.id} style={styles.line}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lineName}>{l.product.product_name}</Text>

                  <View style={styles.cartQtyRow}>
                    <Text style={styles.cartQtyLabel}>Qty</Text>
                    <View style={styles.cartQtyControls}>
                      <TouchableOpacity
                        style={styles.cartQtyBtn}
                        onPress={() => updateCartQty(l.product.id, -1)}
                      >
                        <Minus size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.cartQtyValue}>{l.qty}</Text>
                      <TouchableOpacity
                        style={[styles.cartQtyBtn, getRemainingStock(l.product.id) <= 0 && { opacity: 0.5 }]}
                        onPress={() => updateCartQty(l.product.id, 1)}
                        disabled={getRemainingStock(l.product.id) <= 0}
                      >
                        <Plus size={14} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartPriceCalc}>
                      ₹{l.product.price} × {l.qty} = ₹{(parseFloat(l.product.price) * l.qty).toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.remainingStockText}>
                    Remaining stock: {getRemainingStock(l.product.id)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setLines(lines.filter((x) => x.product.id !== l.product.id))} style={{ padding: 4 }}>
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </AppCard>
        ) : null}

        <AppCard style={{ marginTop: space.lg }}>
          <Text style={styles.section}>Payment Method</Text>
          <View style={styles.paymentContainer}>
            {(['cash', 'upi', 'card', 'credit'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnActive]}
                onPress={() => setPaymentMethod(method as any)}
              >
                <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod !== 'credit' && (
            <>
              <Text style={styles.label}>Amount Received</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={colors.subtle}
                value={paid_amount}
                onChangeText={setPaidAmount}
                keyboardType="numeric"
              />
              <Text style={styles.balanceText}>
                {parseFloat(paid_amount) >= totals.total_amount
                  ? `Change Return: ₹${(parseFloat(paid_amount) - totals.total_amount).toFixed(2)}`
                  : `Balance Due: ₹${(totals.total_amount - parseFloat(paid_amount || '0')).toFixed(2)}`}
              </Text>
            </>
          )}

          {paymentMethod === 'credit' && (
            <View style={styles.creditBanner}>
              <Text style={styles.creditText}>Due in 30 days, Full amount recorded as outstanding</Text>
            </View>
          )}
        </AppCard>

        <LinearGradient
          colors={[colors.successSoft, '#FFFFFF']}
          style={[styles.totalsCard, shadows.card]}
        >
          <Text style={styles.t}>Subtotal · ₹{totals.sub_total.toFixed(2)}</Text>
          {billType === 'gst_bill' && <Text style={styles.t}>GST · ₹{totals.gst_total.toFixed(2)}</Text>}
          <Text style={styles.total}>Total · ₹{totals.total_amount.toFixed(2)}</Text>
        </LinearGradient>

        <AppButton
          title="Create invoice"
          variant="primary"
          onPress={submit}
          style={{ marginTop: space.lg }}
          loading={isSubmitting}
        />
      </ScrollView>

      <Modal visible={picker} animationType="slide" presentationStyle="pageSheet">
        <LinearGradient colors={[colors.bgTop, colors.surface]} style={styles.modalRoot}>
          <SafeAreaView style={styles.modalSafe} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pick products</Text>
              <TouchableOpacity onPress={() => setPicker(false)} hitSlop={12}>
                <Text style={styles.closeLink}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={colors.subtle} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or product code..."
                placeholderTextColor={colors.subtle}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <FlatList
              data={filteredProducts}
              keyExtractor={(p) => String(p.id)}
              contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 120 }}
              renderItem={({ item }) => {
                const isSelected = !!selectedProducts[item.id];
                const qty = isSelected ? selectedProducts[item.id].qty : 0;
                return (
                  <Pressable
                    onPress={() => toggleSelectProduct(item)}
                    style={[styles.productCard, isSelected && styles.productCardSelected]}
                  >
                    <View style={[styles.pIcon, isSelected && { backgroundColor: colors.primary }]}>
                      <ShoppingBag size={20} color={isSelected ? '#FFFFFF' : colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pName}>{item.product_name}</Text>
                      <Text style={styles.pCode}>{item.product_code ? `Code ${item.product_code}` : 'No code'}</Text>
                      <Text style={styles.pStock}>Stock {getRemainingStock(item.id) - qty} · ₹{item.price}</Text>
                    </View>

                    {isSelected ? (
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            updateQty(item.id, -1);
                          }}
                        >
                          <Minus size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{qty}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, getRemainingStock(item.id) - qty <= 0 && { opacity: 0.5 }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            updateQty(item.id, 1);
                          }}
                          disabled={getRemainingStock(item.id) - qty <= 0}
                        >
                          <Plus size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.unselectedCircle} />
                    )}
                  </Pressable>
                );
              }}
            />

            {Object.keys(selectedProducts).length > 0 && (
              <View style={styles.modalFooter}>
                <AppButton
                  title={`Add to Cart (${Object.keys(selectedProducts).length})`}
                  variant="primary"
                  onPress={handleAddToCart}
                />
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { ...typography.h2, marginBottom: space.md },
  label: { ...typography.micro, color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: space.md,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 12,
  },
  lineName: { ...typography.body, fontWeight: '700' },
  lineMeta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  cartQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  cartQtyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cartQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  cartQtyBtn: {
    padding: 4,
  },
  cartQtyValue: {
    ...typography.body,
    fontWeight: '600',
    minWidth: 16,
    textAlign: 'center',
  },
  cartPriceCalc: {
    ...typography.caption,
    color: colors.text,
    marginLeft: 'auto',
  },
  remainingStockText: {
    ...typography.micro,
    color: colors.muted,
    marginTop: 6,
  },
  billTypeContainer: {
    flexDirection: 'row',
    gap: space.md,
    marginBottom: space.md,
  },
  billTypeBtn: {
    flex: 1,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  billTypeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  billTypeText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.text,
  },
  billTypeTextActive: {
    color: '#FFFFFF',
  },
  paymentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.md,
  },
  paymentBtn: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  paymentBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentText: {
    ...typography.caption,
    color: colors.text,
  },
  paymentTextActive: {
    color: '#FFFFFF',
  },
  balanceText: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 4,
  },
  creditBanner: {
    backgroundColor: colors.errorSoft,
    padding: space.md,
    borderRadius: radii.md,
    marginTop: space.sm,
  },
  creditText: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  totalsCard: {
    marginTop: space.lg,
    borderRadius: radii.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  t: { ...typography.subtitle, marginBottom: 4 },
  total: { ...typography.title, fontSize: 22, marginTop: 8, color: colors.success },
  modalRoot: { flex: 1 },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  modalTitle: { ...typography.title },
  closeLink: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    marginHorizontal: space.xl,
    marginBottom: space.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: radii.lg,
    marginBottom: space.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
    gap: 12,
  },
  productCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pName: { ...typography.body, fontWeight: '700' },
  pCode: { ...typography.micro, color: colors.primary, marginTop: 2, fontWeight: '700' },
  pStock: { ...typography.caption, color: colors.muted, marginTop: 2 },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  qtyText: {
    ...typography.body,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center',
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    paddingBottom: space.xl + 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});
