import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Contact } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { AppButton, AppCard, AppInput, EmptyState, Screen, ScreenHeader } from '../components/ui';
import { TAB_BAR_CONTENT_INSET, colors, radii, space, typography } from '../theme/tokens';

type Customer = {
  id: number;
  name: string;
  phone: string;
  address?: string;
  type?: string;
  credit_enabled?: number;
  credit_limit?: string;
};

export default function CustomersScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('regular');
  const [creditEnabled, setCreditEnabled] = useState('0');
  const [creditLimit, setCreditLimit] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Customer[] }>('customer/get_all_customer.php', {
      method: 'GET',
      token,
      query: { company_id: user.company_id },
    });
    if (res.status && res.data) {
      setItems(res.data);
    }
  }, [token, user?.company_id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setPhone('');
    setAddress('');
    setType('regular');
    setCreditEnabled('0');
    setCreditLimit('');
    setModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setType(c.type || 'regular');
    setCreditEnabled(String(c.credit_enabled || '0'));
    setCreditLimit(String(c.credit_limit || ''));
    setModal(true);
  };

  const saveCustomer = async () => {
    if (!token || !user?.company_id) return;
    if (!name.trim()) {
      Alert.alert('Validation', 'Customer name is required');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      Alert.alert('Validation', 'Enter valid 10 digit mobile number');
      return;
    }

    setSaveBusy(true);
    const body = {
      company_id: user.company_id,
      name: name.trim(),
      phone,
      address,
      type,
      credit_enabled: parseInt(creditEnabled, 10),
      credit_limit: parseInt(creditEnabled, 10) === 1 ? creditLimit : 0,
    };

    try {
      if (editing) {
        const res = await apiFetch<{ status: boolean; message?: string }>('customer/update.php', {
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
        const res = await apiFetch<{ status: boolean; message?: string }>('customer/create_customer.php', {
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
      Alert.alert('Error', 'Request failed');
    } finally {
      setSaveBusy(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Customers" subtitle="Customer directory" />
      <View style={styles.actions}>
        <AppButton title="Add Customer" onPress={openAdd} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
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
            <View style={styles.row}>
              <View style={styles.badge}>
                <Contact size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.phone || 'No phone'}</Text>
                {item.address ? <Text style={styles.meta}>{item.address}</Text> : null}
              </View>
              <Text style={styles.type}>{item.type || 'regular'}</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.textBtn}>
                <Text style={styles.link}>Edit</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon={Contact}
            title="No customers yet"
            description="Customers will appear here after billing entries are created."
          />
        }
      />

      <Modal visible={modal} animationType="slide" transparent>
        <Pressable style={styles.modalBg} onPress={() => !saveBusy && setModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e: any) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editing ? 'Edit customer' : 'New customer'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <AppInput placeholder="Customer Name" value={name} onChangeText={setName} />
              <AppInput placeholder="Mobile (10 digits)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <AppInput placeholder="Address" value={address} onChangeText={setAddress} />
              
              <Text style={styles.fieldLabel}>Customer Type</Text>
              <View style={styles.pickerRow}>
                {['regular', 'wholesale', 'retail'].map(t => (
                  <TouchableOpacity key={t} style={[styles.radio, type === t && styles.radioActive]} onPress={() => setType(t)}>
                    <Text style={[styles.radioText, type === t && styles.radioTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Credit Enabled</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={[styles.radio, creditEnabled === '1' && styles.radioActive]} onPress={() => setCreditEnabled('1')}>
                  <Text style={[styles.radioText, creditEnabled === '1' && styles.radioTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radio, creditEnabled === '0' && styles.radioActive]} onPress={() => setCreditEnabled('0')}>
                  <Text style={[styles.radioText, creditEnabled === '0' && styles.radioTextActive]}>No</Text>
                </TouchableOpacity>
              </View>

              {creditEnabled === '1' && (
                <AppInput placeholder="Credit Limit" keyboardType="decimal-pad" value={creditLimit} onChangeText={setCreditLimit} />
              )}

              <View style={styles.modalRow}>
                <AppButton title="Cancel" variant="secondary" onPress={() => setModal(false)} disabled={saveBusy} style={{ flex: 1 }} />
                <AppButton title={saveBusy ? 'Saving…' : 'Save'} onPress={saveCustomer} loading={saveBusy} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg },
  actions: { paddingHorizontal: space.xl, marginBottom: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.body, fontWeight: '700' },
  meta: { ...typography.caption, color: colors.muted, marginTop: 2 },
  type: { ...typography.micro, color: colors.primary, textTransform: 'capitalize' },
  actionsRow: { flexDirection: 'row', gap: 20, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  textBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, padding: space.xl, maxHeight: '90%' },
  modalTitle: { ...typography.h2, marginBottom: space.md },
  fieldLabel: { ...typography.micro, color: colors.textSecondary, marginBottom: 8, marginTop: 4 },
  pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  radio: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surfaceMuted },
  radioActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  radioText: { fontSize: 14, color: colors.text, fontWeight: '500', textTransform: 'capitalize' },
  radioTextActive: { color: colors.primary, fontWeight: '700' },
  modalRow: { flexDirection: 'row', gap: 12, marginTop: space.lg },
});
