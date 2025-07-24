import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Button, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user role for conditional admin menu
    import('../firebaseConfig').then(({ db, auth }) => {
      if (auth.currentUser) {
        import('firebase/firestore').then(({ doc, getDoc }) => {
          const uid = auth.currentUser ? auth.currentUser.uid : null;
          if (uid) {
            getDoc(doc(db, 'users', uid)).then((snap) => {
              if (snap.exists()) {
                setRole(snap.data().role);
              }
            });
          }
        });
      }
    });
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

  // Menu items for all tabs/screens
  let menuItems = [
    { label: 'Profile', route: '/(tabs)/index' },
    { label: 'Tasks', route: '/(tabs)/tasks' },
    { label: 'User Management', route: '/(tabs)/user-management' },
    { label: 'Projects', route: '/(tabs)/projects' },
    { label: 'Outlets', route: '/(tabs)/outlets' },
    { label: 'Quick Sales Report', route: '/(tabs)/quick-sales-report' },
    { label: 'Sales Report Detail', route: '/(tabs)/sales-report-detail' },
    { label: 'Province List', route: '/(tabs)/province-list' },
    { label: 'City List', route: '/(tabs)/city-list' },
    { label: 'Task Attendance', route: '/(tabs)/task-attendance' },
    { label: 'Task Early Assessment', route: '/(tabs)/task-early-assessment' },
    { label: 'Task Quick Quiz', route: '/(tabs)/task-quick-quiz' },
    { label: 'Tasks Tutorial Summary', route: '/(tabs)/tasks_tutorial_summary.md' },
    // Add more as needed
  ];

  // Conditionally add admin menu
  if (role === 'admin' || role === 'area manager') {
    menuItems.push({ label: 'Admin Role Requests', route: '/(tabs)/admin-role-requests' });
  }

  // If guest, only show Profile
  if (role === 'guest') {
    menuItems = [
      { label: 'Profile', route: '/(tabs)/index' }
    ];
  }

  return (
    <View style={styles.menuContainer}>
      <Text style={styles.title}>Menu</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.menuButtonWrapper}>
          <Button title="Logout" onPress={handleLogout} color="#d9534f" />
        </View>
        {menuItems.map((item) => (
          <View key={item.route} style={styles.menuButtonWrapper}>
            <Button title={item.label} onPress={() => router.push(item.route as any)} color="#007bff" />
          </View>
        ))}
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
    paddingHorizontal: 24,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '100%',
    backgroundColor: '#eee',
  },
  menuButtonWrapper: {
    width: '100%',
    marginBottom: 16,
  },
});
