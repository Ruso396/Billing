import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserCheck, UserX } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { AppCard, EmptyState, Screen, ScreenHeader } from '../components/ui';
import { TAB_BAR_CONTENT_INSET, colors, radii, space, typography } from '../theme/tokens';

type CashierRequest = {
  id: number;
  name: string;
  email: string;
  company_name?: string;
  requested_user?: string;
  created_at?: string;
};

export default function CashierRequestsScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState<CashierRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{ status: boolean; data?: CashierRequest[] }>(
        'CashierRequest/get_cashier_requests.php',
        { method: 'GET', token }
      );
      if (res.status && res.data) {
        setItems(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = (id: number) => {
    Alert.alert('Approve cashier', 'Create this cashier account for the company?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          const res = await apiFetch<{ status: boolean; message?: string }>(
            'CashierRequest/approve_cashier_request.php',
            { body: { id }, token }
          );
          if (res.status) {
            await load();
            Alert.alert('Approved', res.message ?? 'Cashier created.');
          } else {
            Alert.alert('Error', res.message ?? 'Approval failed');
          }
        },
      },
    ]);
  };

  const reject = (id: number) => {
    Alert.alert('Reject request', 'Decline this cashier request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          const res = await apiFetch<{ status: boolean; message?: string }>(
            'CashierRequest/reject_cashier_request.php',
            { body: { id }, token }
          );
          if (res.status) {
            await load();
          } else {
            Alert.alert('Error', res.message ?? 'Reject failed');
          }
        },
      },
    ]);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Cashier requests" subtitle="Approve extra cashiers (limit: 3)" />
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
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.email}</Text>
            {item.company_name ? <Text style={styles.meta}>Company: {item.company_name}</Text> : null}
            {item.requested_user ? <Text style={styles.meta}>Requested by: {item.requested_user}</Text> : null}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.approve]} onPress={() => approve(item.id)}>
                <UserCheck size={16} color={colors.primary} />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => reject(item.id)}>
                <UserX size={16} color={colors.error} />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={UserCheck}
            title={loading ? 'Loading…' : 'No pending requests'}
            description="When an admin exceeds the 3-cashier limit, requests appear here."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg },
  name: { ...typography.body, fontWeight: '800' },
  meta: { ...typography.caption, color: colors.muted, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: space.md },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  approve: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  approveText: { color: colors.primary, fontWeight: '700' },
  reject: { borderColor: colors.error, backgroundColor: colors.errorSoft },
  rejectText: { color: colors.error, fontWeight: '700' },
});
