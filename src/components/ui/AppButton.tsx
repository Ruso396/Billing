import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadows } from '../../theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function AppButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
  textStyle,
}: AppButtonProps) {
  const busy = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={busy}
        style={[styles.touch, style]}
      >
        <LinearGradient
          colors={busy ? [colors.subtle, colors.muted] : [...colors.gradientPrimary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryBtn, shadows.lift, styles.primaryFill]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const palette: Record<
    Exclude<Variant, 'primary'>,
    { bg: string; border: string; color: string }
  > = {
    secondary: { bg: colors.surface, border: colors.border, color: colors.text },
    ghost: { bg: 'transparent', border: 'transparent', color: colors.primary },
    danger: { bg: colors.errorSoft, border: colors.error, color: colors.error },
    success: { bg: colors.successSoft, border: colors.success, color: colors.success },
  };

  const p = palette[variant as keyof typeof palette];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={busy}
      style={[
        styles.outlineBtn,
        { backgroundColor: p.bg, borderColor: p.border },
        variant === 'ghost' && styles.noBorder,
        busy && styles.dim,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={p.color} />
      ) : (
        <Text style={[styles.outlineText, { color: p.color }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: { borderRadius: radii.lg, alignSelf: 'stretch' },
  primaryFill: { width: '100%' },
  primaryBtn: {
    paddingVertical: 16,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1.5,
  },
  noBorder: { borderWidth: 0 },
  outlineText: { fontSize: 16, fontWeight: '700' },
  dim: { opacity: 0.65 },
});

export default AppButton;
