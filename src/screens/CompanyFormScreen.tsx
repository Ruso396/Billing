import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { AppButton, AppInput } from '../components/ui';
import { colors, space } from '../theme/tokens';

export default function CompanyFormScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [company_name, setCompanyName] = useState('');
  const [company_address, setAddr] = useState('');
  const [company_code, setCode] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [owner_name, setOwnerName] = useState('');
  const [owner_email, setOwnerEmail] = useState('');
  const [owner_password, setOwnerPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!token) {
      Alert.alert('Session', 'Not signed in. Please log in again.');
      return;
    }
    if (!company_name.trim() || !owner_name.trim() || !owner_email.trim() || !owner_password) {
      Alert.alert('Validation', 'Company name, owner name, email and password are required');
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ status: boolean; message?: string }>('company/add_company.php', {
        body: {
          company_name: company_name.trim(),
          company_address: company_address.trim(),
          company_code: company_code.trim(),
          gstin: gstin.trim(),
          phone: phone.trim(),
          logo: '',
          owner_name: owner_name.trim(),
          owner_email: owner_email.trim(),
          owner_password,
        },
        token,
      });
      if (res.status) {
        Alert.alert('Done', 'Company created', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        Alert.alert('Error', res.message ?? 'Failed');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Request failed', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.bgTop, colors.bgMid, colors.surface]}
      locations={[0, 0.4, 1]}
      style={styles.flex}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppInput label="Company name *" value={company_name} onChangeText={setCompanyName} />
        <AppInput label="Address" value={company_address} onChangeText={setAddr} />
        <AppInput label="Company code" value={company_code} onChangeText={setCode} />
        <AppInput label="GSTIN" value={gstin} onChangeText={setGstin} />
        <AppInput label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <AppInput label="Owner name *" value={owner_name} onChangeText={setOwnerName} />
        <AppInput
          label="Owner email *"
          value={owner_email}
          onChangeText={setOwnerEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AppInput
          label="Owner password *"
          value={owner_password}
          onChangeText={setOwnerPassword}
          secureTextEntry
        />
        <AppButton title={busy ? 'Saving…' : 'Create company'} onPress={submit} loading={busy} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: space.xl,
    paddingBottom: 48,
    backgroundColor: 'transparent',
  },
});
