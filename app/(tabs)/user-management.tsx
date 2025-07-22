
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function UserManagementScreen() {
  const [users, setUsers] = useState<any[]>([]);
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
  }, []);

  const fetchUsers = async (role: string) => {
    setLoading(true);
    try {
      const usersCollection = collection(db, 'users');
      let q;
      if (role === 'area manager') {
        q = query(usersCollection, where("role", "in", ["guest"]));
      } else {
        q = query(usersCollection, where("role", "!=", "superadmin"));
      }
      const userSnapshot = await getDocs(q);
      const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    <View style={styles.container}>
      <Text style={styles.title}>User Management</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userContainer}>
            <Text>Email: {item.email}</Text>
            <Text>Role: {item.role}</Text>
            <Text>Name: {item.firstName} {item.lastName}</Text>
            <Text>Phone: {item.phone}</Text>
            <Text>Location: {item.city}, {item.province}</Text>
            <View style={styles.buttonContainer}>
              {canEdit && <Button title="Edit" onPress={() => handleEdit(item)} />}
            </View>
          </View>
        )}
      />
      {selectedUser && (
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.title}>Edit User: {selectedUser.email}</Text>
              <Text>Role</Text>
              {/* Role dropdown: only show 'admin' if userRole is 'superadmin' */}
              <View style={{ borderWidth: 1, borderColor: 'gray', borderRadius: 5, marginBottom: 12 }}>
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
              <Text>First Name</Text>
              <TextInput style={styles.input} value={formData.firstName} onChangeText={(text) => setFormData({...formData, firstName: text})} placeholder="First Name" />
              <Text>Last Name</Text>
              <TextInput style={styles.input} value={formData.lastName} onChangeText={(text) => setFormData({...formData, lastName: text})} placeholder="Last Name" />
              <Text>Phone</Text>
              <TextInput style={styles.input} value={formData.phone} onChangeText={(text) => setFormData({...formData, phone: text})} placeholder="Phone" />
              <Text>Province</Text>
              <TextInput style={styles.input} value={formData.province} onChangeText={(text) => setFormData({...formData, province: text})} placeholder="Province" />
              <Text>City</Text>
              <TextInput style={styles.input} value={formData.city} onChangeText={(text) => setFormData({...formData, city: text})} placeholder="City" />
              <View style={styles.buttonContainer}>
                <Button title="Update" onPress={handleUpdate} />
                <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userContainer: {
    marginBottom: 10,
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
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
});
