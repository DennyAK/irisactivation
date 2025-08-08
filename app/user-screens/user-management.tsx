
import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { InfoRow } from '../../components/ui/InfoRow';

export default function UserManagementScreen() {
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

  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;
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
      Alert.alert("Error", "Failed to fetch users. Check Firestore permissions.");
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
  const canEdit = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>User Management</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.email || 'Unknown'}</Text>
              <StatusPill label={item.role || '-'} tone={item.role?.includes('admin') ? 'primary' : item.role?.includes('manager') ? 'info' : 'neutral'} />
            </View>
            <InfoRow label="Name" value={`${item.firstName || ''} ${item.lastName || ''}`.trim() || '-'} />
            <InfoRow label="Phone" value={item.phone || '-'} />
            <InfoRow label="City" value={item.city || '-'} />
            <InfoRow label="Province" value={item.province || '-'} />
            {canEdit && (
              <View style={styles.actionsRow}>
                <SecondaryButton title="Edit" onPress={() => handleEdit(item)} style={styles.actionBtn} />
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
            <ScrollView contentContainerStyle={styles.modalScroll} style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.pickerWrapper}>
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
                  {userRole === 'superadmin' && <Picker.Item label="admin" value="admin" />}
                </Picker>
              </View>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput style={styles.input} value={formData.firstName} onChangeText={(text) => setFormData({...formData, firstName: text})} placeholder="First Name" />
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput style={styles.input} value={formData.lastName} onChangeText={(text) => setFormData({...formData, lastName: text})} placeholder="Last Name" />
              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData({...formData, phone: text})} placeholder="Phone" />
              <Text style={styles.fieldLabel}>Province</Text>
              <TextInput style={styles.input} value={formData.province} onChangeText={(text) => setFormData({...formData, province: text})} placeholder="Province" />
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput style={styles.input} value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} placeholder="City" />
              <View style={styles.modalActions}>
                <PrimaryButton title="Update" onPress={handleUpdate} style={{ flex:1 }} />
                <SecondaryButton title="Cancel" onPress={() => setIsModalVisible(false)} style={{ flex:1 }} />
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
