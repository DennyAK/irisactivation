export const options = {
  title: "User Manager",
};

import { View, Text, StyleSheet } from 'react-native';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';

export default function UserManagerMenu() {
  const menuItems = [
    {
      label: 'User Management',
      icon: 'people-outline',
      subtitle: 'Manage user accounts and permissions',
      href: '/user-screens/user-management',
    },
    {
      label: 'Team Management',
      icon: 'people-circle-outline',
      subtitle: 'Area Managers, Iris TLs & BAs by Province',
      href: '/user-screens/team-management',
    },
    {
      label: 'Role Request',
      icon: 'help-circle-outline',
      subtitle: 'Take or review role requests',
      href: '/user-screens/admin-role-requests',
    },
    {
      label: 'About',
      icon: 'information-circle-outline',
      subtitle: 'Version, channel, links, and OTA updates',
      href: '/(tabs)/about',
    },
    
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>User Manager</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
