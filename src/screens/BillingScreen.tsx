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
  price: string;
  stock: string;
  gst_percentage: string;
};

type Line = { product: Product; qty: number };

export default function BillingScreen() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [customer_name, setCustomerName] = useState('');
  const [customer_phone, setCustomerPhone] = useState('');
  const [picker, setPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Record<number, { product: Product; qty: number }>>({});

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
      setProducts(res.data);
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
      gst += lineSub * (g / 100);
    }
    const total = sub + gst;
    return { sub_total: sub, gst_total: gst, total_amount: total };
  }, [lines]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const lower = searchQuery.toLowerCase();
    return products.filter((p) => p.product_name.toLowerCase().includes(lower));
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

  const submit = async () => {
    if (!token || !user?.company_id) {
      return;
    }
    if (!/^[0-9]{10}$/.test(customer_phone.trim())) {
      Alert.alert('Validation', 'Customer phone must be 10 digits');
      return;
    }
    if (!customer_name.trim() || lines.length === 0) {
      Alert.alert('Validation', 'Customer name and at least one product required');
      return;
    }

    // Safety check before submit
    for (const l of lines) {
      const availableStock = parseFloat(l.product.stock) || 0;
      if (l.qty > availableStock) {
        Alert.alert('Stock not available', 'One or more items exceed available stock');
        return;
      }
    }

    const body = {
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      company_id: user.company_id,
      products: lines.map((l) => ({
        product_id: l.product.id,
        qty: l.qty,
      })),
      sub_total: totals.sub_total,
      gst_total: totals.gst_total,
      total_amount: totals.total_amount,
      paid_amount: totals.total_amount,
      balance_amount: 0,
      payment_method: 'cash',
    };
    const res = await apiFetch<{ status: boolean; message?: string; invoice_no?: string }>(
      'invoice/create_invoice.php',
      { body, token }
    );
    if (res.status) {
      Alert.alert('Success', `Invoice ${res.invoice_no ?? ''} created`);
      setLines([]);
      setCustomerName('');
      setCustomerPhone('');
      loadProducts();
    } else {
      Alert.alert('Error', res.message ?? 'Failed');
    }
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

        <LinearGradient
          colors={[colors.successSoft, '#FFFFFF']}
          style={[styles.totalsCard, shadows.card]}
        >
          <Text style={styles.t}>Subtotal · ₹{totals.sub_total.toFixed(2)}</Text>
          <Text style={styles.t}>GST · ₹{totals.gst_total.toFixed(2)}</Text>
          <Text style={styles.total}>Total · ₹{totals.total_amount.toFixed(2)}</Text>
        </LinearGradient>

        <AppButton title="Create invoice" variant="primary" onPress={submit} style={{ marginTop: space.lg }} />
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
                placeholder="Search products..."
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
