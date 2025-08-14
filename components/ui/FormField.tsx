import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { palette, radius, spacing, typography } from '../../constants/Design';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props extends TextInputProps {
  label?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  secureToggle?: boolean; // if true uses eye icons automatically
  value: string;
  setValue: (v: string) => void;
  isDark?: boolean;
}

export const FormField: React.FC<Props> = ({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  secureTextEntry,
  secureToggle,
  value,
  setValue,
  isDark,
  ...inputProps
}) => {
  const [show, setShow] = React.useState(false);
  const effectiveSecure = secureToggle ? !show : secureTextEntry;
  const handleToggle = () => setShow(s => !s);
  const muted = isDark ? '#94a3b8' : palette.textMuted;
  const textColor = isDark ? '#e5e7eb' : palette.text;
  const fieldBg = isDark ? '#0f172a' : palette.surfaceAlt;
  const border = isDark ? '#1f2937' : palette.border;
  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
      <View style={[styles.field, { backgroundColor: fieldBg, borderColor: border }, !!error && styles.errorBorder]}>
        {icon && <Ionicons name={icon as any} size={18} color={muted} style={styles.leftIcon} />}
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholderTextColor={(inputProps as any).placeholderTextColor ?? muted}
          value={value}
          onChangeText={setValue}
          secureTextEntry={effectiveSecure}
          {...inputProps}
        />
        {secureToggle && (
          <TouchableOpacity style={styles.rightIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleToggle}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={muted} />
          </TouchableOpacity>
        )}
        {!secureToggle && rightIcon && (
          <TouchableOpacity style={styles.rightIcon} onPress={onRightIconPress}>
            <Ionicons name={rightIcon as any} size={20} color={muted} />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing(4) },
  label: { ...typography.label, color: palette.text, marginBottom: spacing(1.5) },
  field: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(11),
    height: 50,
  },
  input: { flex: 1, fontSize: 15, color: palette.text },
  leftIcon: { position: 'absolute', left: spacing(4) },
  rightIcon: { position: 'absolute', right: spacing(3.5), padding: spacing(1) },
  errorText: { marginTop: spacing(1.5), fontSize: 12, color: palette.danger, fontWeight: '500' },
  errorBorder: { borderColor: palette.danger },
});

export default FormField;
