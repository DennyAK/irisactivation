import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { collection, getDocs, query, where, DocumentSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebaseConfig';
import { palette, radius, shadow, spacing, typography } from '../../constants/Design';
import { InfoRow } from '../../components/ui/InfoRow';
import { StatusPill } from '../../components/ui/StatusPill';
import FilterHeader from '../../components/ui/FilterHeader';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { useRouter } from 'expo-router';

type UserItem = {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  province?: string;
  city?: string;
  [key: string]: any;
};

const TEAM_ROLES = ['area manager', 'Iris - TL', 'Iris - BA'];

export default function TeamManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserRole(null);
        setUsers([]);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const role = snap.exists() ? (snap.data() as any).role : null;
      setUserRole(role);
      fetchUsers();
    });
    return () => unsub();
  }, [isFocused]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersCol = collection(db, 'users');
      const q = query(usersCol, where('role', 'in', TEAM_ROLES));
      const snap = await getDocs(q);
      const list: UserItem[] = snap.docs.map((d) => {
        const data = d.data() || {};
        return {
          id: d.id,
          email: (data as any).email,
          role: (data as any).role,
          firstName: (data as any).firstName,
          lastName: (data as any).lastName,
          phone: (data as any).phone,
          province: (data as any).province,
          city: (data as any).city,
          ...data,
        } as UserItem;
      });
      setUsers(list);
    } catch (e) {
      console.error('Error fetching team users', e);
    } finally {
      setLoading(false);
    }
  };

  const roleRank = (r?: string) => {
    if (!r) return 99;
    const idx = TEAM_ROLES.indexOf(r);
    return idx === -1 ? 98 : idx;
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = term
      ? users.filter((u) => {
          const hay = [u.email, u.firstName, u.lastName, u.phone, u.city, u.province, u.role]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(term);
        })
      : users;
    return [...base].sort((a, b) => {
      const pa = (a.province || 'Unknown').toLowerCase();
      const pb = (b.province || 'Unknown').toLowerCase();
      if (pa !== pb) return sortAsc ? pa.localeCompare(pb) : pb.localeCompare(pa);
      const rr = roleRank(a.role) - roleRank(b.role);
      if (rr !== 0) return rr;
      const na = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      const nb = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
      return na.localeCompare(nb);
    });
  }, [users, search, sortAsc]);

  const sections = useMemo(() => {
    const byProv: Record<string, UserItem[]> = {};
    for (const u of filtered) {
      const key = u.province && u.province.trim() ? u.province : 'Unknown';
      if (!byProv[key]) byProv[key] = [];
      byProv[key].push(u);
    }
    const keys = Object.keys(byProv).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return a.localeCompare(b);
    });
    return keys.map((k) => ({ title: k, data: byProv[k] }));
  }, [filtered]);

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.screen}>
      <FilterHeader
        title="Team Management"
        search={search}
        status={''}
        statusOptions={[]}
        storageKey="filters:team"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc((s) => !s)}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.email || 'Unknown'}</Text>
              <StatusPill
                label={item.role || '-'}
                tone={item.role?.includes('manager') ? 'info' : item.role?.includes('admin') ? 'primary' : 'neutral'}
              />
            </View>
            <InfoRow label="Name" value={`${item.firstName || ''} ${item.lastName || ''}`.trim() || '-'} />
            <InfoRow label="City" value={item.city || '-'} />
            <View style={{ marginTop: spacing(3) }}>
              <SecondaryButton
                title="History"
                onPress={() => {
                  const name = (`${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || 'User');
                  const url = `/user-screens/team-history?userId=${encodeURIComponent(item.id)}&userName=${encodeURIComponent(name)}`;
                  router.push(url as any);
                }}
              />
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing(15) }}
        ListEmptyComponent={<Text style={styles.empty}>No team members found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: spacing(5), paddingTop: spacing(10) },
  sectionHeader: {
    backgroundColor: palette.surfaceAlt,
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: palette.textMuted },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  empty: { color: palette.textMuted, textAlign: 'center', marginTop: spacing(10) },
});
