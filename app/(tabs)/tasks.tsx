export const options = {
  title: "Tasks",
};

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';

export default function TasksMenu() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
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
  | '/tasks-screens/sales-report-detail'
  | '/tasks-screens/role-play-video';
  };

  const menuItems: MenuItem[] = [
    {
      label: t('task_detail') || 'Task Detail',
      icon: 'list-outline',
      subtitle: t('task_detail_subtitle') || 'View and manage task details',
      href: '/tasks-screens/tasks-detail',
    },
    {
      label: t('quick_quiz') || 'Quick Quiz',
      icon: 'help-circle-outline',
      subtitle: t('quick_quiz_subtitle') || 'Take or review quick quizzes',
      href: '/tasks-screens/task-quick-quiz',
    },
    {
      label: t('attendance') || 'Attendance',
      icon: 'checkbox-outline',
      subtitle: t('attendance_subtitle') || 'Check in/out and manage attendance',
      href: '/tasks-screens/task-attendance',
    },
    {
      label: t('assessment') || 'Early Assessment',
      icon: 'clipboard-outline',
      subtitle: t('assessment_subtitle') || 'Complete early assessment tasks',
      href: '/tasks-screens/task-early-assessment',
    },
    {
      label: t('quick_sales_report') || 'Quick Sales Report',
      icon: 'file-tray-outline',
      subtitle: t('quick_sales_report_subtitle') || 'View and manage Sales Report',
      href: '/tasks-screens/quick-sales-report',
    },
    {
      label: t('sales_detail') || 'Sales Report Detail',
      icon: 'file-tray-full-outline',
      subtitle: t('sales_detail_subtitle') || 'View and manage Sales Report Detailed',
      href: '/tasks-screens/sales-report-detail',
    },
    {
      label: 'Role Play Video',
      icon: 'videocam-outline',
      subtitle: 'Prepare and download your role-play video',
      href: '/tasks-screens/role-play-video',
    },
  ];

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#0b1220' }]}>      
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(12) }}>
        <Text style={[styles.header, isDark && { color: '#e5e7eb' }]}>{t('tasks') || 'Tasks'}</Text>
        <MenuGrid items={menuItems} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
