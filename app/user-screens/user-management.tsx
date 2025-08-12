import { useState, useEffect, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '@/components/I18n';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { InfoRow } from '../../components/ui/InfoRow';
import FilterHeader from '../../components/ui/FilterHeader';
import { compareCreatedAt } from '../../utils/sort';

export default function UserManagementScreen() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  type UserItem = {
    id: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    province?: string;
    city?: string;
    [key: string]: any;
  };
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    phone: '',
    province: '',
    city: '',
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  const isFocused = useIsFocused();
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            const role = docSnap.data().role;
            setUserRole(role);
            fetchUsers(role);
          }
        });
      } else {
        setUserRole(null);
        setUsers([]);
      }
    });
    return () => unsubscribe();
  }, [isFocused]);

  const fetchUsers = async (role: string) => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      let q;
      if (role === 'area manager') {
        q = query(usersCollection, where("role", "in", ["guest","Iris - TL", "Iris - BA"]));
      } else {
        q = query(usersCollection, where("role", "!=", "superadmin"));
      }
      const userSnapshot = await getDocs(q);
      const userList = userSnapshot.docs.map(doc => {
        const data = doc.data() || {};
        return { id: doc.id, role: data.role, firstName: data.firstName, lastName: data.lastName, phone: data.phone, province: data.province, city: data.city, ...data } as UserItem;
      });
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users: ", error);
  Alert.alert(t('error') || 'Error', 'Failed to fetch users. Check Firestore permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      role: user.role || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      province: user.province || '',
      city: user.city || '',
    });
    setIsModalVisible(true);
  };

  const handleUpdate = () => {
    if (selectedUser) {
      const userDoc = doc(db, "users", selectedUser.id);
      updateDoc(userDoc, formData).then(() => {
        setIsModalVisible(false);
        setSelectedUser(null);
        if (userRole) fetchUsers(userRole);
      }).catch(error => {
          Alert.alert("Update Failed", error.message);
      });
    }
  };

  const canManage = userRole === 'admin' || userRole === 'superadmin';
  const canEdit = canManage; // restrict edits to admin/superadmin

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? users.filter((u) => {
          const hay = [u.email, u.firstName, u.lastName, u.phone, u.city, u.province, u.role]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(term);
        })
      : users;
    return [...list].sort((a, b) => compareCreatedAt(a, b, sortAsc));
  }, [users, search, sortAsc]);

  if (loading) {
    return (
      <View style={[styles.screen, isDark && { backgroundColor: '#0b1220' }, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }

  // Hard guard: only admin/superadmin may access this screen
  if (!(userRole === 'admin' || userRole === 'superadmin')) {
    return (
      <View style={[styles.screen, isDark && { backgroundColor: '#0b1220' }, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#e5e7eb' : palette.text }}>{t('access_denied') || 'Access denied'}</Text>
        <Text style={{ marginTop: spacing(1), color: isDark ? '#94a3b8' : palette.textMuted }}>{t('no_permission') || "You don't have permission to view this page."}</Text>
      </View>
    );
  }

  return (
  <View style={[styles.screen, isDark && { backgroundColor: '#0b1220' }]}>
      <FilterHeader
        title={t('user_mgmt')}
        search={search}
        status={''}
        statusOptions={[]}
        storageKey="filters:users"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(s => !s)}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />
      {/* local filter + sort */}
      
      
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, isDark && { color: '#e5e7eb' }]}>{item.email || (t('unknown') || 'Unknown')}</Text>
              <StatusPill label={item.role || '-'} tone={item.role?.includes('admin') ? 'primary' : item.role?.includes('manager') ? 'info' : 'neutral'} />
            </View>
            <InfoRow label={t('personal_info') || 'Name'} value={`${item.firstName || ''} ${item.lastName || ''}`.trim() || '-'} />
            <InfoRow label={t('phone') || 'Phone'} value={item.phone || '-'} />
            <InfoRow label={t('city') || 'City'} value={item.city || '-'} />
            <InfoRow label={t('province') || 'Province'} value={item.province || '-'} />
      {canEdit && (
              <View style={styles.actionsRow}>
        <SecondaryButton title={t('edit')} onPress={() => handleEdit(item)} style={styles.actionBtn} />
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing(15) }}
      />
      {selectedUser && (
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalScroll} style={[styles.modalContent, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}> 
              <Text style={[styles.modalTitle, isDark && { color: '#e5e7eb' }]}>{(t('edit_user') || 'Edit User')}</Text>
              <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{t('role') || 'Role'}</Text>
              <View style={[styles.pickerWrapper, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937' }]}>
                <Picker
                  selectedValue={formData.role}
                  onValueChange={(itemValue) => setFormData({ ...formData, role: itemValue })}
                >
                  <Picker.Item label="guest" value="guest" />
                  <Picker.Item label="area manager" value="area manager" />
                  <Picker.Item label="Iris - BA" value="Iris - BA" />
                  <Picker.Item label="Iris - TL" value="Iris - TL" />
                  <Picker.Item label="Iris" value="Iris" />
                  <Picker.Item label="Dima" value="Dima" />
                  <Picker.Item label="Diageo" value="Diageo" />
                  {userRole === 'superadmin' && <Picker.Item label="admin" value="admin" />}
                </Picker>
              </View>
              <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{t('first_name') || 'First Name'}</Text>
              <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.firstName} onChangeText={(text) => setFormData({...formData, firstName: text})} placeholder={t('first_name') || 'First Name'} placeholderTextColor={isDark ? '#64748b' : undefined} />
              <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{t('last_name') || 'Last Name'}</Text>
              <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.lastName} onChangeText={(text) => setFormData({...formData, lastName: text})} placeholder={t('last_name') || 'Last Name'} placeholderTextColor={isDark ? '#64748b' : undefined} />
              <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{t('phone') || 'Phone'}</Text>
              <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.phone} onChangeText={(text) => setFormData({...formData, phone: text})} placeholder={t('phone') || 'Phone'} placeholderTextColor={isDark ? '#64748b' : undefined} />
              <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{t('province') || 'Province'}</Text>
              <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.province} onChangeText={(text) => setFormData({...formData, province: text})} placeholder={t('province') || 'Province'} placeholderTextColor={isDark ? '#64748b' : undefined} />
              <Text style={[styles.fieldLabel, isDark && { color: '#94a3b8' }]}>{t('city') || 'City'}</Text>
              <TextInput style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]} value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} placeholder={t('city') || 'City'} placeholderTextColor={isDark ? '#64748b' : undefined} />
              <View style={styles.modalActions}>
                <PrimaryButton title={t('update')} onPress={handleUpdate} style={{ flex:1 }} />
                <SecondaryButton title={t('cancel')} onPress={() => setIsModalVisible(false)} style={{ flex:1 }} />
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: spacing(5), paddingTop: spacing(10) },
  screenTitle: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  actionsRow: { flexDirection: 'row', marginTop: spacing(4) },
  actionBtn: { flex: 1 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalContent: { maxHeight: '90%', backgroundColor: palette.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing(6), paddingTop: spacing(6) },
  modalScroll: { paddingBottom: spacing(15) },
  modalTitle: { ...typography.h2, color: palette.text, textAlign: 'center', marginBottom: spacing(6) },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: palette.textMuted, marginBottom: spacing(2), marginLeft: spacing(1) },
  pickerWrapper: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, marginBottom: spacing(5), backgroundColor: palette.surfaceAlt },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: spacing(4), marginBottom: spacing(5), backgroundColor: palette.surfaceAlt, fontSize: 14, color: palette.text },
  modalActions: { flexDirection: 'row', gap: spacing(4), marginTop: spacing(2), marginBottom: spacing(8) },
});
