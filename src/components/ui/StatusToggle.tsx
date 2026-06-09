import React from 'react';
import { Switch, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../theme/tokens';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
};

export function StatusToggle({
  value,
  onValueChange,
  disabled,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}: Props) {
  const handleChange = (next: boolean) => {
    if (disabled || next === value) {
      return;
    }
    onValueChange(next);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, !value && styles.labelOff]}>{value ? activeLabel : inactiveLabel}</Text>
      <Switch
        value={value}
        onValueChange={handleChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        thumbColor={value ? colors.primary : colors.subtle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { ...typography.micro, color: colors.primary, fontWeight: '700', minWidth: 52 },
  labelOff: { color: colors.muted },
});
