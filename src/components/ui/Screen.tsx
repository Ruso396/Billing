import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';

type ScreenProps = {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
};

export function Screen({ children, edges = ['top', 'left', 'right'], style }: ScreenProps) {
  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid, colors.surface]}
      locations={[0, 0.45, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
});
