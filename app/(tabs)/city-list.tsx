import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Alert } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, writeBatch, doc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { provinces as provinceData, citiesAndRegencies } from '../../data/indonesian-regions';

export default function CityListScreen() {
  const [cities, setCities] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) setUserRole(docSnap.data().role);
        });
      } else {
        setUserRole(null);
      }
    });
    fetchProvinces();
    return () => unsubscribe();
  }, []);

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const provincesCollection = collection(db, 'provinces');
      const provinceSnapshot = await getDocs(provincesCollection);
      const provinceList = provinceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProvinces(provinceList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching provinces: ", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const handleProvinceChange = (provinceId: string | null) => {
    setSelectedProvince(provinceId);
    if (provinceId) {
      fetchCities(provinceId);
    } else {
      setCities([]);
    }
  };

  const fetchCities = async (provinceId: string) => {
    setLoadingCities(true);
    try {
      const citiesCollection = collection(db, 'cities');
      const q = query(citiesCollection, where("provinceId", "==", provinceId));
      const citySnapshot = await getDocs(q);
      const cityList = citySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCities(cityList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching cities: ", error);
      Alert.alert("Error", "Failed to fetch cities.");
    } finally {
      setLoadingCities(false);
    }
  };

  const handleClearCities = async () => {
    setLoadingCities(true);
    try {
      const citiesCollection = collection(db, 'cities');
      const citySnapshot = await getDocs(citiesCollection);
      const batch = writeBatch(db);
      citySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setCities([]);
      Alert.alert("Success", "All cities have been cleared.");
    } catch (error) {
      console.error("Error clearing cities: ", error);
      Alert.alert("Error", "Failed to clear cities.");
    } finally {
      setLoadingCities(false);
    }
  };

  const handlePopulateCities = async () => {
    setLoadingCities(true);
    try {
      const citiesCollection = collection(db, 'cities');
      const snapshot = await getDocs(citiesCollection);
      if (!snapshot.empty) {
        Alert.alert("Already Populated", "The cities collection already contains data.");
        setLoadingCities(false);
        return;
      }

      const batch = writeBatch(db);
      citiesAndRegencies.forEach(city => {
        const docRef = doc(citiesCollection);
        batch.set(docRef, { name: city.name, provinceId: city.provinceId });
      });
      await batch.commit();
      Alert.alert("Success", "All cities and regencies have been added to the database.");
      if(selectedProvince) fetchCities(selectedProvince);
    } catch (error) {
      console.error("Error populating cities: ", error);
      Alert.alert("Error", "Failed to populate cities.");
    } finally {
      setLoadingCities(false);
    }
  };

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  if (loadingProvinces) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Indonesian Cities & Regencies</Text>
      <Picker
        selectedValue={selectedProvince}
        onValueChange={(itemValue) => handleProvinceChange(itemValue)}
      >
        <Picker.Item label="Select a Province" value={null} />
        {provinces.map(province => (
          <Picker.Item key={province.id} label={province.name} value={province.id} />
        ))}
      </Picker>
      {isAdmin && (
        <View style={styles.buttonContainer}>
            <Button title="Populate All Cities" onPress={handlePopulateCities} />
            <Button title="Clear All Cities" onPress={handleClearCities} color="red" />
        </View>
      )}
      {loadingCities ? <ActivityIndicator /> : (
        cities.length > 0 ? (
            <FlatList
                data={cities}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                <View style={styles.itemContainer}>
                    <Text>{item.name}</Text>
                </View>
                )}
            />
        ) : (
            <Text style={styles.infoText}>
                {selectedProvince ? 'No cities found for this province.' : 'Please select a province to view the list of cities.'}
            </Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemContainer: { marginBottom: 10, padding: 15, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  buttonContainer: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-around' },
  infoText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
});
