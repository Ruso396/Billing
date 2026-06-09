import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Linking,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppCard, EmptyState, AppButton, AppInput } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET } from '../theme/tokens';

type PendingInvoice = {
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  total_amount: string;
  paid_amount?: string;
  balance_amount?: string;
  paid_amount_total?: string;
  payment_status?: string;
  due_date?: string;
};

export default function PaymentPendingScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selected, setSelected] = useState<PendingInvoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payBusy, setPayBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{ status: boolean; data?: PendingInvoice[] }>('invoice/get_pending_invoice.php', {
        method: 'POST',
        body: { company_id: user.company_id },
        token,
      });
      if (res.status && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.company_id]);

  useEffect(() => {
    load();
  }, [load]);

  const openPay = (item: PendingInvoice) => {
    setSelected(item);
    setPayAmount(String(item.balance_amount || item.total_amount || ''));
    setPayModal(true);
  };

  const submitPayment = async () => {
    if (!selected || !token) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Validation', 'Enter a valid payment amount');
      return;
    }
    setPayBusy(true);
    try {
      const res = await apiFetch<{
        status: boolean;
        message?: string;
        balance_amount?: number;
      }>('invoice/mark_as_paid.php', {
        method: 'POST',
        body: { invoice_no: selected.invoice_no, pay_amount: amount },
        token,
      });
      if (res.status) {
        setPayModal(false);
        setSelected(null);
        await load();
        Alert.alert('Payment recorded', res.message ?? 'Payment updated.');
      } else {
        Alert.alert('Error', res.message ?? 'Could not record payment.');
      }
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setPayBusy(false);
    }
  };

  const markFullPaid = (item: PendingInvoice) => {
    const balance = Number(item.balance_amount || item.total_amount);
    Alert.alert('Pay full balance', `Record ₹${balance.toFixed(2)} for ${item.invoice_no}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay full',
        onPress: async () => {
          if (!token) return;
          const res = await apiFetch<{ status: boolean; message?: string }>('invoice/mark_as_paid.php', {
            method: 'POST',
            body: { invoice_no: item.invoice_no, pay_amount: balance },
            token,
          });
          if (res.status) {
            await load();
            Alert.alert('Done', res.message ?? 'Payment completed.');
          } else {
            Alert.alert('Error', res.message ?? 'Could not mark paid.');
          }
        },
      },
    ]);
  };

  const sendReminder = (phone: string, name: string, amount: string, dueDate?: string) => {
    const message = `Hi ${name},%0A%0AYour payment of ₹${amount} is due${dueDate ? ` on ${dueDate}` : ''}.%0A%0APlease pay soon.`;
    const url = `https://wa.me/91${phone.replace(/^0+/, '')}?text=${message}`;
    void Linking.openURL(url).catch(() => {
      Alert.alert('Could not open WhatsApp');
    });
  };

  const renderRow = ({ item }: { item: PendingInvoice }) => {
    const dueDate = item.due_date ? new Date(item.due_date).toLocaleDateString('en-IN') : 'N/A';
    const total = Number(item.total_amount) || 0;
    const paid =
      Number(item.paid_amount_total) ||
      Number(item.paid_amount) ||
      Math.max(0, total - Number(item.balance_amount || 0));
    const balance = Number(item.balance_amount) || 0;

    return (
      <AppCard style={styles.card}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceNo}>{item.invoice_no}</Text>
            <Text style={styles.customer}>{item.customer_name}</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Pending payment</Text>
            </View>
          </View>
        </View>
        <View style={styles.amountGrid}>
          <View style={styles.amountCell}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>₹{total.toFixed(2)}</Text>
          </View>
          <View style={styles.amountCell}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountValue, styles.paid]}>₹{paid.toFixed(2)}</Text>
          </View>
          <View style={styles.amountCell}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={[styles.amountValue, styles.balance]}>₹{balance.toFixed(2)}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Phone</Text>
          <Text style={styles.metaValue}>{item.customer_phone}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Due date</Text>
          <Text style={styles.metaValue}>{dueDate}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => sendReminder(item.customer_phone, item.customer_name, balance.toFixed(2), dueDate)}
          >
            <Text style={styles.actionText}>Reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => openPay(item)}>
            <Text style={styles.actionText}>Partial pay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => markFullPaid(item)}>
            <Text style={[styles.actionText, styles.confirmText]}>Pay full</Text>
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Pending invoices" subtitle="Unpaid and partially paid bills" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.invoice_no}
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
        renderItem={renderRow}
        ListEmptyComponent={
          <EmptyState
            icon={AlertTriangle}
            title={loading ? 'Loading pending invoices…' : 'No pending invoices'}
            description="All invoices are fully paid."
          />
        }
      />

      <Modal visible={payModal} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => !payBusy && setPayModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Record payment</Text>
            {selected ? (
              <Text style={styles.modalSub}>
                {selected.invoice_no} · Balance ₹{Number(selected.balance_amount || 0).toFixed(2)}
              </Text>
            ) : null}
            <AppInput
              placeholder="Amount received"
              keyboardType="decimal-pad"
              value={payAmount}
              onChangeText={setPayAmount}
            />
            <View style={styles.modalRow}>
              <AppButton title="Cancel" variant="secondary" onPress={() => setPayModal(false)} style={{ flex: 1 }} />
              <AppButton
                title={payBusy ? 'Saving…' : 'Save'}
                onPress={submitPayment}
                loading={payBusy}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg },
  rowTop: { marginBottom: space.sm },
  invoiceNo: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  customer: { ...typography.body, fontWeight: '700', marginTop: 4 },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.errorSoft,
  },
  statusText: { ...typography.micro, color: colors.error, fontWeight: '800' },
  amountGrid: { flexDirection: 'row', gap: 8, marginTop: space.sm, marginBottom: space.sm },
  amountCell: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 10,
  },
  amountLabel: { ...typography.micro, color: colors.textSecondary },
  amountValue: { ...typography.body, fontWeight: '800', marginTop: 4 },
  paid: { color: colors.success },
  balance: { color: colors.error },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  metaLabel: { ...typography.micro, color: colors.textSecondary },
  metaValue: { ...typography.body, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: space.md, flexWrap: 'wrap' },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  confirmButton: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  actionText: { ...typography.caption, color: colors.text, fontWeight: '700' },
  confirmText: { color: colors.primary },
  modalBg: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.xl,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: space.xl,
  },
  modalTitle: { ...typography.h2, marginBottom: 4 },
  modalSub: { ...typography.caption, color: colors.muted, marginBottom: space.md },
  modalRow: { flexDirection: 'row', gap: 12, marginTop: space.md },
});
