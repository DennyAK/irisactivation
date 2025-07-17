import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function OutletsScreen() {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    outletName: '',
    outletProvince: '',
    outletCity: '',
    outletCompleteAddress: '',
    outletContactNo: '',
    outletPicName: '',
    outletPicContactNumber: '',
    outletSocialMedia: '',
    longitude: '',
    latitude: '',
  });
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          }
        });
      } else {
        setUserRole(null);
      }
    });
    fetchOutlets();
    return () => unsubscribe();
  }, []);

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const outletsCollection = collection(db, 'outlets');
      const outletSnapshot = await getDocs(outletsCollection);
      const outletList = outletSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOutlets(outletList);
    } catch (error) {
      console.error("Error fetching outlets: ", error);
      Alert.alert("Error", "Failed to fetch outlets.");
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
        outletName: '', outletProvince: '', outletCity: '', outletCompleteAddress: '',
        outletContactNo: '', outletPicName: '', outletPicContactNumber: '',
        outletSocialMedia: '', longitude: '', latitude: '',
    });
  };

  const handleAddOutlet = () => {
    if (formData.outletName.trim() === '') {
      Alert.alert("Invalid Name", "Outlet name cannot be empty.");
      return;
    }
    addDoc(collection(db, "outlets"), {
      ...formData,
      createdAt: serverTimestamp()
    }).then(() => {
      setIsAddModalVisible(false);
      resetFormData();
      fetchOutlets();
    }).catch(error => {
      Alert.alert("Add Failed", error.message);
    });
  };

  const handleEditOutlet = (outlet: any) => {
    setSelectedOutlet(outlet);
    setFormData({
        outletName: outlet.outletName || '',
        outletProvince: outlet.outletProvince || '',
        outletCity: outlet.outletCity || '',
        outletCompleteAddress: outlet.outletCompleteAddress || '',
        outletContactNo: outlet.outletContactNo || '',
        outletPicName: outlet.outletPicName || '',
        outletPicContactNumber: outlet.outletPicContactNumber || '',
        outletSocialMedia: outlet.outletSocialMedia || '',
        longitude: outlet.longitude || '',
        latitude: outlet.latitude || '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateOutlet = () => {
    if (selectedOutlet) {
      const outletDoc = doc(db, "outlets", selectedOutlet.id);
      updateDoc(outletDoc, formData).then(() => {
        setIsEditModalVisible(false);
        resetFormData();
        setSelectedOutlet(null);
        fetchOutlets();
      }).catch(error => {
        Alert.alert("Update Failed", error.message);
      });
    }
  };

  const handleDeleteOutlet = (outletId: string) => {
    Alert.alert("Delete Outlet", "Are you sure you want to delete this outlet?", [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "outlets", outletId)).then(() => {
          fetchOutlets();
        });
      }}
    ]);
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const canCreateOrEdit = isAdmin || userRole === 'area manager';

  const renderOutlet = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.outletName}</Text>
      <Text>Address: {item.outletCompleteAddress}, {item.outletCity}, {item.outletProvince}</Text>
      <Text>Contact: {item.outletContactNo}</Text>
      <Text>PIC: {item.outletPicName} ({item.outletPicContactNumber})</Text>
      <Text>Social Media: {item.outletSocialMedia}</Text>
      <Text>Coords: ({item.latitude}, {item.longitude})</Text>
      {canCreateOrEdit && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditOutlet(item)} />
          {isAdmin && <Button title="Delete" onPress={() => handleDeleteOutlet(item.id)} />}
        </View>
      )}
    </View>
  );

  const renderModalFields = () => (
    <>
      <TextInput style={styles.input} value={formData.outletName} onChangeText={(text) => setFormData({...formData, outletName: text})} placeholder="Outlet Name" />
      <TextInput style={styles.input} value={formData.outletProvince} onChangeText={(text) => setFormData({...formData, outletProvince: text})} placeholder="Province" />
      <TextInput style={styles.input} value={formData.outletCity} onChangeText={(text) => setFormData({...formData, outletCity: text})} placeholder="City" />
      <TextInput style={styles.input} value={formData.outletCompleteAddress} onChangeText={(text) => setFormData({...formData, outletCompleteAddress: text})} placeholder="Complete Address" />
      <TextInput style={styles.input} value={formData.outletContactNo} onChangeText={(text) => setFormData({...formData, outletContactNo: text})} placeholder="Contact Number" />
      <TextInput style={styles.input} value={formData.outletPicName} onChangeText={(text) => setFormData({...formData, outletPicName: text})} placeholder="PIC Name" />
      <TextInput style={styles.input} value={formData.outletPicContactNumber} onChangeText={(text) => setFormData({...formData, outletPicContactNumber: text})} placeholder="PIC Contact Number" />
      <TextInput style={styles.input} value={formData.outletSocialMedia} onChangeText={(text) => setFormData({...formData, outletSocialMedia: text})} placeholder="Social Media" />
      <TextInput style={styles.input} value={formData.latitude} onChangeText={(text) => setFormData({...formData, latitude: text})} placeholder="Latitude" />
      <TextInput style={styles.input} value={formData.longitude} onChangeText={(text) => setFormData({...formData, longitude: text})} placeholder="Longitude" />
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outlets</Text>
      {canCreateOrEdit && <Button title="Add New Outlet" onPress={() => setIsAddModalVisible(true)} />}
      <FlatList data={outlets} keyExtractor={(item) => item.id} renderItem={renderOutlet} />
      
      {/* Add Modal */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add New Outlet</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Add" onPress={handleAddOutlet} />
              <Button title="Cancel" onPress={() => setIsAddModalVisible(false)} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Outlet</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdateOutlet} />
              <Button title="Cancel" onPress={() => { setIsEditModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }
});
