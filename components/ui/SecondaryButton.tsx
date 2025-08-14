import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { palette, radius, spacing } from '../../constants/Design';
import { useEffectiveScheme } from '../ThemePreference';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  compact?: boolean;
  selected?: boolean;
  loading?: boolean;
}

export const SecondaryButton: React.FC<Props> = ({ title, onPress, disabled, style, compact, selected, loading }) => {
  const scheme = useEffectiveScheme();
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        compact && styles.compactBase,
        { backgroundColor: scheme === 'dark' ? '#0b1220' : palette.surfaceAlt, borderColor: scheme === 'dark' ? '#1f2937' : palette.border },
        selected && { backgroundColor: scheme === 'dark' ? '#0f172a' : '#e6f0ff', borderColor: '#3b82f6' },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={scheme === 'dark' ? '#e5e7eb' : palette.text} />
      ) : (
        <Text style={[styles.text, compact && styles.textCompact, { color: scheme === 'dark' ? '#e5e7eb' : palette.text }, selected && { color: '#1e3a8a' }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(5),
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
  },
  compactBase: {
    paddingVertical: spacing(1.5),
    paddingHorizontal: spacing(2.5),
  },
  disabled: { opacity: 0.5 },
  text: { color: palette.text, fontWeight: '600', fontSize: 15 },
  textCompact: { fontSize: 13 },
});

export default SecondaryButton;
