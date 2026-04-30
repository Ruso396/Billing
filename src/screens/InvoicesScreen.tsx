import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Receipt, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppCard, EmptyState } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET } from '../theme/tokens';

type Inv = {
  id: number;
  invoice_no: string;
  customer_name: string;
  total_amount: string;
  created_at: string;
};

export default function InvoicesScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState<Inv[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Inv[] }>('invoice/get_all_invoice.php', {
      body: { company_id: user.company_id },
      token,
    });
    if (res.status && res.data) {
      setItems(res.data);
    }
  }, [token, user?.company_id]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Invoices" subtitle="History and totals" />
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
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                (
                  parent as { navigate: (n: string, p: { invoice_no: string }) => void }
                ).navigate('InvoiceDetail', { invoice_no: item.invoice_no });
              }
            }}
          >
            <AppCard style={styles.card}>
              <View style={styles.top}>
                <View style={styles.badge}>
                  <Receipt size={16} color={colors.primary} />
                  <Text style={styles.no}>{item.invoice_no}</Text>
                </View>
                <Text style={styles.amt}>₹{item.total_amount}</Text>
              </View>
              <Text style={styles.cust}>{item.customer_name}</Text>
              <View style={styles.foot}>
                <Text style={styles.date}>{item.created_at}</Text>
                <ChevronRight size={18} color={colors.subtle} />
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon={Receipt}
            title="No invoices yet"
            description="Completed sales from billing will show up here."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  no: { ...typography.caption, color: colors.primary, fontWeight: '800' },
  amt: { ...typography.h2, color: colors.primary },
  cust: { ...typography.body, fontWeight: '600', marginTop: 12 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  date: { ...typography.micro, color: colors.muted },
});
