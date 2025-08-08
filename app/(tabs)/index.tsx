import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { FormField } from '../../components/ui/FormField';
import { AvatarPicker } from '../../components/ui/AvatarPicker';
import { StatusPill } from '../../components/ui/StatusPill';
import { InfoRow } from '../../components/ui/InfoRow';

export default function TabOneScreen() {
  const router = useRouter();
  const [latestRoleRequest, setLatestRoleRequest] = useState<any>(null);
  const [isRoleRequestModalVisible, setIsRoleRequestModalVisible] = useState(false);
  const [requestedRole, setRequestedRole] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    province: '',
    city: '',
  });
  const [image, setImage] = useState<string | null>(null);

  const fetchUserData = async (currentUser: any) => {
    if (currentUser) {
      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phone: userData.phone || '',
          province: userData.province || '',
          city: userData.city || '',
        });
        if (userData.photoURL) {
          setImage(userData.photoURL);
        }
      } else {
        console.log("No such document!");
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await fetchUserData(currentUser);
      // Fetch latest role request for this user
      if (currentUser) {
        try {
          const { getDocs, collection, query, where, orderBy, limit } = await import('firebase/firestore');
          const q = query(
            collection(db, 'role_requests'),
            where('userId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setLatestRoleRequest(snapshot.docs[0].data());
          } else {
            setLatestRoleRequest(null);
          }
        } catch (e) {
          setLatestRoleRequest(null);
        }
      } else {
        setLatestRoleRequest(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAvatarChange = async (localUri: string) => {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile-pictures/${auth.currentUser?.uid}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setImage(downloadURL);
      if (auth.currentUser) {
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDoc, { photoURL: downloadURL });
      }
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    }
  };

  const handleUpdate = () => {
    if (auth.currentUser) {
      const userDoc = doc(db, "users", auth.currentUser.uid);
      updateDoc(userDoc, formData).then(() => {
        setIsModalVisible(false);
        fetchUserData(auth.currentUser);
      }).catch(error => {
        Alert.alert("Update Failed", error.message);
      });
    }
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!user) {
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#f5f7fa'}}>
        <Text style={{color:'#555'}}>Please log in to see your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.bg} contentContainerStyle={{ paddingBottom: spacing(20) }}>
      <Ionicons
        name="information-circle-outline"
        size={30}
        color={palette.primary}
        style={styles.infoIcon}
        onPress={() => router.push('/modal')}
      />
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <AvatarPicker uri={image} onChange={handleAvatarChange} />
        </View>
        <Text style={styles.profileName}>
          {(formData.firstName || '').trim() || 'First Name'} {(formData.lastName || '').trim()}
        </Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.roleRow}>
          <StatusPill label={user.role} tone={user.role === 'guest' ? 'neutral' : 'primary'} />
          {user.role === 'guest' && (
            <TouchableOpacity style={styles.roleRequestBtn} onPress={() => setIsRoleRequestModalVisible(true)}>
              <Ionicons name="add-circle-outline" size={16} color={palette.primary} />
              <Text style={styles.roleRequestBtnText}>Request Role</Text>
            </TouchableOpacity>
          )}
        </View>
        {latestRoleRequest && (
          <View style={styles.statusCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) }}>
              <Text style={styles.statusTitle}>Role Request</Text>
              <StatusPill
                label={latestRoleRequest.status}
                tone={latestRoleRequest.status === 'approved' ? 'success' : latestRoleRequest.status === 'rejected' ? 'danger' : 'info'}
                style={{ marginLeft: spacing(2) }}
              />
            </View>
            <Text style={styles.statusText}>Requested: {latestRoleRequest.requestedRole}</Text>
            {latestRoleRequest.reason ? (
              <Text style={styles.statusText}>Reason: {latestRoleRequest.reason}</Text>
            ) : null}
          </View>
        )}
        <TouchableOpacity style={styles.editBtn} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Info</Text>
        <InfoRow label="First Name" value={formData.firstName} />
        <InfoRow label="Last Name" value={formData.lastName} />
        <InfoRow label="Phone" value={formData.phone} />
        <InfoRow label="Province" value={formData.province} />
        <InfoRow label="City" value={formData.city} />
        <InfoRow label="Email" value={user.email} />
      </View>

      {/* Role Request Sheet */}
      <ModalSheet visible={isRoleRequestModalVisible} onClose={() => setIsRoleRequestModalVisible(false)} scroll>
        <Text style={styles.sheetTitle}>Request New Role</Text>
        <Text style={styles.sheetLabel}>Select Role</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={requestedRole}
            onValueChange={(itemValue) => setRequestedRole(itemValue)}
            style={{ height: 50 }}
          >
            <Picker.Item label="Select a role..." value="" />
            <Picker.Item label="admin" value="admin" />
            <Picker.Item label="area manager" value="area manager" />
            <Picker.Item label="Iris - TL" value="Iris - TL" />
            <Picker.Item label="Iris - BA" value="Iris - BA" />
            <Picker.Item label="guest" value="guest" />
          </Picker>
        </View>
        <Text style={styles.sheetLabel}>Reason</Text>
        <TextInput
          style={[styles.multiInput]}
          value={roleReason}
          onChangeText={setRoleReason}
          placeholder="Why do you need this role?"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <View style={styles.sheetButtons}>
          <PrimaryButton
            title="Submit"
            onPress={async () => {
              if (!requestedRole) {
                Alert.alert('Error', 'Please select a role to request.');
                return;
              }
              try {
                const roleRequestDoc = {
                  userId: auth.currentUser?.uid || '',
                  email: user.email || '',
                  currentRole: user.role || '',
                  requestedRole,
                  reason: roleReason,
                  status: 'pending',
                  createdAt: new Date(),
                };
                const { db } = await import('../../firebaseConfig');
                const { collection, addDoc } = await import('firebase/firestore');
                await addDoc(collection(db, 'role_requests'), roleRequestDoc);
                Alert.alert('Request Sent', 'Your request for a new role has been submitted.');
                setIsRoleRequestModalVisible(false);
                setRequestedRole('');
                setRoleReason('');
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            }}
          />
          <SecondaryButton title="Cancel" onPress={() => setIsRoleRequestModalVisible(false)} />
        </View>
      </ModalSheet>
      {/* Edit Profile Sheet */}
      <ModalSheet visible={isModalVisible} onClose={() => setIsModalVisible(false)} scroll>
        <Text style={styles.sheetTitle}>Edit Profile</Text>
        <FormField label="First Name" value={formData.firstName} setValue={(v)=> setFormData({...formData, firstName: v})} placeholder="First Name" icon="person-outline" />
        <FormField label="Last Name" value={formData.lastName} setValue={(v)=> setFormData({...formData, lastName: v})} placeholder="Last Name" icon="person-outline" />
        <Text style={styles.sheetLabel}>Phone (Indonesia)</Text>
        <View style={styles.phoneWrapper}>
          <Text style={styles.phonePrefix}>+62</Text>
          <TextInput
            style={styles.phoneInput}
            value={formData.phone.startsWith('+62') ? formData.phone.slice(3) : (formData.phone.startsWith('0') ? formData.phone.slice(1) : formData.phone)}
            onChangeText={(text) => {
              let clean = text.replace(/^0+/, '');
              setFormData({ ...formData, phone: '+62' + clean });
            }}
            placeholder="81234567890"
            keyboardType="phone-pad"
            maxLength={13}
          />
        </View>
        <Text style={styles.helper}>Format: +6281234567890 (Indonesia)</Text>
        <FormField label="Province" value={formData.province} setValue={(v)=> setFormData({...formData, province: v})} placeholder="Province" icon="earth-outline" />
        <FormField label="City" value={formData.city} setValue={(v)=> setFormData({...formData, city: v})} placeholder="City" icon="map-outline" />
        <View style={styles.sheetButtons}>
          <PrimaryButton title="Update" onPress={() => {
            let phone = formData.phone;
            if (phone.startsWith('0')) { phone = '+62' + phone.slice(1); }
            else if (!phone.startsWith('+62')) { phone = '+62' + phone.replace(/^\+?/, ''); }
            if (!/^\+62\d{9,13}$/.test(phone)) {
              Alert.alert('Invalid Phone', 'Please enter a valid Indonesian phone number, e.g. 81234567890');
              return;
            }
            setFormData({ ...formData, phone });
            setTimeout(() => handleUpdate(), 0);
          }} />
          <SecondaryButton title="Cancel" onPress={() => setIsModalVisible(false)} />
        </View>
      </ModalSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: palette.bg },
  infoIcon: { position: 'absolute', top: spacing(4.5), right: spacing(5), zIndex: 20 },
  profileCard: { backgroundColor: palette.surface, marginHorizontal: spacing(5), marginTop: spacing(14), borderRadius: radius.lg, padding: spacing(6), alignItems: 'center', ...shadow.card },
  avatarWrapper: { marginBottom: spacing(2.5) },
  profileName: { fontSize: 22, fontWeight: '700', color: palette.text, marginTop: spacing(1.5) },
  profileEmail: { color: palette.textMuted, marginBottom: spacing(2), fontSize: 14 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(1.5) },
  roleRequestBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing(2.5), backgroundColor: palette.primarySoft, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: radius.md },
  roleRequestBtnText: { color: palette.primary, marginLeft: spacing(1.5), fontSize: 12, fontWeight: '600' },
  statusCard: { backgroundColor: '#f0f6ff', padding: spacing(3), width: '100%', borderRadius: radius.md, marginTop: spacing(2) },
  statusTitle: { fontSize: 13, fontWeight: '700', color: palette.info, marginBottom: spacing(0.5) },
  statusText: { fontSize: 12, color: palette.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.primary, paddingHorizontal: spacing(5), paddingVertical: spacing(2.5), borderRadius: 22, marginTop: spacing(3.5) },
  editBtnText: { color: '#fff', fontWeight: '600', marginLeft: spacing(2), fontSize: 14 },
  infoSection: { backgroundColor: palette.surface, marginTop: spacing(5), marginHorizontal: spacing(5), borderRadius: radius.lg, padding: spacing(5), ...shadow.card },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: palette.text, marginBottom: spacing(3) },
  sheetTitle: { ...typography.h2, color: palette.text, textAlign: 'center', marginBottom: spacing(5) },
  sheetLabel: { ...typography.label, color: palette.text, marginBottom: spacing(2) },
  pickerWrapper: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, marginBottom: spacing(5), backgroundColor: palette.surfaceAlt },
  multiInput: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: spacing(4), backgroundColor: palette.surfaceAlt, minHeight: 120, fontSize: 14, color: palette.text, marginBottom: spacing(5) },
  sheetButtons: { flexDirection: 'row', gap: spacing(4), marginTop: spacing(2) },
  phoneWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingHorizontal: spacing(11), height: 50, marginBottom: spacing(2) },
  phonePrefix: { position: 'absolute', left: spacing(4), fontWeight: '600', color: '#334155' },
  phoneInput: { flex: 1, fontSize: 15, color: palette.text },
  helper: { fontSize: 11, color: palette.textMuted, marginBottom: spacing(4) },
});
