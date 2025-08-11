export const options = {
  title: "Project Detail",
};

import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Roles, isAdminRole } from '../../constants/roles';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';

export default function ProjectDetailMenu() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const u = auth.currentUser; if (!u) { setRole(null); return; }
        const ref = doc(db, 'users', u.uid); const snap = await getDoc(ref);
        setRole(snap.exists() ? (snap.data() as any).role || '' : '');
      } catch { setRole(''); }
    })();
  }, []);

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
    ...(isAdminRole(role as any) ? [{
      label: 'Audit Logs (Projects)',
      icon: 'time-outline',
      subtitle: 'Recent changes in projects & activations',
      href: '/(tabs)/audit-logs?collection=projects' as const,
    }, {
      label: 'Audit Logs (Activations)',
      icon: 'time-outline',
      subtitle: 'Recent changes in activations',
      href: '/(tabs)/audit-logs?collection=activations' as const,
    }] : []),
    
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
