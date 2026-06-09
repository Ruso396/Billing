import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Building2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppCard, EmptyState, StatusToggle } from '../components/ui';
import { useStatusToggle } from '../hooks/useStatusToggle';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET } from '../theme/tokens';
import { isActiveStatus, statusFromEnabled } from '../utils/status';

type Company = {
  id: number;
  company_name: string;
  owner_email: string;
  phone: string;
  status?: string;
};

export default function CompaniesScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState<Company[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isPending, toggleStatus } = useStatusToggle(setItems);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Company[] }>('company/get_companies.php', {
      method: 'GET',
      token,
    });
    if (res.status && res.data) {
      setItems(res.data);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleCompany = (c: Company, enabled: boolean) => {
    if (!token) return;
    void toggleStatus(c, enabled, () =>
      apiFetch<{ success: boolean; message?: string }>('company/toggle_company_status.php', {
        body: { id: c.id, company_status: statusFromEnabled(enabled) },
        token,
      }),
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Companies" subtitle="Superadmin directory" />
      <View style={styles.actions}>
        <AppButton
          title="Add company"
          onPress={() => navigation.getParent()?.navigate('CompanyForm' as never)}
        />
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
        renderItem={({ item }) => {
          const isActive = isActiveStatus(item.status);
          return (
            <AppCard style={[styles.card, !isActive && styles.inactive]}>
              <View style={styles.rowTop}>
                <View style={styles.iconWrap}>
                  <Building2 size={22} color={colors.primary} />
                </View>
                <StatusToggle
                  value={isActive}
                  disabled={isPending(item.id)}
                  onValueChange={(v) => toggleCompany(item, v)}
                  activeLabel="Active"
                  inactiveLabel="Inactive"
                />
              </View>
              <Text style={styles.name}>{item.company_name}</Text>
              <Text style={styles.meta}>{item.owner_email}</Text>
              {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
            </AppCard>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon={Building2}
            title="No companies yet"
            description="Onboard a tenant with owner credentials in one flow."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: space.xl, marginBottom: space.md },
  card: { padding: space.lg },
  inactive: { opacity: 0.65 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { ...typography.h2, fontSize: 18 },
  meta: { ...typography.caption, color: colors.muted, marginTop: 4 },
  phone: { ...typography.micro, marginTop: 4 },
});
