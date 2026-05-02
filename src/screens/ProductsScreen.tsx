import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { ChevronDown, Package, Pencil, Archive } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppInput, AppCard, EmptyState } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';

type Product = {
  id: number;
  category_id: number;
  product_name: string;
  price: string;
  stock: string;
  category_name: string;
  gst_percentage: string;
};

type Category = { id: number; name: string };

export default function ProductsScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [categoryPicker, setCategoryPicker] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [gst, setGst] = useState('0');
  const [categories, setCategories] = useState<Category[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Product[] }>('product/get.php', {
      method: 'GET',
      token,
      query: { company_id: user.company_id },
    });
    if (res.status && res.data) {
      setItems(res.data);
    }
  }, [token, user?.company_id]);

  const loadCats = useCallback(async (): Promise<Category[]> => {
    if (!token || !user?.company_id) {
      return [];
    }
    const res = await apiFetch<{ status: boolean; data?: Category[] }>('category/get_all.php', {
      method: 'GET',
      token,
      query: { company_id: user.company_id },
    });
    if (res.status && res.data) {
      setCategories(res.data);
      return res.data;
    }
    return [];
  }, [token, user?.company_id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const selectedCategoryLabel = () => {
    if (!categoryId) {
      return 'Select category';
    }
    const c = categories.find((x) => String(x.id) === String(categoryId));
    return c ? c.name : `Category #${categoryId}`;
  };

  const openAdd = async () => {
    if (!token || !user?.company_id) {
      Alert.alert('Session', 'Not signed in.');
      return;
    }
    setEditing(null);
    setName('');
    setCategoryId('');
    setPrice('');
    setStock('');
    setGst('0');
    setFormLoading(true);
    const cats = await loadCats();
    setFormLoading(false);
    if (cats.length === 0) {
      Alert.alert(
        'No categories',
        'Create at least one category on the Categories tab before adding products.'
      );
      return;
    }
    setModal(true);
  };

  const openEdit = async (p: Product) => {
    if (!token) {
      Alert.alert('Session', 'Not signed in.');
      return;
    }
    setEditing(p);
    setName(p.product_name);
    setCategoryId(String(p.category_id ?? ''));
    setPrice(String(p.price));
    setStock(String(p.stock));
    setGst(String(p.gst_percentage ?? '0'));
    setFormLoading(true);
    await loadCats();
    setFormLoading(false);
    setModal(true);
  };

  const saveProduct = async () => {
    if (!token) {
      Alert.alert('Session', 'Not signed in.');
      return;
    }
    const cid = parseInt(categoryId, 10);
    if (!name.trim()) {
      Alert.alert('Validation', 'Product name is required');
      return;
    }
    if (!cid || Number.isNaN(cid)) {
      Alert.alert('Validation', 'Please select a category from the list');
      return;
    }
    const body = {
      product_name: name.trim(),
      category_id: cid,
      company_id: user?.company_id,
      price: parseFloat(price) || 0,
      stock: parseFloat(stock) || 0,
      barcode: '',
      unit: 'piece',
      gst_percentage: parseFloat(gst) || 0,
    };
    setSaveBusy(true);
    try {
      if (editing) {
        const res = await apiFetch<{ status: boolean; message?: string }>('product/update.php', {
          body: { ...body, id: editing.id },
          token,
        });
        if (res.status) {
          setModal(false);
          await load();
        } else {
          Alert.alert('Error', res.message ?? 'Update failed');
        }
      } else {
        const res = await apiFetch<{ status: boolean; message?: string }>('product/add.php', {
          body,
          token,
        });
        if (res.status) {
          setModal(false);
          await load();
        } else {
          Alert.alert('Error', res.message ?? 'Add failed');
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Request failed', msg);
    } finally {
      setSaveBusy(false);
    }
  };

  const deleteProduct = (p: Product) => {
    Alert.alert('Archive product', p.product_name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          if (!token) {
            return;
          }
          try {
            const res = await apiFetch<{ status: boolean; message?: string }>('product/delete.php', {
              body: { id: p.id },
              token,
            });
            if (res.status) {
              await load();
            } else {
              Alert.alert('Error', res.message ?? 'Archive failed');
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert('Request failed', msg);
          }
        },
      },
    ]);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Products" subtitle="Pricing and stock" />
      <View style={styles.actions}>
        <AppButton title="Add product" onPress={openAdd} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: TAB_BAR_CONTENT_INSET + 16 }}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Package size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.product_name}</Text>
                <Text style={styles.meta}>
                  {item.category_name} · ₹{item.price} · stock {item.stock}
                </Text>
              </View>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.textBtn}>
                <Pencil size={16} color={colors.primary} />
                <Text style={styles.link}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteProduct(item)} style={styles.textBtn}>
                <Archive size={16} color={colors.error} />
                <Text style={styles.danger}>Archive</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Add your catalog items and set price, stock, and GST."
          />
        }
      />

      <Modal visible={modal} animationType="slide" transparent>
        <Pressable style={styles.modalBg} onPress={() => !saveBusy && !formLoading && setModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            {formLoading ? (
              <ActivityIndicator style={{ marginVertical: 24 }} size="large" color={colors.primary} />
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{editing ? 'Edit product' : 'New product'}</Text>
                <AppInput placeholder="Product name" value={name} onChangeText={setName} />
                <Text style={styles.fieldLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.selectRow}
                  onPress={() => setCategoryPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.selectText, !categoryId && styles.selectPlaceholder]}>
                    {selectedCategoryLabel()}
                  </Text>
                  <ChevronDown size={22} color={colors.muted} />
                </TouchableOpacity>
                <AppInput placeholder="Price" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
                <AppInput placeholder="Stock" keyboardType="decimal-pad" value={stock} onChangeText={setStock} />
                <AppInput placeholder="GST %" keyboardType="decimal-pad" value={gst} onChangeText={setGst} />
                <View style={styles.modalRow}>
                  <AppButton title="Cancel" variant="secondary" onPress={() => setModal(false)} disabled={saveBusy} style={{ flex: 1 }} />
                  <AppButton
                    title={saveBusy ? 'Saving…' : 'Save'}
                    onPress={saveProduct}
                    loading={saveBusy}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={categoryPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setCategoryPicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setCategoryPicker(false)} />
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Choose category</Text>
            <FlatList
              data={categories}
              keyExtractor={(c) => String(c.id)}
              style={styles.pickerList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => {
                    setCategoryId(String(item.id));
                    setCategoryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.name}</Text>
                  {String(categoryId) === String(item.id) ? (
                    <Text style={styles.pickerCheck}>✓</Text>
                  ) : null}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.pickerEmpty}>No categories loaded</Text>}
            />
            <TouchableOpacity style={styles.pickerClose} onPress={() => setCategoryPicker(false)}>
              <Text style={styles.pickerCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: space.xl, marginBottom: space.md },
  card: { padding: space.lg },
  rowTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.body, fontWeight: '800' },
  meta: { ...typography.caption, color: colors.muted, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  textBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  danger: { color: colors.error, fontWeight: '700', fontSize: 14 },
  modalBg: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: space.xl,
    maxHeight: '88%',
    ...shadows.lift,
  },
  modalTitle: { ...typography.h2, marginBottom: space.md },
  fieldLabel: { ...typography.micro, color: colors.textSecondary, marginBottom: 6 },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 10,
    backgroundColor: colors.surfaceMuted,
  },
  selectText: { fontSize: 16, color: colors.text, flex: 1 },
  selectPlaceholder: { color: colors.subtle },
  modalRow: { flexDirection: 'row', gap: 12, marginTop: space.lg },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end' },
  pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingBottom: 24,
    maxHeight: '55%',
    ...shadows.lift,
  },
  pickerTitle: {
    ...typography.h2,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerList: { maxHeight: 280 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  pickerItemText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  pickerCheck: { fontSize: 18, color: colors.primary, fontWeight: '800' },
  pickerEmpty: { padding: 24, textAlign: 'center', color: colors.subtle },
  pickerClose: { marginTop: 8, padding: 16, alignItems: 'center' },
  pickerCloseText: { color: colors.muted, fontWeight: '700', fontSize: 16 },
});
