import { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, RefreshControl, Modal, TextInput, ScrollView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, writeBatch, doc, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { provinces as provinceData } from '../../data/indonesian-regions';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { useI18n } from '@/components/I18n';
import { compareByStringKey } from '../../utils/sort';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import FilterHeader from '../../components/ui/FilterHeader';

export default function ProvinceListScreen() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    body: isDark ? '#0b1220' : palette.bg,
    surface: isDark ? '#111827' : palette.surface,
    surfaceAlt: isDark ? '#0f172a' : palette.surfaceAlt,
    border: isDark ? '#1f2937' : palette.border,
    text: isDark ? '#e5e7eb' : palette.text,
    muted: isDark ? '#94a3b8' : palette.textMuted,
    placeholder: isDark ? '#64748b' : '#9ca3af',
  };
  const inputCommonProps = isDark ? { placeholderTextColor: colors.placeholder as any } : {};
  // Add Province modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newProvinceName, setNewProvinceName] = useState('');
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) setUserRole(docSnap.data().role);
        });
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchProvinces();
    }
  }, [userRole]);

  const fetchProvinces = async () => {
    setLoading(true);
    try {
      const provincesCollection = collection(db, 'provinces');
      const provinceSnapshot = await getDocs(provincesCollection);
      const provinceList = provinceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProvinces(provinceList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching provinces: ", error);
      Alert.alert("Error", "Failed to fetch provinces.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term ? provinces.filter(p => (p.name || '').toLowerCase().includes(term)) : provinces;
  const sorted = [...list].sort((a, b) => compareByStringKey(a, b, 'name', sortAsc));
    return sorted;
  }, [provinces, search, sortAsc]);

  const handleClearProvinces = async () => {
    setLoading(true);
    try {
      const provincesCollection = collection(db, 'provinces');
      const provinceSnapshot = await getDocs(provincesCollection);
      const batch = writeBatch(db);
      provinceSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setProvinces([]);
      Alert.alert("Success", "All provinces have been cleared.");
    } catch (error) {
      console.error("Error clearing provinces: ", error);
      Alert.alert("Error", "Failed to clear provinces.");
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateProvinces = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const provincesCollection = collection(db, 'provinces');
      provinceData.forEach(province => {
        const docRef = doc(provincesCollection, province.id);
        batch.set(docRef, { name: province.name });
      });
      await batch.commit();
      Alert.alert("Success", "All provinces have been added to the database.");
      fetchProvinces();
    } catch (error) {
      console.error("Error populating provinces: ", error);
      Alert.alert("Error", "Failed to populate provinces.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator />
      </View>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <View style={[styles.container, { backgroundColor: colors.body }]}>
      <FilterHeader
        title={t('provinces')}
        search={search}
        status={''}
        statusOptions={[]}
        storageKey="filters:provinces"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(s => !s)}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />
      {isAdmin && (
        <PrimaryButton title={`${t('add')} ${t('provinces')}`} onPress={() => setIsAddModalVisible(true)} style={styles.addBtn} />
      )}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { shadowOpacity: 0 } : {}]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing(30) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchProvinces();
              setRefreshing(false);
            }}
          />
        }
      />

      <Modal visible={isAddModalVisible} transparent animationType="fade" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('add')} {t('provinces')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              value={newProvinceName}
              onChangeText={setNewProvinceName}
        placeholder={t('province')}
              {...inputCommonProps}
            />
            <View style={styles.modalActions}>
        <PrimaryButton title={t('add')} style={styles.flexBtn} onPress={async () => {
                if (newProvinceName.trim() === '') {
          Alert.alert(t('invalid_name') || 'Invalid Name', `${t('province')} ${t('cannot_be_empty') || 'cannot be empty.'}`);
                  return;
                }
                try {
                  const provincesCollection = collection(db, 'provinces');
                  await addDoc(provincesCollection, { name: newProvinceName.trim() });
                  setNewProvinceName('');
                  setIsAddModalVisible(false);
                  fetchProvinces();
                } catch (error) {
                  Alert.alert(t('error') || 'Error', t('failed_to_add_province') || 'Failed to add province.');
                }
              }} />
  <SecondaryButton title={t('cancel')} style={styles.flexBtn} onPress={() => { setIsAddModalVisible(false); setNewProvinceName(''); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: spacing(4) },
  screenTitle: { ...typography.h1, textAlign: 'center', marginBottom: spacing(4) },
  addBtn: { marginBottom: spacing(3) },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: palette.text },
  // Modal
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing(6), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { width: '100%', backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing(5) },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing(5), color: palette.text },
  modalActions: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(2) },
  flexBtn: { flex: 1 },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, backgroundColor: palette.surfaceAlt, paddingHorizontal: spacing(3), paddingVertical: spacing(3), fontSize: 14 },
});
