import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { palette, radius, spacing } from '../../constants/Design';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export const SecondaryButton: React.FC<Props> = ({ title, onPress, disabled, style }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, disabled && styles.disabled, style]}
    >
      <Text style={styles.text}>{title}</Text>
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
  disabled: { opacity: 0.5 },
  text: { color: palette.text, fontWeight: '600', fontSize: 15 },
});

export default SecondaryButton;
