export const options = {
  title: "Outlet Detail",
};

import { View, Text, StyleSheet } from 'react-native';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';

export default function OutletDetailMenu() {
  const menuItems: {
    label: string;
    icon: string;
    subtitle: string;
    href: '/outlets-screens/outlets' | '/outlets-screens/province-list' | '/outlets-screens/city-list';
  }[] = [
    {
      label: 'Outlet Detail',
      icon: 'storefront-outline',
      subtitle: 'View outlet details and status',
      href: '/outlets-screens/outlets',
    },
    {
      label: 'Province',
      icon: 'earth-outline',
      subtitle: 'View and manage province list',
      href: '/outlets-screens/province-list',
    },
    {
      label: 'City',
      icon: 'map-outline',
      subtitle: 'View and manage city list',
      href: '/outlets-screens/city-list',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Outlets</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
