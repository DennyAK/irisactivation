import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button, Modal, TextInput, Alert, Image, Platform } from 'react-native';
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
      <View style={styles.container}>
        <Text>Please log in to see your profile.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons
        name="information-circle-outline"
        size={32}
        color="#007bff"
        style={{ position: 'absolute', top: 40, right: 24, zIndex: 10 }}
        onPress={() => router.push('/modal')}
      />
      <Text style={styles.title}>Welcome User Profile Page</Text>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Button title="Change Profile Picture" onPress={pickImage} />
      <Text>Email: {user.email}</Text>
      {/* Display latest role request status */}
      {latestRoleRequest && (
        <View style={{ marginBottom: 8, alignItems: 'center' }}>
          <Text style={{ fontWeight: 'bold' }}>Role Request Status:</Text>
          <Text>Requested Role: {latestRoleRequest.requestedRole}</Text>
          <Text>Status: {latestRoleRequest.status}</Text>
          {latestRoleRequest.reason ? <Text>Reason: {latestRoleRequest.reason}</Text> : null}
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text>Role: {user.role}</Text>
        {user.role === 'guest' && (
          <Button title="Ask New Role?" onPress={() => setIsRoleRequestModalVisible(true)} />
        )}
      </View>

      {/* Role Request Modal */}
      <Modal
        visible={isRoleRequestModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsRoleRequestModalVisible(false)}
      >
        <View style={styles.modalContainer}>
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
      <Text>First Name: {user.firstName}</Text>
      <Text>Last Name: {user.lastName}</Text>
      <Text>Phone: {user.phone}</Text>
      <Text>Province: {user.province}</Text>
      <Text>City: {user.city}</Text>
      <Button title="Edit Profile" onPress={() => setIsModalVisible(true)} />

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    minHeight: 320,
    justifyContent: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  }
});
