import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useI18n } from './I18n';
import { useEffectiveScheme } from './ThemePreference';
import { palette } from '@/constants/Design';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: any | null;
  onCopyAll?: () => void;
  // Optional helpers for resolving display names without additional queries
  userNames?: Record<string, string>;
  outlets?: Array<{ id: string; outletName?: string }>;
};

const TaskAttendanceDetailsModal: React.FC<Props> = ({ visible, onClose, item, onCopyAll, userNames, outlets }) => {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const textColor = { color: isDark ? '#e5e7eb' : '#111827' };
  const sectionBorder = { borderTopColor: isDark ? '#334155' : '#ccc' };

  const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <Text selectable style={textColor}>{label}: {formatValue(value)}</Text>
  );
  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Text selectable style={[styles.sectionTitle, sectionBorder, textColor]}>{children}</Text>
  );

  const handleCopyMD = async () => {
    if (!item) return;
    await Clipboard.setStringAsync(buildTaskAttendanceText(item, 'markdown', { userNames, outlets }));
    Alert.alert(t('copied_to_clipboard') || 'Copied to clipboard');
  };
  const handleShare = async () => { if (!item) return; try { await Share.share({ message: buildTaskAttendanceText(item, 'text', { userNames, outlets }) }); } catch {} };

  const resolveUserName = (uid?: string | null) => {
    if (!uid) return '-';
    return (userNames && userNames[uid]) || uid;
  };
  const resolveOutletName = (outletId?: string | null, fallbackName?: string | null) => {
    if (!outletId && !fallbackName) return '-';
    const resolved = outlets?.find(o => o.id === outletId)?.outletName;
    return resolved || fallbackName || outletId || '-';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#111827' : palette.surface, borderColor: isDark ? '#334155' : '#e5e7eb' }]}>
          <Text selectable style={[styles.title, textColor]}>{t('attendance') || 'Attendance'}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
            {!item ? <Text style={textColor}>{t('no_data') || 'No data'}</Text> : (
              <>
              <SectionTitle>{t('personnel') || 'Personnel'}</SectionTitle>
              <Line label={t('assigned_ba') || 'Assigned BA'} value={resolveUserName(item.assignedToBA)} />
              <Line label={t('assigned_tl') || 'Assigned TL'} value={resolveUserName(item.assignedToTL)} />
              <Line label={t('status') || 'Status'} value={item.status} />
              <Line label={t('created') || 'Created'} value={tsToLocale(item.createdAt)} />

              <SectionTitle>{t('shift') || 'Shift'}</SectionTitle>
              <Line label={t('date') || 'Date'} value={dateOnly(item.shiftDate || item.date)} />
              <Line label={t('shift') || 'Shift'} value={item.shiftName || item.shift} />
              <Line label={t('check_in_time') || 'Check-in Time'} value={tsToLocale(item.checkInAt)} />
              <Line label={t('check_out_time') || 'Check-out Time'} value={tsToLocale(item.checkOutAt)} />
              <Line label={t('check_in_location') || 'Check-in Location'} value={formatLatLng(item.checkInLat, item.checkInLng)} />
              <Line label={t('check_out_location') || 'Check-out Location'} value={formatLatLng(item.checkOutLat, item.checkOutLng)} />

              <SectionTitle>{t('outlet') || 'Outlet'}</SectionTitle>
              <Line label={t('outlet_id') || 'Outlet ID'} value={resolveOutletName(item.outletId, item.outletName)} />
              <Line label={t('province') || 'Province'} value={item.locationProvince} />
              <Line label={t('city') || 'City'} value={item.locationCity} />
              <Line label={t('outlet') || 'Outlet'} value={resolveOutletName(item.outletId, item.outletName)} />

              <SectionTitle>{t('photos') || 'Photos'}</SectionTitle>
              {item.checkInPhotoUrl ? <Image source={{ uri: item.checkInPhotoUrl }} style={styles.photo} /> : <Line label={t('check_in_photo') || 'Check-in Photo'} value="-" />}
              {item.checkOutPhotoUrl ? <Image source={{ uri: item.checkOutPhotoUrl }} style={styles.photo} /> : <Line label={t('check_out_photo') || 'Check-out Photo'} value="-" />}

              <SectionTitle>{t('notes') || 'Notes'}</SectionTitle>
              <Line label={t('notes') || 'Notes'} value={item.notes || item.issuesNotes} />
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
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', backgroundColor: 'white', padding: 16, borderRadius: 10, maxHeight: '85%', borderWidth: 1 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6, borderTopWidth: 1, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  photo: { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 8, marginBottom: 8 }
});

export default TaskAttendanceDetailsModal;

export function buildTaskAttendanceText(
  item: any,
  format: 'text' | 'markdown' = 'text',
  opts?: { userNames?: Record<string, string>; outlets?: Array<{ id: string; outletName?: string }> }
) {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (t: string) => (isMD ? `\n## ${t}\n` : `\n${t}\n`);
  const line = (l: string, v: any) => `${l}: ${formatValue(v)}`;
  const out: string[] = [];
  const resolveUser = (uid?: string) => (uid ? (opts?.userNames?.[uid] || uid) : '-');
  const resolveOutlet = (outletId?: string, name?: string) => {
    if (!outletId && !name) return '-';
    const resolved = opts?.outlets?.find(o => o.id === outletId)?.outletName;
    return resolved || name || outletId || '-';
  };
  out.push(h('Personnel'));
  out.push(line('Assigned BA', `${resolveUser(item.assignedToBA)}${item.assignedToBA ? ` (${item.assignedToBA})` : ''}`));
  out.push(line('Assigned TL', `${resolveUser(item.assignedToTL)}${item.assignedToTL ? ` (${item.assignedToTL})` : ''}`));
  out.push(line('Status', item.status));
  out.push(line('Created', tsToLocale(item.createdAt)));
  out.push(h('Shift'));
  out.push(line('Date', dateOnly(item.shiftDate || item.date)));
  out.push(line('Shift', item.shiftName || item.shift));
  out.push(line('Check-in Time', tsToLocale(item.checkInAt)));
  out.push(line('Check-out Time', tsToLocale(item.checkOutAt)));
  out.push(line('Check-in Location', formatLatLng(item.checkInLat, item.checkInLng)));
  out.push(line('Check-out Location', formatLatLng(item.checkOutLat, item.checkOutLng)));
  out.push(h('Outlet'));
  out.push(line('Outlet ID', `${resolveOutlet(item.outletId, item.outletName)}${item.outletId ? ` (${item.outletId})` : ''}`));
  out.push(line('Province', item.locationProvince));
  out.push(line('City', item.locationCity));
  out.push(line('Outlet', resolveOutlet(item.outletId, item.outletName)));
  out.push(h('Notes'));
  out.push(line('Notes', item.notes || item.issuesNotes));
  return out.join('\n');
}

function dateOnly(v: any): string { try { const d = v?.toDate ? v.toDate() : (typeof v === 'string' || v instanceof Date ? new Date(v) : null); return d ? d.toISOString().slice(0,10) : formatValue(v); } catch { return formatValue(v); } }
function formatLatLng(lat: any, lng: any): string { if (lat == null || lng == null) return '-'; return `${lat}, ${lng}`; }
function tsToLocale(value: any): string { try { if (value?.toDate) return value.toDate().toLocaleString(); } catch {} return formatValue(value); }
function formatValue(v: any): string { if (v === null || v === undefined || v === '') return '-'; if (typeof v === 'boolean') return v ? 'Yes' : 'No'; return String(v); }
