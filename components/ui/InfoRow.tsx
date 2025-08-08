import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing } from '../../constants/Design';

export const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2), borderBottomWidth: 1, borderBottomColor: palette.border },
  label: { fontSize: 14, color: palette.textMuted, fontWeight: '500' },
  value: { fontSize: 14, color: palette.text, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
});

export default InfoRow;
