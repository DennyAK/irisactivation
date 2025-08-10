import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { palette, spacing, radius, typography } from '../../constants/Design';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';
import ModalSheet from './ModalSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Option = { label: string; value: string };

interface Props {
  title: string;
  search: string;
  status: string;
  statusOptions: Option[];
  placeholder?: string;
  storageKey?: string; // if set, persist last-used filters
  onApply: (filters: { search: string; status: string }) => void;
  onClear: () => void;
}

export const FilterHeader: React.FC<Props> = ({ title, search, status, statusOptions, placeholder = 'Search...', storageKey, onApply, onClear }) => {
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(status);

  const active = !!(search || status);

  const handleOpen = () => {
    setLocalSearch(search);
    setLocalStatus(status);
    setOpen(true);
  };

  const handleApply = () => {
    onApply({ search: localSearch, status: localStatus });
    if (storageKey) {
      AsyncStorage.setItem(storageKey, JSON.stringify({ search: localSearch, status: localStatus })).catch(() => {});
    }
    setOpen(false);
  };

  const handleClear = () => {
    setLocalSearch('');
    setLocalStatus('');
    onClear();
    if (storageKey) {
      AsyncStorage.removeItem(storageKey).catch(() => {});
    }
    setOpen(false);
  };

  // On mount: hydrate from storage if keys exist and current filters are empty
  useEffect(() => {
    let cancelled = false;
    if (storageKey && !search && !status) {
      AsyncStorage.getItem(storageKey).then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && (parsed.search || parsed.status)) {
              onApply({ search: parsed.search || '', status: parsed.status || '' });
            }
          } catch {}
        }
      }).catch(() => {});
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.headerRow}>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {active && (
          <TouchableOpacity onPress={handleClear} style={styles.resetChip} accessibilityLabel="Reset filters">
            <Text style={styles.resetChipText}>Reset</Text>
          </TouchableOpacity>
        )}
        <SecondaryButton
          title={active ? 'Filters • On' : 'Filters'}
          onPress={handleOpen}
          style={styles.filterBtn}
        />
      </View>
      <ModalSheet visible={open} onClose={() => setOpen(false)} maxHeightPct={0.6} scroll>
        <Text style={styles.sheetTitle}>Filters</Text>
        <Text style={styles.label}>Search</Text>
        <TextInput
          value={localSearch}
          onChangeText={setLocalSearch}
          placeholder={placeholder}
          style={styles.input}
        />
        <Text style={[styles.label, { marginTop: spacing(3) }]}>Status</Text>
        <View style={[styles.input, { padding: 0 }]}> 
          <Picker selectedValue={localStatus} onValueChange={(v) => setLocalStatus(String(v))} style={{ height: 40 }}>
            {statusOptions.map(opt => (
              <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
            ))}
          </Picker>
        </View>
        <View style={{ flexDirection: 'row', marginTop: spacing(4) }}>
          <PrimaryButton title="Apply" onPress={handleApply} style={{ marginRight: spacing(3) }} />
          <SecondaryButton title="Clear" onPress={handleClear} />
        </View>
      </ModalSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(4) },
  title: { ...typography.h1, color: palette.text, flex: 1, marginRight: spacing(3) },
  filterBtn: { alignSelf: 'flex-end' },
  resetChip: { paddingHorizontal: spacing(2.5), paddingVertical: spacing(1.5), backgroundColor: '#F3F4F6', borderRadius: 999, marginRight: spacing(2) },
  resetChipText: { fontSize: 12, color: palette.text },
  sheetTitle: { ...typography.h2, color: palette.text, marginBottom: spacing(4) },
  label: { fontSize: 12, color: palette.textMuted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: spacing(3), backgroundColor: palette.surfaceAlt },
});

export default FilterHeader;
