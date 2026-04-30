import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Building2, Archive } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppCard, EmptyState } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET } from '../theme/tokens';

type Company = {
  id: number;
  company_name: string;
  owner_email: string;
  phone: string;
};

export default function CompaniesScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [items, setItems] = useState<Company[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const remove = (c: Company) => {
    Alert.alert('Archive company', c.company_name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          if (!token) {
            return;
          }
          const res = await apiFetch<{ status: boolean; message?: string }>(
            'company/delete_company.php',
            { body: { id: c.id }, token }
          );
          if (res.status) {
            load();
          } else {
            Alert.alert('Error', res.message ?? '');
          }
        },
      },
    ]);
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
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Building2 size={22} color={colors.primary} />
              </View>
              <TouchableOpacity onPress={() => remove(item)} style={styles.archive}>
                <Archive size={18} color={colors.error} />
                <Text style={styles.archiveTxt}>Archive</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{item.company_name}</Text>
            <Text style={styles.meta}>{item.owner_email}</Text>
            {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
          </AppCard>
        )}
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
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archive: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 },
  archiveTxt: { ...typography.caption, color: colors.error, fontWeight: '700' },
  name: { ...typography.h2, fontSize: 18 },
  meta: { ...typography.caption, color: colors.muted, marginTop: 4 },
  phone: { ...typography.micro, marginTop: 4 },
});
