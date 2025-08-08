import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Link } from 'expo-router';
import { palette, radius, shadow, spacing, typography } from '../../constants/Design';

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
  return (
    <Link href={href as any} asChild>
      <TouchableOpacity activeOpacity={0.85} style={[styles.card, style]}>        
        <View style={styles.iconWrap}>
          <Ionicons name={icon as any} size={26} color={palette.primary} />
        </View>
        <Text style={styles.label} numberOfLines={2}>{label}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={3}>{subtitle}</Text>}
      </TouchableOpacity>
    </Link>
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
    rowGap: spacing(5),
    columnGap: spacing(4),
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing(5),
    paddingHorizontal: spacing(4),
    minHeight: 150,
    width: CARD_MIN_WIDTH_PERCENT,
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
