import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing } from '../../constants/Design';

export type BarDatum = { label: string; value: number };

export default function SimpleBarChart({ data, color = palette.primary }: { data: BarDatum[]; color?: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <View style={styles.wrapper}>
      {data.map((d) => {
        const pct = Math.max(0.05, d.value / max); // ensure visible min bar
        return (
          <View key={d.label} style={styles.row}>
            <Text style={styles.label}>{d.label}</Text>
            <View style={styles.barBg}>
              <View style={[styles.bar, { width: `${pct * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.value}>{d.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing(2) },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(1.5) },
  label: { width: 80, fontSize: 12, color: palette.textMuted },
  barBg: { flex: 1, height: 10, backgroundColor: palette.surfaceAlt, borderRadius: 6, overflow: 'hidden', marginHorizontal: spacing(2) },
  bar: { height: '100%', borderRadius: 6 },
  value: { width: 30, textAlign: 'right', fontSize: 12, color: palette.text },
});
