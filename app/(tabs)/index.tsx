import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button, Modal, TextInput, Alert, Image, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile-pictures/${auth.currentUser?.uid}`);
      uploadBytes(storageRef, blob).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
          setImage(downloadURL);
          const userDoc = doc(db, "users", auth.currentUser!.uid);
          updateDoc(userDoc, { photoURL: downloadURL });
        });
      });
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
    <ScrollView style={styles.bg} contentContainerStyle={{ paddingBottom: 40 }}>
      <Ionicons
        name="information-circle-outline"
        size={30}
        color="#007bff"
        style={styles.infoIcon}
        onPress={() => router.push('/modal')}
      />
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.85}>
          {image ? (
            <Image source={{ uri: image }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={110} color="#c7c7c7" />
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.profileName}>
          {(formData.firstName || '').trim() || 'First Name'} {(formData.lastName || '').trim()}
        </Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <View style={styles.roleRow}>
          <Text style={styles.roleLabel}>Role:</Text>
            <Text style={styles.roleValue}>{user.role}</Text>
            {user.role === 'guest' && (
              <TouchableOpacity style={styles.roleRequestBtn} onPress={() => setIsRoleRequestModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={16} color="#007bff" />
                <Text style={styles.roleRequestBtnText}>Request Role</Text>
              </TouchableOpacity>
            )}
        </View>
        {latestRoleRequest && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Role Request Status</Text>
            <Text style={styles.statusText}>Requested: {latestRoleRequest.requestedRole}</Text>
            <Text style={styles.statusText}>Status: {latestRoleRequest.status}</Text>
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

      {/* Role Request Modal */}
      <Modal
        visible={isRoleRequestModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRoleRequestModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
            <Text style={styles.title}>Request New Role</Text>
            <Text>Select Role</Text>
            <View style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 5, marginBottom: 12 }}>
              <Picker
                selectedValue={requestedRole}
                onValueChange={(itemValue) => setRequestedRole(itemValue)}
                style={{ height: 60, minHeight: 60 }}
              >
                <Picker.Item label="Select a role..." value="" />
                <Picker.Item label="admin" value="admin" />
                <Picker.Item label="area manager" value="area manager" />
                <Picker.Item label="Iris - TL" value="Iris - TL" />
                <Picker.Item label="Iris - BA" value="Iris - BA" />
                <Picker.Item label="guest" value="guest" />
              </Picker>
            </View>
            <Text>Reason</Text>
            <TextInput
              style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
              value={roleReason}
              onChangeText={setRoleReason}
              placeholder="Why do you need this role?"
              multiline={true}
              numberOfLines={3}
            />
            <View style={styles.buttonContainer}>
              <Button title="Submit Request" onPress={async () => {
                if (!requestedRole) {
                  Alert.alert('Error', 'Please enter a role to request.');
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
                  await import('../../firebaseConfig').then(({ db }) => {
                    import('firebase/firestore').then(({ collection, addDoc }) => {
                      addDoc(collection(db, 'role_requests'), roleRequestDoc).then(() => {
                        Alert.alert('Request Sent', 'Your request for a new role has been submitted.');
                        setIsRoleRequestModalVisible(false);
                        setRequestedRole('');
                        setRoleReason('');
                      }).catch((error) => {
                        Alert.alert('Error', error.message);
                      });
                    });
                  });
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
              }} />
              <Button title="Cancel" onPress={() => setIsRoleRequestModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Profile</Text>
            <TextInput style={styles.input} value={formData.firstName} onChangeText={(text) => setFormData({...formData, firstName: text})} placeholder="First Name" />
            <TextInput style={styles.input} value={formData.lastName} onChangeText={(text) => setFormData({...formData, lastName: text})} placeholder="Last Name" />
            <TextInput
              style={styles.input}
              value={formData.phone.startsWith('+62') ? formData.phone.slice(3) : (formData.phone.startsWith('0') ? formData.phone.slice(1) : formData.phone)}
              onChangeText={(text) => {
                // Remove any leading zero
                let clean = text.replace(/^0+/, '');
                setFormData({ ...formData, phone: '+62' + clean });
              }}
              placeholder="81234567890"
              keyboardType="phone-pad"
              maxLength={13}
            />
            <Text style={{position:'absolute', left:22, top:160, fontSize:16, color:'#333', zIndex:2}}>+62</Text>
            <Text style={{fontSize:12, color:'#888', marginBottom:8, marginTop:8}}>
              Format: +6281234567890 (Indonesia)
            </Text>
            <TextInput style={styles.input} value={formData.province} onChangeText={(text) => setFormData({...formData, province: text})} placeholder="Province" />
            <TextInput style={styles.input} value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} placeholder="City" />
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={() => {
                // Always ensure phone starts with +62
                let phone = formData.phone;
                if (phone.startsWith('0')) {
                  phone = '+62' + phone.slice(1);
                } else if (!phone.startsWith('+62')) {
                  phone = '+62' + phone.replace(/^\+?/, '');
                }
                if (!/^\+62\d{9,13}$/.test(phone)) {
                  Alert.alert('Invalid Phone', 'Please enter a valid Indonesian phone number, e.g. 81234567890');
                  return;
                }
                setFormData({ ...formData, phone });
                setTimeout(() => handleUpdate(), 0);
              }} />
              <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Reusable info row component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#f5f7fa' },
  infoIcon: { position: 'absolute', top: 18, right: 20, zIndex: 20 },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 56,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: '#e5e7eb' },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#007bff',
    borderRadius: 14,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: { fontSize: 22, fontWeight: '700', color: '#222', marginTop: 6 },
  profileEmail: { color: '#6b7280', marginBottom: 8, fontSize: 14 },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  roleLabel: { fontWeight: '600', color: '#374151', marginRight: 4 },
  roleValue: { fontWeight: '700', color: '#007bff' },
  roleRequestBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 10, backgroundColor: '#eaf4ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  roleRequestBtnText: { color: '#007bff', marginLeft: 4, fontSize: 12, fontWeight: '600' },
  statusCard: { backgroundColor: '#f0f6ff', padding: 12, width: '100%', borderRadius: 12, marginTop: 8 },
  statusTitle: { fontSize: 13, fontWeight: '700', color: '#0369a1', marginBottom: 2 },
  statusText: { fontSize: 12, color: '#374151' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007bff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, marginTop: 14 },
  editBtnText: { color: '#fff', fontWeight: '600', marginLeft: 8, fontSize: 14 },
  infoSection: { backgroundColor: '#fff', marginTop: 20, marginHorizontal: 20, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f2f4' },
  infoLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 22 },
  input: { height: 44, borderColor: '#d1d5db', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#fff' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
});
