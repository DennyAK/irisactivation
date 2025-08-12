export const options = {
  title: "Outlet Detail",
};

import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
// import { isAdminRole } from '../../constants/roles';
import { MenuGrid } from '../../components/ui/MenuCard';
import { palette, spacing, typography } from '../../constants/Design';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function OutletDetailMenu() {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
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
    href: '/outlets-screens/outlets' | '/outlets-screens/province-list' | '/outlets-screens/city-list';
  }[] = [
    {
      label: t('outlets') || 'Outlet Detail',
      icon: 'storefront-outline',
      subtitle: t('outlets_subtitle') || 'View outlet details and status',
      href: '/outlets-screens/outlets',
    },
    {
      label: t('provinces') || 'Province',
      icon: 'earth-outline',
      subtitle: t('provinces_subtitle') || 'View and manage province list',
      href: '/outlets-screens/province-list',
    },
    {
      label: t('cities') || 'City',
      icon: 'map-outline',
      subtitle: t('cities_subtitle') || 'View and manage city list',
      href: '/outlets-screens/city-list',
  },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1220' : palette.bg }]}>
      <Text style={[styles.header, isDark && { color: '#e5e7eb' }]}>{t('outlets') || 'Outlets'}</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
