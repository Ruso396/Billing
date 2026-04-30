import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppInput } from '../components/ui';
import { apiFetch } from '../services/api';
import { colors, radii, shadows, space, typography } from '../theme/tokens';

export default function RegisterCompanyScreen() {
  const navigation = useNavigation();
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!companyName.trim() || !companyAddress.trim() || !companyCode.trim() || !phone.trim() || !ownerName.trim() || !ownerEmail.trim() || !ownerPassword.trim()) {
      Alert.alert('Validation', 'Please fill all required fields.');
      return;
    }
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      Alert.alert('Validation', 'Phone must be 10 digits.');
      return;
    }

    setBusy(true);
    try {
      const res = await apiFetch<{ status: boolean; message?: string }>('company/add_company.php', {
        body: {
          company_name: companyName.trim(),
          company_address: companyAddress.trim(),
          company_code: companyCode.trim(),
          gstin: gstin.trim(),
          phone: phone.trim(),
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim(),
          owner_password: ownerPassword,
          logo: '',
        },
      });
      if (res.status) {
        Alert.alert('Success', 'Company created successfully.', [
          { text: 'OK', onPress: () => navigation.navigate('Login' as never) },
        ]);
      } else {
        Alert.alert('Error', res.message ?? 'Could not create company.');
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
          <Text style={styles.title}>Register Company</Text>
          <Text style={styles.subtitle}>Create the company and the first admin account.</Text>
        </View>
        <View style={styles.card}>
          <AppInput label="Company name" value={companyName} onChangeText={setCompanyName} />
          <AppInput label="Address" value={companyAddress} onChangeText={setCompanyAddress} />
          <AppInput label="Company code" value={companyCode} onChangeText={setCompanyCode} />
          <AppInput label="GSTIN" value={gstin} onChangeText={setGstin} autoCapitalize="characters" />
          <AppInput label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <AppInput label="Owner name" value={ownerName} onChangeText={setOwnerName} />
          <AppInput label="Owner email" autoCapitalize="none" keyboardType="email-address" value={ownerEmail} onChangeText={setOwnerEmail} />
          <AppInput label="Owner password" secureTextEntry value={ownerPassword} onChangeText={setOwnerPassword} />
          <AppButton title={busy ? 'Saving…' : 'Create company'} onPress={submit} loading={busy} />
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
});
