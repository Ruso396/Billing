import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Plus, Trash2, Percent } from 'lucide-react-native';
import { Screen, ScreenHeader, AppButton, AppInput, AppCard, EmptyState } from '../components/ui';
import { colors, radii, space, typography } from '../theme/tokens';

type TaxItem = { id: string; name: string; percent: string };

const initialTaxes: TaxItem[] = [
  { id: 'gst-18', name: 'GST 18%', percent: '18' },
  { id: 'gst-5', name: 'GST 5%', percent: '5' },
];

export default function TaxSettingsScreen() {
  const [taxes, setTaxes] = useState<TaxItem[]>(initialTaxes);
  const [name, setName] = useState('');
  const [percent, setPercent] = useState('');

  const addTax = () => {
    if (!name.trim() || !percent.trim()) {
      Alert.alert('Validation', 'Enter a name and percentage.');
      return;
    }
    const parsed = Number(percent);
    if (Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Validation', 'Enter a valid percentage.');
      return;
    }
    setTaxes((prev) => [
      ...prev,
      { id: `${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, name: name.trim(), percent: String(parsed) },
    ]);
    setName('');
    setPercent('');
  };

  const removeTax = (id: string) => {
    setTaxes((prev) => prev.filter((tax) => tax.id !== id));
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Tax settings" subtitle="Manage tax rates" />
      <View style={styles.formRow}>
        <AppInput label="Tax name" value={name} onChangeText={setName} />
        <AppInput label="Percent" keyboardType="number-pad" value={percent} onChangeText={setPercent} />
        <AppButton title="Add tax" onPress={addTax} />
      </View>
      <FlatList
        data={taxes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: space.xl }}
        renderItem={({ item }) => (
          <AppCard style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub}>{item.percent}%</Text>
              </View>
              <TouchableOpacity style={styles.trash} onPress={() => removeTax(item.id)}>
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={Percent}
            title="No tax rates"
            description="Add tax categories used in your invoices."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  formRow: { paddingHorizontal: space.xl, gap: space.md, marginBottom: space.md },
  card: { padding: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  name: { ...typography.body, fontWeight: '700' },
  sub: { ...typography.caption, color: colors.muted, marginTop: 4 },
  trash: { padding: 8, borderRadius: radii.md },
});
