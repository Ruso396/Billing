import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppCard, Loader, EmptyState } from '../components/ui';
import { InvoiceExportPanel } from '../components/InvoiceExportPanel';
import type { ExportInvoice } from '../utils/invoiceExport';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';

type MoreStackParamList = {
  MoreMenu: undefined;
  Reports: undefined;
  Profile: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, 'Reports'>;
};

type MonthRow = { month: string; total: number };

export default function ReportsScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [invoices, setInvoices] = useState<ExportInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      setLoading(false);
      return;
    }
    const [analyticsRes, invoiceRes] = await Promise.all([
      apiFetch<{
        status: boolean;
        data?: { monthly_sales: MonthRow[] };
      }>('dashboard/get_analytics.php', {
        method: 'GET',
        token,
        query: { company_id: user.company_id },
      }),
      apiFetch<{ status: boolean; data?: ExportInvoice[] }>('invoice/get_all_invoice.php', {
        body: { company_id: user.company_id },
        token,
      }),
    ]);
    if (analyticsRes.status && analyticsRes.data?.monthly_sales) {
      setRows(analyticsRes.data.monthly_sales);
    }
    if (invoiceRes.status && invoiceRes.data) {
      setInvoices(invoiceRes.data);
    }
    setLoading(false);
  }, [token, user?.company_id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const ytd = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const best = rows.reduce(
    (acc, r) => (Number(r.total) > acc.total ? { label: r.month, total: Number(r.total) } : acc),
    { label: '—', total: 0 }
  );

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Reports"
          subtitle="Sales insights"
          right={
            <Text style={styles.link} onPress={() => navigation.goBack()}>
              Back
            </Text>
          }
        />
        <Loader message="Loading analytics…" />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Reports"
        subtitle="Monthly performance"
        right={
          <Text style={styles.link} onPress={() => navigation.goBack()}>
            Back
          </Text>
        }
      />
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + 32, paddingHorizontal: space.xl }}
      >
        <InvoiceExportPanel invoices={invoices} />

        <LinearGradient
          colors={[...colors.gradientHero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, shadows.lift]}
        >
          <View style={styles.heroIcon}>
            <TrendingUp color="#FFF" size={26} strokeWidth={1.75} />
          </View>
          <Text style={styles.heroLabel}>Year-to-date sales</Text>
          <Text style={styles.heroValue}>₹ {ytd.toFixed(2)}</Text>
          <Text style={styles.heroFoot}>Best month: {best.label} (₹ {best.total.toFixed(2)})</Text>
        </LinearGradient>

        {rows.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No report data" description="Invoices will appear here once recorded." />
        ) : (
          <AppCard style={{ marginTop: space.lg }}>
            <Text style={styles.sectionTitle}>By month</Text>
            {rows.map((r) => (
              <View key={r.month} style={styles.line}>
                <Text style={styles.month}>{r.month}</Text>
                <Text style={styles.amt}>₹ {Number(r.total).toFixed(2)}</Text>
              </View>
            ))}
          </AppCard>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  hero: {
    borderRadius: radii.xxl,
    padding: space.xl,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroValue: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  heroFoot: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 10, fontWeight: '500' },
  sectionTitle: { ...typography.h2, marginBottom: space.md },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  month: { ...typography.body, fontWeight: '600', color: colors.textSecondary },
  amt: { ...typography.body, fontWeight: '700', color: colors.primary },
});
