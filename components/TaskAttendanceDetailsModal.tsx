import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';

type Props = { visible: boolean; onClose: () => void; item: any | null; onCopyAll?: () => void };

const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (<Text selectable>{label}: {formatValue(value)}</Text>);
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (<Text selectable style={styles.sectionTitle}>{children}</Text>);

const TaskAttendanceDetailsModal: React.FC<Props> = ({ visible, onClose, item, onCopyAll }) => {
  const handleCopyMD = async () => { if (!item) return; await Clipboard.setStringAsync(buildTaskAttendanceText(item, 'markdown')); Alert.alert('Copied to clipboard'); };
  const handleShare = async () => { if (!item) return; try { await Share.share({ message: buildTaskAttendanceText(item, 'text') }); } catch {} };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text selectable style={styles.title}>Attendance</Text>
          {!item ? <Text>No data</Text> : (
            <>
              <SectionTitle>Personnel</SectionTitle>
              <Line label="Assigned BA" value={item.assignedToBA} />
              <Line label="Assigned TL" value={item.assignedToTL} />
              <Line label="Status" value={item.status} />
              <Line label="Created" value={tsToLocale(item.createdAt)} />

              <SectionTitle>Shift</SectionTitle>
              <Line label="Date" value={dateOnly(item.shiftDate || item.date)} />
              <Line label="Shift" value={item.shiftName || item.shift} />
              <Line label="Check-in Time" value={tsToLocale(item.checkInAt)} />
              <Line label="Check-out Time" value={tsToLocale(item.checkOutAt)} />
              <Line label="Check-in Location" value={formatLatLng(item.checkInLat, item.checkInLng)} />
              <Line label="Check-out Location" value={formatLatLng(item.checkOutLat, item.checkOutLng)} />

              <SectionTitle>Outlet</SectionTitle>
              <Line label="Outlet ID" value={item.outletId} />
              <Line label="Province" value={item.locationProvince} />
              <Line label="City" value={item.locationCity} />
              <Line label="Outlet" value={item.outletName} />

              <SectionTitle>Photos</SectionTitle>
              {item.checkInPhotoUrl ? <Image source={{ uri: item.checkInPhotoUrl }} style={styles.photo} /> : <Line label="Check-in Photo" value="-" />}
              {item.checkOutPhotoUrl ? <Image source={{ uri: item.checkOutPhotoUrl }} style={styles.photo} /> : <Line label="Check-out Photo" value="-" />}

              <SectionTitle>Notes</SectionTitle>
              <Line label="Notes" value={item.notes || item.issuesNotes} />
            </>
          )}
          <View style={styles.buttonRow}>
            {onCopyAll && <Button title="Copy All" onPress={onCopyAll} />} 
            {item && <Button title="Copy MD" onPress={handleCopyMD} />} 
            {item && <Button title="Share" onPress={handleShare} />} 
            <Button title="Close" onPress={onClose} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  photo: { width: '100%', height: 200, resizeMode: 'cover', borderRadius: 8, marginBottom: 8 }
});

export default TaskAttendanceDetailsModal;

export function buildTaskAttendanceText(item: any, format: 'text' | 'markdown' = 'text') {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (t: string) => (isMD ? `\n## ${t}\n` : `\n${t}\n`);
  const line = (l: string, v: any) => `${l}: ${formatValue(v)}`;
  const out: string[] = [];
  out.push(h('Personnel'));
  out.push(line('Assigned BA', item.assignedToBA));
  out.push(line('Assigned TL', item.assignedToTL));
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
  out.push(line('Outlet ID', item.outletId));
  out.push(line('Province', item.locationProvince));
  out.push(line('City', item.locationCity));
  out.push(line('Outlet', item.outletName));
  out.push(h('Notes'));
  out.push(line('Notes', item.notes || item.issuesNotes));
  return out.join('\n');
}

function dateOnly(v: any): string { try { const d = v?.toDate ? v.toDate() : (typeof v === 'string' || v instanceof Date ? new Date(v) : null); return d ? d.toISOString().slice(0,10) : formatValue(v); } catch { return formatValue(v); } }
function formatLatLng(lat: any, lng: any): string { if (lat == null || lng == null) return '-'; return `${lat}, ${lng}`; }
function tsToLocale(value: any): string { try { if (value?.toDate) return value.toDate().toLocaleString(); } catch {} return formatValue(value); }
function formatValue(v: any): string { if (v === null || v === undefined || v === '') return '-'; if (typeof v === 'boolean') return v ? 'Yes' : 'No'; return String(v); }
