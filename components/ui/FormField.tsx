import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { palette, radius, spacing, typography } from '../../constants/Design';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface Props extends TextInputProps {
  label?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  error?: string;
  secureToggle?: boolean; // if true uses eye icons automatically
  value: string;
  setValue: (v: string) => void;
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
  ...inputProps
}) => {
  const [show, setShow] = React.useState(false);
  const effectiveSecure = secureToggle ? !show : secureTextEntry;
  const handleToggle = () => setShow(s => !s);
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.field, !!error && styles.errorBorder]}>
        {icon && <Ionicons name={icon as any} size={18} color={palette.textMuted} style={styles.leftIcon} />}
        <TextInput
          style={styles.input}
          placeholderTextColor={palette.textMuted}
          value={value}
          onChangeText={setValue}
          secureTextEntry={effectiveSecure}
          {...inputProps}
        />
        {secureToggle && (
          <TouchableOpacity style={styles.rightIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleToggle}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={palette.textMuted} />
          </TouchableOpacity>
        )}
        {!secureToggle && rightIcon && (
          <TouchableOpacity style={styles.rightIcon} onPress={onRightIconPress}>
            <Ionicons name={rightIcon as any} size={20} color={palette.textMuted} />
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
