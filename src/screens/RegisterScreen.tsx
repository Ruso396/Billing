import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppButton, AppInput } from '../components/ui';
import { apiFetch } from '../services/api';
import { colors, radii, shadows, space, typography } from '../theme/tokens';

const roles = [
  { value: 'cashier', label: 'Cashier' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Superadmin' },
];

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [role, setRole] = useState('cashier');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please fill all required fields.');
      return;
    }

    if (role !== 'superadmin' && !/^[0-9]+$/.test(companyId.trim())) {
      Alert.alert('Company required', 'Please enter a valid company ID.');
      return;
    }

    setBusy(true);

    try {
      const res = await apiFetch<{ status: boolean; message?: string }>('auth/register.php', {
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          company_id: role === 'superadmin' ? undefined : Number(companyId.trim()),
        },
      });

      if (res.status) {
        Alert.alert('Success', 'Account created successfully.', [
          { text: 'Back to login', onPress: () => navigation.navigate('Login' as never) },
        ]);
      } else {
        Alert.alert('Error', res.message ?? 'Could not create account.');
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
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Create a new account for the billing app.</Text>
        </View>

        <View style={styles.card}>
          <AppInput label="Full name" value={name} onChangeText={setName} />
          <AppInput label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <AppInput label="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {roles.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.roleTag, role === option.value && styles.roleTagActive]}
                onPress={() => setRole(option.value)}
              >
                <Text style={[styles.roleText, role === option.value && styles.roleTextActive]}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {role !== 'superadmin' && (
            <AppInput
              label="Company ID"
              keyboardType="number-pad"
              value={companyId}
              onChangeText={setCompanyId}
            />
          )}
          <AppButton title={busy ? 'Creating…' : 'Create account'} onPress={handleSubmit} loading={busy} />

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
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: 8, marginTop: space.md },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: space.md },
  roleTag: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  roleTagActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleText: { ...typography.body, color: colors.text },
  roleTextActive: { color: colors.primary, fontWeight: '700' },
  linkRow: { marginTop: space.md, alignItems: 'center' },
  link: { ...typography.caption, color: colors.primary, fontWeight: '700' },
});
