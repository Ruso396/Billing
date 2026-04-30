import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppInput, Loader } from '../components/ui';
import { colors, radii, space, typography, shadows } from '../theme/tokens';

export default function CreditSettingsScreen() {
  const { token, user } = useAuth();
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch<{ status: boolean; data?: { default_credit_days: number } }>('credit/get.php', {
        method: 'GET',
        query: { company_id: user.company_id },
        token,
      });
      if (res.status && res.data) {
        setDays(String(res.data.default_credit_days ?? 30));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token, user?.company_id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const parsed = parseInt(days, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validation', 'Enter valid credit days.');
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ status: boolean; message?: string }>('credit/save.php', {
        body: { company_id: user.company_id, default_credit_days: parsed },
        token,
      });
      if (res.status) {
        Alert.alert('Saved', 'Credit settings updated.');
      } else {
        Alert.alert('Error', res.message ?? 'Could not save settings.');
      }
    } catch (error) {
      Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <ScreenHeader title="Credit settings" subtitle="Payment terms" />
        <Loader message="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Credit settings" subtitle="Invoice due date policy" />
      <AppInput
        label="Default credit days"
        keyboardType="number-pad"
        value={days}
        onChangeText={setDays}
        style={styles.input}
      />
      <AppButton title={busy ? 'Saving…' : 'Save settings'} onPress={save} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: space.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderColor: colors.borderLight,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 16,
  },
});
