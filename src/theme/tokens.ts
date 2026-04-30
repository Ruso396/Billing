import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  bgTop: '#E3F0FF',
  bgMid: '#F5FAFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  primary: '#1D6DE5',
  primarySoft: '#E8F1FF',
  primaryDark: '#0B4AB0',
  accent: '#38BDF8',
  text: '#0F172A',
  textSecondary: '#475569',
  muted: '#64748B',
  subtle: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#EFF4FB',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  success: '#059669',
  successSoft: '#ECFDF5',
  iconMuted: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.45)',
  gradientPrimary: ['#3B8DFF', '#1D6DE5'] as const,
  gradientHero: ['#60A5FA', '#2563EB', '#1D4ED8'] as const,
  gradientSoft: ['#FFFFFF', '#F0F7FF'] as const,
};

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const space = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const typography = {
  hero: { fontSize: 28, fontWeight: '800' as TextStyle['fontWeight'], color: colors.text },
  title: { fontSize: 22, fontWeight: '800' as TextStyle['fontWeight'], color: colors.text },
  h2: { fontSize: 18, fontWeight: '700' as TextStyle['fontWeight'], color: colors.text },
  subtitle: { fontSize: 15, fontWeight: '500' as TextStyle['fontWeight'], color: colors.textSecondary },
  body: { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'], color: colors.text },
  caption: { fontSize: 13, fontWeight: '500' as TextStyle['fontWeight'], color: colors.muted },
  micro: { fontSize: 12, fontWeight: '600' as TextStyle['fontWeight'], color: colors.subtle },
};

export const shadows = {
  card: {
    shadowColor: '#1D6DE5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: Platform.OS === 'android' ? 3 : 5,
  } satisfies ViewStyle,
  lift: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: Platform.OS === 'android' ? 4 : 8,
  } satisfies ViewStyle,
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: Platform.OS === 'android' ? 12 : 18,
  } satisfies ViewStyle,
};

/** Extra bottom padding for scroll content above floating tab bar */
export const TAB_BAR_CONTENT_INSET = 96;
