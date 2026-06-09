import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Alert } from 'react-native';
import { isActiveStatus, statusFromEnabled } from '../utils/status';

type WithId = { id: number; status?: string };

type ToggleApiResult = { success: boolean; message?: string };

/**
 * Optimistic enable/disable for list rows.
 * Updates local list state immediately so controlled Switch values stay in sync (no flicker).
 */
export function useStatusToggle<T extends WithId>(
  setItems: Dispatch<SetStateAction<T[]>>,
) {
  const pendingRef = useRef(new Set<number>());
  const [, setPendingTick] = useState(0);

  const isPending = useCallback((id: number) => pendingRef.current.has(id), []);

  const setPending = useCallback((id: number, pending: boolean) => {
    if (pending) {
      pendingRef.current.add(id);
    } else {
      pendingRef.current.delete(id);
    }
    setPendingTick((n) => n + 1);
  }, []);

  const patchItemStatus = useCallback(
    (id: number, enabled: boolean) => {
      const status = statusFromEnabled(enabled);
      setItems((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
    },
    [setItems],
  );

  const toggleStatus = useCallback(
    async (item: T, enabled: boolean, request: () => Promise<ToggleApiResult>) => {
      const { id } = item;
      if (pendingRef.current.has(id)) {
        return;
      }
      if (isActiveStatus(item.status) === enabled) {
        return;
      }

      const previousStatus = item.status;
      setPending(id, true);
      patchItemStatus(id, enabled);

      try {
        const res = await request();
        if (!res.success) {
          patchItemStatus(id, isActiveStatus(previousStatus));
          Alert.alert('Error', res.message ?? 'Could not update status');
        }
      } catch {
        patchItemStatus(id, isActiveStatus(previousStatus));
        Alert.alert('Error', 'Could not update status');
      } finally {
        setPending(id, false);
      }
    },
    [patchItemStatus, setPending],
  );

  return { isPending, toggleStatus };
}
