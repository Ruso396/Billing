import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IndianRupee, Package, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppCard, Loader } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';

type Stats = {
  total_sales: number;
  total_products: number;
  low_stock: number;
};

export default function DashboardScreen() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [boot, setBoot] = useState(true);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      setBoot(false);
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Stats }>('dashboard/get_stats.php', {
      method: 'GET',
      token,
      query: { company_id: user.company_id },
    });
    if (res.status && res.data) {
      setStats(res.data);
    }
    setBoot(false);
  }, [token, user?.company_id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (boot) {
    return (
      <Screen>
        <ScreenHeader title="Home" subtitle="Your workspace" />
        <Loader message="Loading dashboard…" />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Home" subtitle={`Hello, ${user?.name ?? 'there'}`} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + 24, paddingHorizontal: space.xl }}
      >
        <Text style={styles.email}>{user?.email}</Text>

        {stats ? (
          <>
            <LinearGradient
              colors={[...colors.gradientHero]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, shadows.lift]}
            >
              <View style={styles.heroTop}>
                <IndianRupee color="rgba(255,255,255,0.9)" size={22} />
                <Text style={styles.heroLabel}>Total sales</Text>
              </View>
              <Text style={styles.heroValue}>₹ {Number(stats.total_sales).toFixed(2)}</Text>
            </LinearGradient>

            <View style={styles.grid}>
              <AppCard style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}>
                  <Package size={22} color={colors.primary} />
                </View>
                <Text style={styles.statLabel}>Products</Text>
                <Text style={styles.statVal}>{stats.total_products}</Text>
              </AppCard>
              <AppCard style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: colors.errorSoft }]}>
                  <AlertTriangle size={22} color={colors.error} />
                </View>
                <Text style={styles.statLabel}>Low stock</Text>
                <Text style={styles.statVal}>{stats.low_stock}</Text>
              </AppCard>
            </View>
          </>
        ) : (
          <AppCard>
            <Text style={styles.muted}>Stats could not be loaded. Pull to refresh.</Text>
          </AppCard>
        )}

        <AppCard style={{ marginTop: space.lg }}>
          <Text style={styles.tipTitle}>Tip</Text>
          <Text style={styles.tipBody}>
            Use Reports under More for a monthly sales overview. Profile is where you sign out.
          </Text>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  email: { ...typography.caption, marginTop: -8, marginBottom: space.lg },
  hero: {
    borderRadius: radii.xxl,
    padding: space.xl,
    marginBottom: space.lg,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: '600' },
  heroValue: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: -0.6,
  },
  grid: { flexDirection: 'row', gap: space.md },
  statCard: { flex: 1, padding: space.lg },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  statLabel: { ...typography.micro, color: colors.muted },
  statVal: { ...typography.title, fontSize: 24, marginTop: 4 },
  muted: { ...typography.body, color: colors.muted },
  tipTitle: { ...typography.h2, marginBottom: 6 },
  tipBody: { ...typography.subtitle, lineHeight: 22 },
});
