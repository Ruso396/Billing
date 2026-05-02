import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert, Linking, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppCard, EmptyState } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';

type PendingInvoice = {
  invoice_no: string;
  customer_name: string;
  customer_phone: string;
  total_amount: string;
  balance_amount?: string;
  due_date?: string;
};

export default function PaymentPendingScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<PendingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const markPaid = async (invoice_no: string) => {
    Alert.alert('Confirm payment', `Mark ${invoice_no} as paid?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark paid',
        onPress: async () => {
          try {
            const res = await apiFetch<{ status: boolean; message?: string }>('invoice/mark_as_paid.php', {
              method: 'POST',
              body: { invoice_no },
              token,
            });
            if (res.status) {
              setItems((prev) => prev.filter((item) => item.invoice_no !== invoice_no));
              Alert.alert('Done', 'Payment marked as completed.');
            } else {
              Alert.alert('Error', res.message ?? 'Could not mark paid.');
            }
          } catch (error) {
            Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error');
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
    return (
      <AppCard style={styles.card}>
        <View style={styles.rowTop}>
          <View>
            <Text style={styles.invoiceNo}>{item.invoice_no}</Text>
            <Text style={styles.customer}>{item.customer_name}</Text>
          </View>
          <Text style={styles.amount}>₹{Number(item.balance_amount || item.total_amount).toFixed(2)}</Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={() => sendReminder(item.customer_phone, item.customer_name, item.balance_amount || item.total_amount, dueDate)}>
            <Text style={styles.actionText}>Send reminder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={() => markPaid(item.invoice_no)}>
            <Text style={[styles.actionText, styles.confirmText]}>Mark paid</Text>
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Pending payments" subtitle="Outstanding invoices" />
      <FlatList
        data={items}
        keyExtractor={(item) => item.invoice_no}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: TAB_BAR_CONTENT_INSET + 16 }}
        renderItem={renderRow}
        ListEmptyComponent={
          <EmptyState
            icon={AlertTriangle}
            title={loading ? 'Loading pending payments…' : 'No pending payments'}
            description="All outstanding invoices are cleared."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  invoiceNo: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  customer: { ...typography.body, fontWeight: '700', marginTop: 4 },
  amount: { ...typography.h2, color: colors.error },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metaLabel: { ...typography.micro, color: colors.textSecondary },
  metaValue: { ...typography.body, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: space.md, flexWrap: 'wrap' },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  confirmButton: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  actionText: { ...typography.body, color: colors.text, fontWeight: '700' },
  confirmText: { color: colors.primary },
});
