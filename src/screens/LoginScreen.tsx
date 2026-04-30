import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { AppButton, AppInput } from '../components/ui';
import { colors, radii, shadows, space, typography } from '../theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }
    setBusy(true);
    const r = await signIn(email.trim(), password);
    setBusy(false);
    if (!r.ok) {
      Alert.alert('Sign in failed', r.error ?? 'Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={[colors.bgTop, '#FFFFFF', colors.bgMid]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brandRow}>
              <LinearGradient colors={[...colors.gradientPrimary]} style={styles.logo}>
                <Sparkles color="#FFF" size={28} strokeWidth={1.75} />
              </LinearGradient>
              <View>
                <Text style={styles.brand}>My Billing</Text>
                <Text style={styles.tag}>Retail billing, simplified</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.welcome}>Welcome back</Text>
              <Text style={styles.hint}>Sign in with your work email</Text>
              <AppInput
                label="Email"
                placeholder="you@company.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
              <AppInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <AppButton title={busy ? 'Signing in…' : 'Sign in'} onPress={onSubmit} loading={busy} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.xxl,
    paddingBottom: space.xxl,
    justifyContent: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: space.xxl },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lift,
  },
  brand: { ...typography.hero, letterSpacing: -0.5 },
  tag: { ...typography.caption, color: colors.muted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  welcome: { ...typography.title },
  hint: { ...typography.subtitle, marginBottom: space.lg, marginTop: 6 },
});
