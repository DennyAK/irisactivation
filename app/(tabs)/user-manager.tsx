export const options = {
  title: "User Manager",
};

import { View, Text, StyleSheet } from 'react-native';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function UserManagerMenu() {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
  const menuItems = [
    {
      label: t('user_mgmt') || 'User Management',
      icon: 'people-outline',
      subtitle: t('user_mgmt_subtitle') || 'Manage user accounts and permissions',
      href: '/user-screens/user-management',
    },
    {
      label: t('team_mgmt') || 'Team Management',
      icon: 'people-circle-outline',
      subtitle: t('team_mgmt_subtitle') || 'Area Managers, Iris TLs & BAs by Province',
      href: '/user-screens/team-management',
    },
    {
      label: t('admin_requests') || 'Role Request',
      icon: 'help-circle-outline',
      subtitle: t('admin_requests_subtitle') || 'Take or review role requests',
      href: '/user-screens/admin-role-requests',
    },
    
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1220' : palette.bg }]}>
      <Text style={[styles.header, isDark && { color: '#e5e7eb' }]}>{t('users_manager') || 'User Manager'}</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
