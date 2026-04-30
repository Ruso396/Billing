import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppButton, AppInput } from '../components/ui';
import { apiFetch } from '../services/api';
import { colors, radii, shadows, space, typography } from '../theme/tokens';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert('Missing details', 'Please fill all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ status: boolean; message?: string }>('auth/forgot_password.php', {
        body: { email: email.trim(), password },
      });
      if (res.status) {
        Alert.alert('Success', 'Password updated successfully.', [
          { text: 'Back to login', onPress: () => navigation.navigate('Login' as never) },
        ]);
      } else {
        Alert.alert('Error', res.message ?? 'Unable to update password');
      }
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>Reset your login password using your registered email.</Text>
        </View>
        <View style={styles.card}>
          <AppInput label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <AppInput label="New password" secureTextEntry value={password} onChangeText={setPassword} />
          <AppInput label="Confirm password" secureTextEntry value={confirm} onChangeText={setConfirm} />
          <AppButton title={busy ? 'Saving…' : 'Reset password'} onPress={onSubmit} loading={busy} />
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.link}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgMid },
  content: { flexGrow: 1, padding: space.xl, paddingTop: space.xl },
  header: { marginBottom: space.lg },
  title: { ...typography.hero, marginBottom: 8 },
  subtitle: { ...typography.subtitle, color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: space.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  linkRow: { marginTop: space.md, alignItems: 'center' },
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
