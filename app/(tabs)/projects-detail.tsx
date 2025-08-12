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
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function ProjectDetailMenu() {
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

  const menuItems = [
    {
      label: t('projects_list') || 'Project Overview',
      icon: 'briefcase-outline',
      subtitle: t('projects_overview_subtitle') || 'View project details and status',
      href: '/projects-screens/projects' as const,
    },
    {
      label: t('activation') || 'Activation',
      icon: 'flash-outline',
      subtitle: t('activation_subtitle') || 'View and manage activation requests',
      href: '/projects-screens/activation' as const,
    },
  // Audit links removed per request
    
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0b1220' : palette.bg }]}>
      <Text style={[styles.header, isDark && { color: '#e5e7eb' }]}>{t('projects') || 'Projects'}</Text>
      <MenuGrid items={menuItems} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
});
