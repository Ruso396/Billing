import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarChart2, ChevronRight, UserCircle, Wallet, Percent, Settings, Clock, UserCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { Screen, ScreenHeader, AppCard } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET } from '../theme/tokens';

export type MoreStackParamList = {
  MoreMenu: undefined;
  Reports: undefined;
  PaymentPending: undefined;
  CashierRequests: undefined;
  CreditSettings: undefined;
  TaxSettings: undefined;
  Settings: undefined;
  Profile: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, 'MoreMenu'>;
};

const baseRows: {
  key: keyof MoreStackParamList;
  title: string;
  subtitle: string;
  icon: typeof BarChart2;
  roles?: ('superadmin' | 'admin' | 'cashier')[];
}[] = [
  {
    key: 'Reports',
    title: 'Reports',
    subtitle: 'Monthly sales and Excel export',
    icon: BarChart2,
  },
  {
    key: 'PaymentPending',
    title: 'Pending invoices',
    subtitle: 'Unpaid and partially paid bills',
    icon: Clock,
  },
  {
    key: 'CashierRequests',
    title: 'Cashier requests',
    subtitle: 'Approve cashiers beyond the 3-user limit',
    icon: UserCheck,
    roles: ['superadmin'],
  },
  {
    key: 'CreditSettings',
    title: 'Credit Settings',
    subtitle: 'Company default credit days',
    icon: Wallet,
    roles: ['admin', 'cashier'],
  },
  {
    key: 'TaxSettings',
    title: 'Tax Settings',
    subtitle: 'Configure tax rates and rules',
    icon: Percent,
  },
  {
    key: 'Settings',
    title: 'Settings',
    subtitle: 'Application and account preferences',
    icon: Settings,
  },
  {
    key: 'Profile',
    title: 'Profile',
    subtitle: 'Account and sign out',
    icon: UserCircle,
  },
];

export default function MoreMenuScreen({ navigation }: Props) {
  const { role } = useAuth();
  const rows = baseRows.filter((row) => !row.roles || (role && row.roles.includes(role)));

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="More" subtitle="Tools and account" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + 24, paddingHorizontal: space.xl }}
      >
        <AppCard>
          {rows.map((row, i) => {
            const Icon = row.icon;
            return (
              <Pressable
                key={row.key}
                onPress={() => navigation.navigate(row.key)}
                style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}
              >
                <View style={styles.iconWrap}>
                  <Icon size={22} color={colors.primary} strokeWidth={1.75} />
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.rowTitle}>{row.title}</Text>
                  <Text style={styles.rowSub}>{row.subtitle}</Text>
                </View>
                <ChevronRight size={20} color={colors.subtle} />
              </Pressable>
            );
          })}
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pressed: { opacity: 0.92 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  rowTitle: { ...typography.h2, fontSize: 17 },
  rowSub: { ...typography.caption, color: colors.muted, marginTop: 2 },
});
