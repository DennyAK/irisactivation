export const options = {
  title: "Tasks",
};

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      <Text style={styles.header}>Tasks Menu</Text>
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <Link key={item.label} href={item.href} asChild>
            <TouchableOpacity style={styles.card} activeOpacity={0.85}>
              <Ionicons name={item.icon} size={36} color="#007AFF" style={{ marginBottom: 8 }} />
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    paddingTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#222',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 18,
  },
  card: {
    width: 150,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
