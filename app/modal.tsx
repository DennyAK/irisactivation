import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { Text, View } from '@/components/Themed';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, shadow, spacing } from '@/constants/Design';

export default function ModalScreen() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) setRole(snap.data().role || null);
      } catch {}
    })();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        router.replace('/login');
      })
      .catch((error) => {
        console.error("Logout failed", error);
      });
  };

  // Build menu with corrected routes (reflect -screens location) and role-based visibility
  const menuItems = useMemo(() => {
    const all = [
      { label: 'Profile', route: '/(tabs)' as const, icon: 'person-circle' as const, roles: 'all' as const },
  { label: 'Clicker', route: '/(tabs)/clicker' as const, icon: 'add-circle' as const, roles: 'all' as const },
  { label: 'About', route: '/(tabs)/about' as const, icon: 'information-circle' as const, roles: 'all' as const },
      // Tasks group
      { label: 'Tasks', route: '/(tabs)/tasks' as const, icon: 'checkbox' as const, roles: 'all' as const },
      { label: 'Attendance', route: '/(tabs)/tasks-screens/task-attendance' as const, icon: 'time' as const, roles: 'all' as const },
      { label: 'Assessment', route: '/(tabs)/tasks-screens/task-early-assessment' as const, icon: 'clipboard' as const, roles: 'all' as const },
      { label: 'Quick Quiz', route: '/(tabs)/tasks-screens/task-quick-quiz' as const, icon: 'help-circle' as const, roles: 'all' as const },
      { label: 'Sales Report', route: '/(tabs)/tasks-screens/quick-sales-report' as const, icon: 'stats-chart' as const, roles: 'all' as const },
      { label: 'Sales Detail', route: '/(tabs)/tasks-screens/sales-report-detail' as const, icon: 'document-text' as const, roles: 'all' as const },
      // Outlets group
      { label: 'Outlets', route: '/(tabs)/outlets-detail' as const, icon: 'business' as const, roles: 'all' as const },
      { label: 'Provinces', route: '/(tabs)/outlets-screens/province-list' as const, icon: 'map' as const, roles: 'all' as const },
      { label: 'Cities', route: '/(tabs)/outlets-screens/city-list' as const, icon: 'business' as const, roles: 'all' as const },
      // Projects group
      { label: 'Projects', route: '/(tabs)/projects-detail' as const, icon: 'briefcase' as const, roles: 'all' as const },
      { label: 'Activation', route: '/(tabs)/projects-screens/activation' as const, icon: 'flash' as const, roles: 'all' as const },
      { label: 'Projects List', route: '/(tabs)/projects-screens/projects' as const, icon: 'list' as const, roles: 'all' as const },
      // Users/Admin
  { label: 'User Manager', route: '/(tabs)/user-manager' as const, icon: 'people' as const, roles: ['admin','superadmin','area manager'] as const },
  { label: 'Admin Requests', route: '/(tabs)/user-screens/admin-role-requests' as const, icon: 'shield-checkmark' as const, roles: ['admin','superadmin','area manager'] as const },
  { label: 'User Mgmt', route: '/(tabs)/user-screens/user-management' as const, icon: 'person-add' as const, roles: ['admin','superadmin'] as const },
    ];

    const r = (role || '').toLowerCase();
    let filtered = all.filter((m) => m.roles === 'all' || (Array.isArray(m.roles) && m.roles.includes(r as any)));
    if (r === 'guest') {
      filtered = filtered.filter((m) => m.label === 'Profile' || m.label === 'About');
    }
    return filtered;
  }, [role]);

  return (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>Menu</Text>
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity style={[styles.logoutCard, { alignSelf: 'stretch', justifyContent: 'center' }]} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <View style={{ height: spacing(2) }} />
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.route} style={styles.card} onPress={() => router.push(item.route as any)}>
              <Ionicons name={item.icon as any} size={22} color={palette.primary} style={{ marginBottom: 6 }} />
              <Text style={styles.cardText} numberOfLines={2}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
      </ScrollView>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    ...shadow.card,
  },
  cardText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#333',
    fontSize: 13,
  },
  logoutCard: {
    marginTop: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d9534f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
  },
  logoutText: { color: '#fff', fontWeight: '700' },
});
