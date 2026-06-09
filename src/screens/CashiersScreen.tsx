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
  Pressable,
} from 'react-native';
import { UserPlus, Users, Mail } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppInput, AppCard, EmptyState, StatusToggle } from '../components/ui';
import { useStatusToggle } from '../hooks/useStatusToggle';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';
import { isActiveStatus, statusFromEnabled } from '../utils/status';

type Cashier = { id: number; name: string; email: string; status?: string };

const MAX_CASHIERS = 3;

export default function CashiersScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Cashier[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isPending, toggleStatus } = useStatusToggle(setItems);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Cashier[] }>('cashier/get_cashiers.php', {
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

  const register = async () => {
    if (!token || !user?.company_id || !name.trim() || !email.trim() || !password) {
      Alert.alert('Validation', 'Fill all fields');
      return;
    }
    const res = await apiFetch<{ status: boolean; message?: string; request_sent?: boolean }>('auth/register.php', {
      body: {
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'cashier',
        company_id: user.company_id,
        requested_by: user.id,
      },
      token,
    });
    if (res.status) {
      setModal(false);
      setName('');
      setEmail('');
      setPassword('');
      load();
      Alert.alert('Success', res.message ?? 'Cashier created.');
    } else if (res.request_sent) {
      setModal(false);
      setName('');
      setEmail('');
      setPassword('');
      Alert.alert(
        'Approval required',
        `Your company already has ${MAX_CASHIERS} cashiers. A request was sent to Super Admin for approval.`
      );
    } else {
      Alert.alert('Error', res.message ?? 'Registration failed');
    }
  };

  const toggleCashier = (c: Cashier, enabled: boolean) => {
    if (!token) return;
    void toggleStatus(c, enabled, () =>
      apiFetch<{ success: boolean; message?: string }>('cashier/toggle_status_cashier.php', {
        body: { id: c.id, status: statusFromEnabled(enabled) },
        token,
      }),
    );
  };

  const activeCount = items.filter((c) => isActiveStatus(c.status)).length;

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Cashiers" subtitle={`Team access (${activeCount}/${MAX_CASHIERS} active)`} />
      <View style={styles.actions}>
        <AppButton title="Register cashier" onPress={() => setModal(true)} />
        <Text style={styles.limitNote}>
          Maximum {MAX_CASHIERS} cashiers per company. A 4th requires Super Admin approval.
        </Text>
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
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{item.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.mailRow}>
                  <Mail size={14} color={colors.muted} />
                  <Text style={styles.email}>{item.email}</Text>
                </View>
              </View>
              <StatusToggle
                value={isActive}
                disabled={isPending(item.id)}
                onValueChange={(v) => toggleCashier(item, v)}
              />
            </AppCard>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon={Users}
            title="No cashiers yet"
            description="Register staff so they can sign in and bill on the floor."
          />
        }
      />

      <Modal visible={modal} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHead}>
              <UserPlus color={colors.primary} size={26} />
              <Text style={styles.modalTitle}>New cashier</Text>
            </View>
            <AppInput placeholder="Full name" value={name} onChangeText={setName} />
            <AppInput
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <AppInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <View style={styles.modalRow}>
              <AppButton title="Cancel" variant="secondary" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <AppButton title="Create" onPress={register} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: space.xl, marginBottom: space.md, gap: 8 },
  limitNote: { ...typography.caption, color: colors.muted },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: space.md },
  inactive: { opacity: 0.65 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { fontSize: 20, fontWeight: '800', color: colors.primary },
  name: { ...typography.body, fontWeight: '700' },
  mailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  email: { ...typography.caption, color: colors.muted },
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
    ...shadows.lift,
  },
  modalHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: space.md },
  modalTitle: { ...typography.h2 },
  modalRow: { flexDirection: 'row', marginTop: space.lg, gap: 12 },
});
