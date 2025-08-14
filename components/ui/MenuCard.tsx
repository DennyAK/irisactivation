import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Link } from 'expo-router';
import { palette, radius, shadow, spacing, typography } from '../../constants/Design';
import { useEffectiveScheme } from '../ThemePreference';

export interface MenuItemData {
  label: string;
  subtitle?: string;
  icon: string;
  href: string;
}

interface Props extends MenuItemData {
  style?: ViewStyle | ViewStyle[];
}

export const MenuCard: React.FC<Props> = ({ icon, label, subtitle, href, style }) => {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const router = useRouter();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(href as any)}
      style={[
        styles.card,
        isDark && { backgroundColor: '#111827', borderColor: '#1f2937' },
        style,
      ]}
    >        
      <View style={[styles.iconWrap, isDark && { backgroundColor: 'rgba(37,99,235,0.15)' }]}>
        <Ionicons name={icon as any} size={26} color={palette.primary} />
      </View>
      <Text style={[styles.label, isDark && { color: '#e5e7eb' }]} numberOfLines={2}>{label}</Text>
      {!!subtitle && <Text style={[styles.subtitle, isDark && { color: '#94a3b8' }]} numberOfLines={3}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

export const MenuGrid: React.FC<{ items: MenuItemData[] }> = ({ items }) => {
  return (
    <View style={styles.grid}>
      {items.map(item => (
        <MenuCard key={item.label} {...item} />
      ))}
    </View>
  );
};

const CARD_MIN_WIDTH_PERCENT = '46%';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  // Use marginBottom on cards for vertical spacing; avoid CSS gap for RN Web compat
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(4),
    minHeight: 150,
    width: CARD_MIN_WIDTH_PERCENT,
  marginBottom: spacing(5),
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(3),
  },
  label: { fontSize: 16, fontWeight: '600', color: palette.text, marginBottom: spacing(1) },
  subtitle: { fontSize: 12, lineHeight: 16, color: palette.textMuted },
});

export default MenuCard;
