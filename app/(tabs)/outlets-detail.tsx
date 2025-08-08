export const options = {
  title: "Outlet Detail",
};

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
      <Text style={styles.header}>Outlets Detail</Text>
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
