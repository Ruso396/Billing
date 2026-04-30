import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../../theme/tokens';

type AppCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
};

export function AppCard({ children, style, padded = true }: AppCardProps) {
  return <View style={[styles.card, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  padded: { padding: 18 },
});
