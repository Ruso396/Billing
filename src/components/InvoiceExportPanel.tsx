import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CalendarRange, Check, ChevronDown, FileSpreadsheet } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import {
  DateFilter,
  ExportInvoice,
  PaymentFilter,
  exportInvoicesToExcel,
  filterInvoicesForExport,
} from '../utils/invoiceExport';
import { colors, radii, shadows, space, typography } from '../theme/tokens';

const EXCEL_GREEN = '#1D6F42';
const EXCEL_GREEN_DARK = '#185C38';

type Props = {
  invoices: ExportInvoice[];
};

const DATE_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const PAYMENT_OPTIONS: { key: PaymentFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'card', label: 'Card' },
  { key: 'credit', label: 'Credit' },
];

const CUSTOMER_FILTER_ALL = '__all__';

/** White spreadsheet + “X” mark for Excel-style export button */
function ExcelIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke="#FFFFFF" strokeWidth={1.5} fill="rgba(255,255,255,0.12)" />
      <Path
        d="M8 7.5 11 12 8 16.5M13.5 7.5H15c1.5 0 2.5.9 2.5 2.1 0 1.1-.8 2-2.2 2.1H13.5V16.5"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4 9h16M4 12h16M4 15h16" stroke="#FFFFFF" strokeWidth={0.5} opacity={0.35} />
    </Svg>
  );
}

export function InvoiceExportPanel({ invoices }: Props) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('daily');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState(CUSTOMER_FILTER_ALL);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [paymentPickerOpen, setPaymentPickerOpen] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectedPaymentLabel =
    PAYMENT_OPTIONS.find((o) => o.key === paymentFilter)?.label ?? 'All';
  const customerTypeOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      const val = String((inv as ExportInvoice & { customer_type?: string }).customer_type || '').trim();
      if (val) set.add(val);
    });
    return [CUSTOMER_FILTER_ALL, ...Array.from(set)];
  }, [invoices]);
  const hasCustomerType = customerTypeOptions.length > 1;
  const selectedCustomerTypeLabel =
    customerTypeFilter === CUSTOMER_FILTER_ALL ? 'All customers' : customerTypeFilter;

  const filteredInvoices = useMemo(() => {
    const base = filterInvoicesForExport(invoices, dateFilter, paymentFilter);
    if (!hasCustomerType || customerTypeFilter === CUSTOMER_FILTER_ALL) {
      return base;
    }
    return base.filter((inv) => {
      const val = String((inv as ExportInvoice & { customer_type?: string }).customer_type || '').trim();
      return val === customerTypeFilter;
    });
  }, [invoices, dateFilter, paymentFilter, hasCustomerType, customerTypeFilter]);

  const runExport = async () => {
    setBusy(true);
    try {
      await exportInvoicesToExcel(filteredInvoices, `${dateFilter}-${paymentFilter}`);
      setExportModalOpen(false);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export file.');
    } finally {
      setBusy(false);
    }
  };

  const previewCount = filteredInvoices.length;

  return (
    <View style={styles.inlineWrap}>
      <TouchableOpacity
        style={[styles.inlineDownloadBtn, busy && styles.inlineDownloadBtnBusy]}
        onPress={() => setExportModalOpen(true)}
        activeOpacity={0.88}
      >
        <ExcelIcon size={20} />
        <Text style={styles.inlineDownloadText}>Download Excel</Text>
      </TouchableOpacity>

      <Modal
        visible={exportModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalOpen(false)}
      >
        <Pressable style={styles.exportModalOverlay} onPress={() => setExportModalOpen(false)}>
          <Pressable style={styles.exportModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.head}>
              <View style={styles.headIcon}>
                <FileSpreadsheet size={20} color={EXCEL_GREEN} strokeWidth={2} />
              </View>
              <View style={styles.headText}>
                <Text style={styles.title}>Export to Excel</Text>
                <Text style={styles.subtitle}>Choose filters and download your spreadsheet</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <CalendarRange size={14} color={colors.muted} />
                <Text style={styles.label}>Date range</Text>
              </View>
              <View style={styles.chips}>
                {DATE_OPTIONS.map((o) => (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.chip, dateFilter === o.key && styles.chipOn]}
                    onPress={() => setDateFilter(o.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, dateFilter === o.key && styles.chipTextOn]}>{o.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Payment type</Text>
              <TouchableOpacity
                style={styles.select}
                onPress={() => setPaymentPickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectValue}>{selectedPaymentLabel}</Text>
                <ChevronDown size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {hasCustomerType ? (
              <View style={styles.section}>
                <Text style={styles.label}>Customer type</Text>
                <TouchableOpacity
                  style={styles.select}
                  onPress={() => setCustomerPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.selectValue}>{selectedCustomerTypeLabel}</Text>
                  <ChevronDown size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.footer}>
              <View style={styles.countBadge}>
                <Text style={styles.countNumber}>{previewCount}</Text>
                <Text style={styles.countLabel}>invoice{previewCount === 1 ? '' : 's'} match filters</Text>
              </View>

              <TouchableOpacity
                style={[styles.excelBtn, busy && styles.excelBtnBusy]}
                onPress={runExport}
                disabled={busy}
                activeOpacity={0.88}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <ExcelIcon size={24} />
                    <Text style={styles.excelBtnText}>Download Excel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setExportModalOpen(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={paymentPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentPickerOpen(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setPaymentPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Payment type</Text>
            <Text style={styles.pickerSubtitle}>Choose which payments to include in the export</Text>
            {PAYMENT_OPTIONS.map((o) => {
              const selected = paymentFilter === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  style={[styles.pickerItem, selected && styles.pickerItemOn]}
                  onPress={() => {
                    setPaymentFilter(o.key);
                    setPaymentPickerOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pickerItemText, selected && styles.pickerItemTextOn]}>{o.label}</Text>
                  {selected ? <Check size={20} color={EXCEL_GREEN} strokeWidth={2.5} /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.pickerClose} onPress={() => setPaymentPickerOpen(false)}>
              <Text style={styles.pickerCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={customerPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomerPickerOpen(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setCustomerPickerOpen(false)}>
          <Pressable style={styles.pickerSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>Customer type</Text>
            <Text style={styles.pickerSubtitle}>Filter by customer segment if available</Text>
            {customerTypeOptions.map((option) => {
              const selected = customerTypeFilter === option;
              const label = option === CUSTOMER_FILTER_ALL ? 'All' : option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.pickerItem, selected && styles.pickerItemOn]}
                  onPress={() => {
                    setCustomerTypeFilter(option);
                    setCustomerPickerOpen(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pickerItemText, selected && styles.pickerItemTextOn]}>{label}</Text>
                  {selected ? <Check size={20} color={EXCEL_GREEN} strokeWidth={2.5} /> : null}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.pickerClose} onPress={() => setCustomerPickerOpen(false)}>
              <Text style={styles.pickerCloseText}>Done</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineWrap: {
    marginBottom: space.md,
  },
  inlineDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: EXCEL_GREEN,
    borderRadius: radii.lg,
    paddingVertical: 15,
    minHeight: 52,
    ...shadows.card,
    shadowColor: EXCEL_GREEN_DARK,
  },
  inlineDownloadBtnBusy: {
    opacity: 0.85,
  },
  inlineDownloadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  exportModalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
  },
  exportModalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lift,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: space.md,
  },
  headIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#E8F5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1 },
  title: { ...typography.h2, fontSize: 17 },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: space.md,
  },
  section: { marginBottom: space.lg },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  label: {
    ...typography.micro,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  chipTextOn: {
    color: colors.primary,
    fontWeight: '800',
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.surfaceMuted,
    gap: 10,
  },
  selectValue: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  footer: {
    gap: space.md,
    paddingTop: space.xs,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  countNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: EXCEL_GREEN,
  },
  countLabel: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: EXCEL_GREEN,
    borderRadius: radii.lg,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 54,
    ...shadows.lift,
    shadowColor: EXCEL_GREEN_DARK,
  },
  excelBtnBusy: {
    opacity: 0.9,
  },
  excelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    marginTop: space.md,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  cancelBtnText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingTop: space.lg,
    paddingBottom: 28,
    paddingHorizontal: space.lg,
    ...shadows.lift,
  },
  pickerTitle: {
    ...typography.h2,
    marginBottom: 4,
  },
  pickerSubtitle: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: space.md,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceMuted,
  },
  pickerItemOn: {
    borderColor: EXCEL_GREEN,
    backgroundColor: '#E8F5EE',
  },
  pickerItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pickerItemTextOn: {
    color: EXCEL_GREEN,
    fontWeight: '800',
  },
  pickerClose: {
    marginTop: space.sm,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  pickerCloseText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.muted,
  },
});
