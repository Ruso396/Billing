import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, Shield, LogOut, ChevronRight, User, Settings, Bell } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Screen, ScreenHeader, AppCard } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

type MoreStackParamList = {
  MoreMenu: undefined;
  Reports: undefined;
  Profile: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, role, signOut } = useAuth();
  const initial = (user?.name ?? user?.email ?? '?').slice(0, 1).toUpperCase();

  const onSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Profile"
        subtitle="Manage your account"
        right={
          <Text style={styles.link} onPress={() => navigation.goBack()}>
            Back
          </Text>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + 32, paddingHorizontal: space.lg }}
      >
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarContainer}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <Text style={styles.name}>{user?.name ?? 'User'}</Text>
          <View style={[styles.badge, role === 'superadmin' && styles.badgeGold]}>
            <Text style={styles.badgeText}>{role ?? '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account Information</Text>
        <AppCard style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email ?? '—'}</Text>
            </View>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.row}>
            <View style={styles.iconContainer}>
              <Shield size={20} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Company ID</Text>
              <Text style={styles.rowValue}>
                {user?.company_id != null ? String(user.company_id) : 'Not assigned'}
              </Text>
            </View>
          </View>
        </AppCard>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <AppCard style={styles.card}>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
              <User size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Personal Details</Text>
            <ChevronRight size={20} color={colors.iconMuted} />
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
              <Bell size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Notifications</Text>
            <ChevronRight size={20} color={colors.iconMuted} />
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surfaceMuted }]}>
              <Settings size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
            <ChevronRight size={20} color={colors.iconMuted} />
          </TouchableOpacity>
        </AppCard>

        <TouchableOpacity style={styles.signOutButton} onPress={onSignOut} activeOpacity={0.8}>
          <LogOut size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: space.xl,
    marginBottom: space.sm,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadows.lift,
  },
  avatarText: { fontSize: 40, fontWeight: '800', color: colors.surface },
  name: { ...typography.title, fontSize: 24, marginBottom: 4 },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  badgeGold: { backgroundColor: '#FFF7ED' },
  badgeText: { fontSize: 13, fontWeight: '800', color: colors.primary, textTransform: 'capitalize' },
  sectionTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: space.sm,
    marginTop: space.sm,
    paddingHorizontal: 4,
  },
  card: {
    marginBottom: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { ...typography.micro, color: colors.muted, marginBottom: 2 },
  rowValue: { ...typography.body, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 16,
  },
  actionText: {
    flex: 1,
    ...typography.body,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.errorSoft,
    paddingVertical: 16,
    borderRadius: radii.lg,
    marginTop: space.sm,
    marginBottom: space.xl,
  },
  signOutText: {
    color: colors.error,
    fontWeight: '700',
    fontSize: 16,
  },
});
