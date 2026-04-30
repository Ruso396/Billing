import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows } from '../theme/tokens';

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.outer, { paddingBottom: bottomPad }]}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FBFF']}
        style={[styles.bar, shadows.tabBar]}
      >
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const { options } = descriptors[route.key];
            const label =
              (typeof options.tabBarLabel === 'string' && options.tabBarLabel) ||
              options.title ||
              route.name;
            const color = focused ? '#FFFFFF' : colors.iconMuted;
            const size = 22;

            const onPress = () => {
              const e = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !e.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const icon = options.tabBarIcon
              ? options.tabBarIcon({ focused, color, size })
              : null;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                activeOpacity={0.85}
                onPress={onPress}
                style={styles.tab}
              >
                {focused ? (
                  <LinearGradient
                    colors={[...colors.gradientPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activePill}
                  >
                    {icon}
                  </LinearGradient>
                ) : (
                  <View style={styles.iconSlot}>{icon}</View>
                )}
                <Text numberOfLines={1} style={[styles.label, focused && styles.labelActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 0,
  },
  bar: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  activePill: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlot: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    maxWidth: '100%',
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
