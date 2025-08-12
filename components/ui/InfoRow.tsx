import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing } from '../../constants/Design';
import { useEffectiveScheme } from '../ThemePreference';

export const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  return (
    <View style={[styles.row, isDark && { borderBottomColor: '#1f2937' }]}>
      <Text style={[styles.label, isDark && { color: '#94a3b8' }]}>{label}</Text>
      <Text style={[styles.value, isDark && { color: '#e5e7eb' }]}>{value || '-'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: palette.border },
  label: { fontSize: 14, color: palette.textMuted, fontWeight: '500' },
  value: { fontSize: 14, color: palette.text, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
});

export default InfoRow;
