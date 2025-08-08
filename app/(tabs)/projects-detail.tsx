export const options = {
  title: "Project Detail",
};

import { View, Text, StyleSheet } from 'react-native';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';

export default function ProjectDetailMenu() {
  const menuItems = [
    {
      label: 'Project Overview',
      icon: 'briefcase-outline',
      subtitle: 'View project details and status',
      href: '/projects-screens/projects' as const,
    },
    {
      label: 'Activation',
      icon: 'flash-outline',
      subtitle: 'View and manage activation requests',
      href: '/projects-screens/activation' as const,
    },
    
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Projects</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
