import React from 'react';
import { Text, StyleSheet, View, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '../../constants/Design';

interface Props {
  label: string;
  tone?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle | ViewStyle[];
}

const toneMap = {
  primary: { bg: palette.primarySoft, fg: palette.primary },
  info: { bg: '#e0f2fe', fg: palette.info },
  success: { bg: '#dcfce7', fg: palette.success },
  warning: { bg: '#fef3c7', fg: '#b45309' },
  danger: { bg: '#fee2e2', fg: palette.danger },
  neutral: { bg: '#e2e8f0', fg: '#475569' },
};

export const StatusPill: React.FC<Props> = ({ label, tone='neutral', style }) => {
  const toneVals = toneMap[tone];
  return (
    <View style={[styles.base, { backgroundColor: toneVals.bg }, style]}>
      <Text style={[styles.text, { color: toneVals.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: radius.md },
  text: { fontSize: 12, fontWeight: '600' },
});

export default StatusPill;
