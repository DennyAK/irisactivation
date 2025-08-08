export const options = {
  title: "Project Detail",
};

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      <Text style={styles.header}>Project Detail</Text>
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
