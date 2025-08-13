import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useI18n } from './I18n';
import { useEffectiveScheme } from './ThemePreference';
import { palette } from '@/constants/Design';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: any | null;
  onCopyAll?: () => void;
};

const Line: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => (
  <Text selectable style={{ color, marginBottom: 4 }}>{label}: {formatValue(value)}</Text>
);

const SectionTitle: React.FC<{ children: React.ReactNode; color: string; border: string }> = ({ children, color, border }) => (
  <Text selectable style={[styles.sectionTitle, { color, borderTopColor: border }]}>{children}</Text>
);

const QuickSalesReportDetailsModal: React.FC<Props> = ({ visible, onClose, item, onCopyAll }) => {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    overlay: 'rgba(0,0,0,0.5)',
    surface: isDark ? '#111827' : palette.surface,
    border: isDark ? '#334155' : '#e5e7eb',
    text: isDark ? '#e5e7eb' : '#111827',
    muted: isDark ? '#94a3b8' : '#6b7280',
  };
  const handleCopyMD = async () => {
    if (!item) return;
    await Clipboard.setStringAsync(buildQuickSalesReportText(item, 'markdown'));
    Alert.alert(t('copied_to_clipboard') || 'Copied to clipboard');
  };
  const handleShare = async () => {
    if (!item) return;
    try { await Share.share({ message: buildQuickSalesReportText(item, 'text') }); } catch {}
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text selectable style={[styles.title, { color: colors.text }]}>{t('quick_sales_report') || 'Quick Sales Report'}</Text>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {!item ? (
              <Text style={{ color: colors.muted }}>{t('no_data') || 'No data'}</Text>
            ) : (
              <>
                <SectionTitle color={colors.muted} border={colors.border}>{t('personnel') || 'Personnel'}</SectionTitle>
                <Line color={colors.text} label={t('assigned_ba') || 'Assigned BA'} value={item.assignedToBA} />
                <Line color={colors.text} label={t('assigned_tl') || 'Assigned TL'} value={item.assignedToTL} />
                <Line color={colors.text} label={t('status') || 'Status'} value={item.taskSalesReportQuickStatus} />
                <Line color={colors.text} label={t('created') || 'Created'} value={tsToLocale(item.createdAt)} />

                <SectionTitle color={colors.muted} border={colors.border}>{t('outlet_venue') || 'Outlet / Venue'}</SectionTitle>
                <Line color={colors.text} label={t('outlet_id') || 'Outlet ID'} value={item.outletId} />
                <Line color={colors.text} label={t('outlet') || 'Outlet'} value={item.outletName} />
                <Line color={colors.text} label={t('province') || 'Province'} value={item.outletProvince} />
                <Line color={colors.text} label={t('city') || 'City'} value={item.outletCity} />
                <Line color={colors.text} label={t('tier') || 'Tier'} value={item.outletTier} />
                <Line color={colors.text} label={t('date') || 'Date'} value={tsToLocale(item.guardDate)} />

                <SectionTitle color={colors.muted} border={colors.border}>{t('guinness_selling') || 'Guinness Selling'}</SectionTitle>
                <Line color={colors.text} label="KEGS 330ml (glass)" value={item.salesKegs330} />
                <Line color={colors.text} label="KEGS 500ml (glass)" value={item.salesKegs500} />
                <Line color={colors.text} label="MD 500ml (can)" value={item.salesMd500} />
                <Line color={colors.text} label="GDIC 400ml (can)" value={item.salesGdic400} />
                <Line color={colors.text} label="Smooth Pint 330ml" value={item.salesSmoothPint330} />
                <Line color={colors.text} label="Smooth Can 330ml" value={item.salesSmoothCan330} />
                <Line color={colors.text} label="GFES Pint 330ml" value={item.salesGfesPint330} />
                <Line color={colors.text} label="GFES Can 330ml" value={item.salesGfesCan330} />
                <Line color={colors.text} label="GFES Quart 620ml" value={item.salesGfesQuart620} />
                <Line color={colors.text} label="GFES Can Big 500ml" value={item.salesGfesCanbig500} />

                <SectionTitle color={colors.muted} border={colors.border}>{t('restock') || 'Restock'}</SectionTitle>
                <Line color={colors.text} label={t('product_restock') || 'Product Restock'} value={yn(item.productRestock)} />
                <Line color={colors.text} label={t('restock_description') || 'Restock Description'} value={item.productRestockDescription} />
              </>
            )}
          </ScrollView>
          <View style={styles.buttonRow}>
            {onCopyAll && <Button title={t('copy') || 'Copy All'} onPress={onCopyAll} />}
            {item && <Button title={t('copy_md') || 'Copy MD'} onPress={handleCopyMD} />}
            {item && <Button title={t('share') || 'Share'} onPress={handleShare} />}
            <Button title={t('close') || 'Close'} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalContent: { width: '92%', backgroundColor: palette.surface, borderWidth: 1, padding: 16, borderRadius: 10, maxHeight: '85%' },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6, borderTopWidth: 1, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default QuickSalesReportDetailsModal;

export function buildQuickSalesReportText(item: any, format: 'text' | 'markdown' = 'text') {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (t: string) => (isMD ? `\n## ${t}\n` : `\n${t}\n`);
  const line = (l: string, v: any) => `${l}: ${formatValue(v)}`;
  const out: string[] = [];
  out.push(h('Personnel'));
  out.push(line('Assigned BA', item.assignedToBA));
  out.push(line('Assigned TL', item.assignedToTL));
  out.push(line('Status', item.taskSalesReportQuickStatus));
  out.push(line('Created', tsToLocale(item.createdAt)));
  out.push(h('Outlet / Venue'));
  out.push(line('Outlet ID', item.outletId));
  out.push(line('Outlet', item.outletName));
  out.push(line('Province', item.outletProvince));
  out.push(line('City', item.outletCity));
  out.push(line('Tier', item.outletTier));
  out.push(line('Date', tsToLocale(item.guardDate)));
  out.push(h('Guinness Selling'));
  out.push(line('KEGS 330ml (glass)', item.salesKegs330));
  out.push(line('KEGS 500ml (glass)', item.salesKegs500));
  out.push(line('MD 500ml (can)', item.salesMd500));
  out.push(line('GDIC 400ml (can)', item.salesGdic400));
  out.push(line('Smooth Pint 330ml', item.salesSmoothPint330));
  out.push(line('Smooth Can 330ml', item.salesSmoothCan330));
  out.push(line('GFES Pint 330ml', item.salesGfesPint330));
  out.push(line('GFES Can 330ml', item.salesGfesCan330));
  out.push(line('GFES Quart 620ml', item.salesGfesQuart620));
  out.push(line('GFES Can Big 500ml', item.salesGfesCanbig500));
  out.push(h('Restock'));
  out.push(line('Product Restock', yn(item.productRestock)));
  out.push(line('Restock Description', item.productRestockDescription));
  return out.join('\n');
}

function yn(val: any): string { if (val === true) return 'Yes'; if (val === false) return 'No'; return formatValue(val); }
function tsToLocale(value: any): string {
  try { if (value?.toDate) return value.toDate().toLocaleString(); } catch {}
  if (value instanceof Date) return value.toLocaleDateString();
  return formatValue(value);
}
function formatValue(v: any): string { if (v === null || v === undefined || v === '') return '-'; if (typeof v === 'boolean') return v ? 'Yes' : 'No'; return String(v); }
