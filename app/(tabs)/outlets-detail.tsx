export const options = {
  title: "Outlet Detail",
};

import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { isAdminRole } from '../../constants/roles';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';

export default function OutletDetailMenu() {
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

  const menuItems: {
    label: string;
    icon: string;
    subtitle: string;
    href: '/outlets-screens/outlets' | '/outlets-screens/province-list' | '/outlets-screens/city-list' | '/(tabs)/audit-logs?collection=outlets';
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
    ...(isAdminRole(role as any) ? [{
      label: 'Audit Logs (Outlets)',
      icon: 'time-outline',
      subtitle: 'Recent changes in outlets',
      href: '/(tabs)/audit-logs?collection=outlets' as const,
    }] : []),
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Outlets</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
