import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { FolderTree, Pencil, Archive } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Screen, ScreenHeader, AppButton, AppInput, AppCard, EmptyState } from '../components/ui';
import { colors, radii, space, typography, TAB_BAR_CONTENT_INSET, shadows } from '../theme/tokens';

type Cat = { id: number; name: string };

export default function CategoriesScreen() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Cat[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Cat | null>(null);

  const load = useCallback(async () => {
    if (!token || !user?.company_id) {
      return;
    }
    const res = await apiFetch<{ status: boolean; data?: Cat[] }>('category/get_all.php', {
      method: 'GET',
      token,
      query: { company_id: user.company_id },
    });
    if (res.status && res.data) {
      setItems(res.data);
    }
  }, [token, user?.company_id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!token || !user?.company_id || !name.trim()) {
      return;
    }
    if (editing) {
      const res = await apiFetch<{ status: boolean; message?: string }>(
        'category/update.php',
        { body: { id: editing.id, name: name.trim() }, token }
      );
      if (res.status) {
        setModal(false);
        load();
      } else {
        Alert.alert('Error', res.message ?? '');
      }
    } else {
      const res = await apiFetch<{ status: boolean; message?: string }>(
        'category/create.php',
        { body: { name: name.trim(), company_id: user.company_id }, token }
      );
      if (res.status) {
        setModal(false);
        setName('');
        load();
      } else {
        Alert.alert('Error', res.message ?? '');
      }
    }
  };

  const remove = (c: Cat) => {
    Alert.alert('Archive category', c.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          if (!token) {
            return;
          }
          const res = await apiFetch('category/delete.php', {
            body: { id: c.id },
            token,
          });
          if ((res as { status: boolean }).status) {
            load();
          }
        },
      },
    ]);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Categories" subtitle="Organize your catalog" />
      <View style={styles.actions}>
        <AppButton
          title="Add category"
          onPress={() => {
            setEditing(null);
            setName('');
            setModal(true);
          }}
        />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: TAB_BAR_CONTENT_INSET + 16 }}
        renderItem={({ item }) => (
          <AppCard style={styles.listCard}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <FolderTree size={20} color={colors.primary} />
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <TouchableOpacity onPress={() => remove(item)} style={styles.iconBtn}>
                <Archive size={18} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditing(item);
                  setName(item.name);
                  setModal(true);
                }}
                style={styles.iconBtn}
              >
                <Pencil size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </AppCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        ListEmptyComponent={
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create a category to start grouping products."
          />
        }
      />

      <Modal visible={modal} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setModal(false)}>
          <Pressable style={styles.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{editing ? 'Edit category' : 'New category'}</Text>
            <AppInput placeholder="Category name" value={name} onChangeText={setName} />
            <View style={styles.modalRow}>
              <AppButton title="Cancel" variant="secondary" onPress={() => setModal(false)} style={{ flex: 1 }} />
              <AppButton title="Save" onPress={save} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: space.xl, marginBottom: space.md },
  listCard: { paddingVertical: 14, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flex: 1, ...typography.body, fontWeight: '700' },
  iconBtn: { padding: 8, borderRadius: radii.sm },
  modalBg: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: space.xl,
  },
  modalBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.xxl,
    padding: space.xl,
    ...shadows.lift,
  },
  modalTitle: { ...typography.h2, marginBottom: space.md },
  modalRow: { flexDirection: 'row', marginTop: space.lg, alignItems: 'stretch', gap: 12 },
});
