import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Screen, ScreenHeader, AppInput, AppButton } from '../components/ui';
import { colors, radii, space, typography } from '../theme/tokens';

export default function SettingsScreen() {
  const [shopName, setShopName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [busy, setBusy] = useState(false);

  const save = () => {
    setBusy(true);
    Alert.alert('Saved', 'Settings have been saved locally.');
    setBusy(false);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Settings" subtitle="Shop profile" />
      <AppInput label="Shop name" value={shopName} onChangeText={setShopName} />
      <AppInput label="GST number" value={gstNumber} onChangeText={setGstNumber} autoCapitalize="characters" />
      <AppButton title={busy ? 'Saving…' : 'Save settings'} onPress={save} loading={busy} />
    </Screen>
  );
}
