import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Modal, TextInput, StyleSheet, Alert, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { compareCreatedAt } from '../../utils/sort';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import FilterHeader from '../../components/ui/FilterHeader';
import { useRouter } from 'expo-router';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function ActivationScreen() {
  const router = useRouter();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
  const [activations, setActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [formData, setFormData] = useState({
    activationId: '',
    activationName: '',
    activationDetail: '',
  });
  const [selectedActivation, setSelectedActivation] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
    setCurrentUserId(user.uid);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap: DocumentSnapshot = await getDoc(userDocRef);
          if (docSnap.exists()) setUserRole((docSnap.data() as any).role || '');
          else setUserRole('');
        } catch {
          setUserRole('');
        }
      } else {
        setUserRole('');
    setCurrentUserId(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (userRole !== null) fetchActivations();
  }, [userRole]);

  const fetchActivations = async () => {
    setLoading(true);
    try {
      const activationsCollection = collection(db, 'activations');
      const snapshot = await getDocs(activationsCollection);
      const activationList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Enrich with creator's name like Projects screen
      const withNames = await Promise.all(activationList.map(async (a: any) => {
        let createdByName = 'Unknown User';
        let updatedByName = undefined as string | undefined;
        try {
          if (a.createdBy) {
            const userRef = doc(db, 'users', a.createdBy);
            const uSnap = await getDoc(userRef);
            if (uSnap.exists()) {
              const u = uSnap.data() as any;
              createdByName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || createdByName;
            }
          }
          if (a.updatedBy) {
            const userRef2 = doc(db, 'users', a.updatedBy);
            const uSnap2 = await getDoc(userRef2);
            if (uSnap2.exists()) {
              const u2 = uSnap2.data() as any;
              updatedByName = `${u2.firstName || ''} ${u2.lastName || ''}`.trim() || u2.email || 'Unknown User';
            }
          }
        } catch {}
        return { ...a, createdByName, updatedByName };
      }));
      setActivations(withNames as any[]);
    } catch (error) {
  Alert.alert(t('error') || 'Error', t('failed_to_fetch_activations') || 'Failed to fetch activations.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? activations.filter((a) => {
          const hay = [a.activationName, a.activationId, a.activationDetail].filter(Boolean).join(' ').toLowerCase();
          return hay.includes(term);
        })
      : activations;
  return [...list].sort((a, b) => compareCreatedAt(a, b, sortAsc));
  }, [activations, search, sortAsc]);

  const handleAddOrUpdate = async () => {
    if (!formData.activationId || !formData.activationName) {
      Alert.alert(t('validation') || 'Validation', t('activation_id_and_name_required') || 'Activation ID and Name are required.');
      return;
    }
    try {
      if (selectedActivation) {
        await updateDoc(doc(db, 'activations', selectedActivation.id), { ...formData, updatedAt: serverTimestamp(), updatedBy: currentUserId || null });
      } else {
  await addDoc(collection(db, 'activations'), { ...formData, createdAt: serverTimestamp(), createdBy: currentUserId || null });
      }
      setIsModalVisible(false);
      setFormData({ activationId: '', activationName: '', activationDetail: '' });
      setSelectedActivation(null);
      fetchActivations();
    } catch (error) {
      Alert.alert(t('error') || 'Error', t('failed_to_save_activation') || 'Failed to save activation.');
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      activationId: item.activationId || '',
      activationName: item.activationName || '',
      activationDetail: item.activationDetail || '',
    });
    setSelectedActivation(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'activations', id));
      fetchActivations();
    } catch (error) {
      Alert.alert(t('error') || 'Error', t('failed_to_delete_activation') || 'Failed to delete activation.');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: spacing(10) }} />;
  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isSuperadmin = userRole === 'superadmin';
  const canEdit = isAdmin || userRole === 'area manager';

  return (
    <View style={[styles.container, isDark && { backgroundColor: '#0b1220' }]}>
      <FilterHeader
        title={t('activations') || 'Activations'}
        search={search}
        status={''}
        statusOptions={[]}
        storageKey="filters:activations"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(s => !s)}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />
      {isAdmin && (
        <PrimaryButton title={t('add_activation') || 'Add Activation'} onPress={() => { setFormData({ activationId: '', activationName: '', activationDetail: '' }); setSelectedActivation(null); setIsModalVisible(true); }} style={{ marginBottom: spacing(3) }} />
      )}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isDark && { color: '#e5e7eb' }]}>{item.activationName}</Text>
            </View>
      <Text style={[styles.meta, isDark && { color: '#94a3b8' }]}>{(t('id') || 'ID') + ': '}<Text style={[styles.metaStrong, isDark && { color: '#e5e7eb' }]}>{item.activationId}</Text></Text>
      {!!item.activationDetail && <Text style={[styles.meta, isDark && { color: '#94a3b8' }]}>{(t('detail') || 'Detail') + ': '}<Text style={[styles.metaStrong, isDark && { color: '#e5e7eb' }]}>{item.activationDetail}</Text></Text>}
      {!!item.updatedBy && <Text style={[styles.meta, isDark && { color: '#94a3b8' }]}>{(t('last_updated_by') || 'Last updated by') + ': '}<Text style={[styles.metaStrong, isDark && { color: '#e5e7eb' }]}>{item.updatedByName || t('unknown_user') || 'Unknown User'}</Text></Text>}
      {!!item.createdByName && <Text style={[styles.meta, isDark && { color: '#94a3b8' }]}>{(t('creator') || 'Creator') + ': '}<Text style={[styles.metaStrong, isDark && { color: '#e5e7eb' }]}>{item.createdByName}</Text></Text>}
            <View style={styles.actionsRow}>
              {isAdmin && (
                <SecondaryButton
          title={t('view_audit') || 'View Audit'}
                  onPress={() => router.push({ pathname: '/audit-screens/audit-logs' as any, params: { collection: 'activations', docId: item.id } })}
                  style={styles.flexBtn}
                />
              )}
        {canEdit && <SecondaryButton title={t('edit') || 'Edit'} onPress={() => handleEdit(item)} style={styles.flexBtn} />}
        {isSuperadmin && <SecondaryButton title={t('delete') || 'Delete'} onPress={() => handleDelete(item.id)} style={[styles.flexBtn, styles.deleteBtn]} />}
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchActivations();
              setRefreshing(false);
            }}
          />
        }
      />
      <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalSheet, isDark && { backgroundColor: '#111827' }]}>
            <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>{`${selectedActivation ? (t('edit') || 'Edit') : (t('add') || 'Add')} ${t('activation') || 'Activation'}`}</Text>
            <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.activationId} onChangeText={text => setFormData({ ...formData, activationId: text })} placeholder={t('activation_id') || 'Activation ID'} placeholderTextColor={isDark ? '#64748b' : undefined} />
            <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.activationName} onChangeText={text => setFormData({ ...formData, activationName: text })} placeholder={t('activation_name') || 'Activation Name'} placeholderTextColor={isDark ? '#64748b' : undefined} />
            <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.activationDetail} onChangeText={text => setFormData({ ...formData, activationDetail: text })} placeholder={t('activation_detail') || 'Activation Detail'} placeholderTextColor={isDark ? '#64748b' : undefined} />
            <View style={styles.modalActions}>
              <PrimaryButton title={selectedActivation ? (t('update') || 'Update') : (t('add') || 'Add')} onPress={handleAddOrUpdate} style={styles.flexBtn} />
              <SecondaryButton title={t('cancel') || 'Cancel'} onPress={() => setIsModalVisible(false)} style={styles.flexBtn} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: spacing(4) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(4), marginBottom: spacing(3), borderWidth: 1, borderColor: palette.border, ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flexShrink: 1 },
  meta: { fontSize: 13, color: palette.textMuted, marginBottom: spacing(1.2) },
  metaStrong: { color: palette.text },
  actionsRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(3) },
  flexBtn: { flex: 1 },
  deleteBtn: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { width: '90%', backgroundColor: palette.surface, padding: spacing(5), borderRadius: radius.xl },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing(5), color: palette.text },
  modalActions: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(2) },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, backgroundColor: palette.surfaceAlt, paddingHorizontal: spacing(3), paddingVertical: spacing(3), marginBottom: spacing(3), fontSize: 14 },
});
