import React from 'react';
import { Modal, View, StyleSheet, ViewStyle, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { palette, radius, spacing, shadow } from '../../constants/Design';
import { useEffectiveScheme } from '../ThemePreference';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeightPct?: number; // 0-1 for sheet height
  scroll?: boolean;
}

export const ModalSheet: React.FC<Props> = ({ visible, onClose, children, maxHeightPct = 0.8, scroll }) => {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={[styles.sheet, { maxHeight: `${maxHeightPct * 100}%` }, isDark && { backgroundColor: '#111827', borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>          
          {scroll ? (
            <ScrollView contentContainerStyle={{ paddingBottom: spacing(4) }} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing(6),
    ...shadow.card,
  },
});

export default ModalSheet;
