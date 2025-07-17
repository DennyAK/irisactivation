import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Button, Modal, TextInput, Alert, Image, Platform } from 'react-native';
import { auth, db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TabOneScreen() {
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      fetchUserData(currentUser);
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
      <Text style={styles.title}>Welcome User Profile Page</Text>
      {image && <Image source={{ uri: image }} style={styles.image} />}
      <Button title="Change Profile Picture" onPress={pickImage} />
      <Text>Email: {user.email}</Text>
      <Text>Role: {user.role}</Text>
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
            <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData({...formData, phone: text})} placeholder="Phone" />
            <TextInput style={styles.input} value={formData.province} onChangeText={(text) => setFormData({...formData, province: text})} placeholder="Province" />
            <TextInput style={styles.input} value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} placeholder="City" />
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdate} />
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
