import { useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

export default function OutletsScreen() {
  const router = useRouter();
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    outletName: '',
    outletProvince: '',
    outletCity: '',
    outletChannel: '',
    outletTier: '',
    outletCompleteAddress: '',
    outletContactNo: '',
    outletPicName: '',
    outletPicContactNumber: '',
    outletSocialMedia: '',
    outletCapacity: '',
    outletNoOfTableAVailable: '',
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
    fetchProvinces();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchOutlets();
    }
  }, [userRole]);

  useEffect(() => {
    if (formData.outletProvince) {
      fetchCities(formData.outletProvince);
    } else {
      setCities([]);
    }
  }, [formData.outletProvince]);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setFormData({
      ...formData,
      latitude: location.coords.latitude.toString(),
      longitude: location.coords.longitude.toString(),
    });
  };

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const outletsCollection = collection(db, 'outlets');
      const outletSnapshot = await getDocs(outletsCollection);
      const outletList = await Promise.all(
        outletSnapshot.docs.map(async (outletDoc) => {
          const outletData = outletDoc.data();
          let provinceName = 'Unknown';
          if (outletData.outletProvince) {
            const provinceDocRef = doc(db, 'provinces', outletData.outletProvince);
            const provinceDocSnap = await getDoc(provinceDocRef);
            if (provinceDocSnap.exists()) {
              provinceName = provinceDocSnap.data().name;
            }
          }
          let cityName = 'Unknown';
          if (outletData.outletCity) {
            const cityDocRef = doc(db, 'cities', outletData.outletCity);
            const cityDocSnap = await getDoc(cityDocRef);
            if (cityDocSnap.exists()) {
              cityName = cityDocSnap.data().name;
            }
          }
          return { id: outletDoc.id, ...outletData, provinceName, cityName };
        })
      );
      setOutlets(outletList);
    } catch (error) {
      console.error("Error fetching outlets: ", error);
      Alert.alert("Error", "Failed to fetch outlets.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const provincesCollection = collection(db, 'provinces');
      const provinceSnapshot = await getDocs(provincesCollection);
      const provinceList = provinceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProvinces(provinceList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching provinces: ", error);
    }
  };

  const fetchCities = async (provinceId: string) => {
    try {
      const citiesCollection = collection(db, 'cities');
      const q = query(citiesCollection, where("provinceId", "==", provinceId));
      const citySnapshot = await getDocs(q);
      const cityList = citySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCities(cityList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching cities: ", error);
    }
  };

  const resetFormData = () => {
    setFormData({
        outletName: '', outletProvince: '', outletCity: '', outletChannel: '', outletTier: '', outletCompleteAddress: '',
        outletContactNo: '', outletPicName: '', outletPicContactNumber: '',
        outletSocialMedia: '', outletCapacity: '', outletNoOfTableAVailable: '', longitude: '', latitude: '',
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
        outletChannel: outlet.outletChannel || '',
        outletTier: outlet.outletTier || '',
        outletCompleteAddress: outlet.outletCompleteAddress || '',
        outletContactNo: outlet.outletContactNo || '',
        outletPicName: outlet.outletPicName || '',
        outletPicContactNumber: outlet.outletPicContactNumber || '',
        outletSocialMedia: outlet.outletSocialMedia || '',
        outletCapacity: outlet.outletCapacity || '',
        outletNoOfTableAVailable: outlet.outletNoOfTableAVailable || '',
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
      <Text>Province: {item.provinceName || '-'}</Text>
      <Text>Address: {item.outletCompleteAddress}, {item.cityName}, {item.provinceName}</Text>
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
      <Picker
        selectedValue={formData.outletProvince}
        onValueChange={(itemValue) => setFormData({...formData, outletProvince: itemValue, outletCity: ''})}
      >
        <Picker.Item label="Select a Province" value="" />
        {provinces.map(province => (
          <Picker.Item key={province.id} label={province.name} value={province.id} />
        ))}
      </Picker>
      {/* Province display (read-only, based on selected province) */}
      <Text style={styles.input}>
        Province: {(() => {
          const selectedProvince = provinces.find(p => p.id === formData.outletProvince);
          return selectedProvince?.name || '-';
        })()}
      </Text>
      <Picker
        selectedValue={formData.outletCity}
        onValueChange={(itemValue) => setFormData({...formData, outletCity: itemValue})}
        enabled={!!formData.outletProvince}
      >
        <Picker.Item label="Select a City/Regency" value="" />
        {cities.map(city => (
          <Picker.Item key={city.id} label={city.name} value={city.id} />
        ))}
      </Picker>
      

      <Picker
        selectedValue={formData.outletChannel}
        onValueChange={(itemValue) => setFormData({ ...formData, outletChannel: itemValue })}
      >
        <Picker.Item label="Select Channel" value="" />
        <Picker.Item label="MOT" value="MOT" />
        <Picker.Item label="MOT WEEKLY" value="MOT WEEKLY" />
        <Picker.Item label="MOT MONTHLY" value="MOT MONTHLY" />
        <Picker.Item label="MM" value="MM" />
        <Picker.Item label="EVENT" value="EVENT" />
      </Picker>

      <Picker
        selectedValue={formData.outletTier}
        onValueChange={(itemValue) => setFormData({ ...formData, outletTier: itemValue })}
      >
        <Picker.Item label="Select Tier" value="" />
        <Picker.Item label="2.1 (kegs)" value="2.1(kegs)" />
        <Picker.Item label="2.2 (md)" value="2.2(md)" />
        <Picker.Item label="3 (gdic)" value="3(gdic)" />
        <Picker.Item label="4 (smooth&gfes)" value="4(smooth&gfes)" />
      </Picker>

      <TextInput style={styles.input} value={formData.outletCompleteAddress} onChangeText={(text) => setFormData({...formData, outletCompleteAddress: text})} placeholder="Complete Address" />
      <TextInput style={styles.input} value={formData.outletContactNo} onChangeText={(text) => setFormData({...formData, outletContactNo: text})} placeholder="Contact Number" />
      <TextInput style={styles.input} value={formData.outletPicName} onChangeText={(text) => setFormData({...formData, outletPicName: text})} placeholder="PIC Name" />
      <TextInput style={styles.input} value={formData.outletPicContactNumber} onChangeText={(text) => setFormData({...formData, outletPicContactNumber: text})} placeholder="PIC Contact Number" />
      <TextInput style={styles.input} value={formData.outletSocialMedia} onChangeText={(text) => setFormData({...formData, outletSocialMedia: text})} placeholder="Social Media" />
      <TextInput style={styles.input} value={formData.outletCapacity} onChangeText={(text) => setFormData({...formData, outletCapacity: text})} placeholder="Capacity (Person)" keyboardType='numeric' />
      <TextInput style={styles.input} value={formData.outletNoOfTableAVailable} onChangeText={(text) => setFormData({...formData, outletNoOfTableAVailable: text})} placeholder="No. of Tables Available (tables)" keyboardType='numeric'/>

      <Button title="Get Current Location" onPress={getLocation} />
      <TextInput style={styles.input} value={formData.latitude} onChangeText={(text) => setFormData({...formData, latitude: text})} placeholder="Latitude" />
      <TextInput style={styles.input} value={formData.longitude} onChangeText={(text) => setFormData({...formData, longitude: text})} placeholder="Longitude" />
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outlets</Text>
      {canCreateOrEdit && <Button title="Add New Outlet" onPress={() => setIsAddModalVisible(true)} />}
      <FlatList
        data={outlets}
        keyExtractor={(item) => item.id}
        renderItem={renderOutlet}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchOutlets();
              setRefreshing(false);
            }}
          />
        }
      />
      
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
