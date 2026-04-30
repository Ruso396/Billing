import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, space, typography } from '../../theme/tokens';
import { AppCard } from './AppCard';

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  description?: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Icon size={28} color={colors.primary} strokeWidth={1.75} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: space.xl, marginTop: space.lg },
  inner: { alignItems: 'center', paddingVertical: space.xxl },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  title: { ...typography.h2, textAlign: 'center' },
  desc: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 20,
    paddingHorizontal: space.md,
  },
});
