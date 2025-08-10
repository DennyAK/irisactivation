import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spacing, typography } from '../../constants/Design';
import { SecondaryButton } from './SecondaryButton';

interface Props {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<Props> = ({ title = 'No results', message = 'Try updating or clearing your filters.', onReset }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onReset ? (
        <SecondaryButton title="Reset filters" onPress={onReset} style={{ marginTop: spacing(3) }} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing(10) },
  title: { ...typography.h2, color: palette.text, marginBottom: spacing(1) },
  message: { color: palette.textMuted, fontSize: 13 },
});

export default EmptyState;
