export const options = {
  title: "Tasks",
};

import { View, Text, StyleSheet } from 'react-native';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';

export default function TasksMenu() {
  type MenuItem = {
    label: string;
    icon: string;
    subtitle: string;
    href: 
      | '/tasks-screens/tasks-detail'
      | '/tasks-screens/task-quick-quiz'
      | '/tasks-screens/task-attendance'
      | '/tasks-screens/task-early-assessment'
      | '/tasks-screens/quick-sales-report'
      | '/tasks-screens/sales-report-detail';
  };

  const menuItems: MenuItem[] = [
    {
      label: 'Task Detail',
      icon: 'list-outline',
      subtitle: 'View and manage task details',
      href: '/tasks-screens/tasks-detail',
    },
    {
      label: 'Quick Quiz',
      icon: 'help-circle-outline',
      subtitle: 'Take or review quick quizzes',
      href: '/tasks-screens/task-quick-quiz',
    },
    {
      label: 'Attendance',
      icon: 'checkbox-outline',
      subtitle: 'Check in/out and manage attendance',
      href: '/tasks-screens/task-attendance',
    },
    {
      label: 'Early Assessment',
      icon: 'clipboard-outline',
      subtitle: 'Complete early assessment tasks',
      href: '/tasks-screens/task-early-assessment',
    },
    {
      label: 'Quick Sales Report',
      icon: 'file-tray-outline',
      subtitle: 'View and manage Sales Report',
      href: '/tasks-screens/quick-sales-report',
    },
    {
      label: 'Sales Report Detail',
      icon: 'file-tray-full-outline',
      subtitle: 'View and manage Sales Report Detailed',
      href: '/tasks-screens/sales-report-detail',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Tasks</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
