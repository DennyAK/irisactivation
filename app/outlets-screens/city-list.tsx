import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, writeBatch, doc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import { provinces as provinceData, citiesAndRegencies } from '../../data/indonesian-regions';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';

export default function CityListScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
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
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchProvinces();
    }
  }, [userRole]);

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
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Indonesian Cities & Regencies</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedProvince}
          onValueChange={(itemValue) => handleProvinceChange(itemValue)}
        >
          <Picker.Item label="Select a Province" value={null} />
          {provinces.map(province => (
            <Picker.Item key={province.id} label={province.name} value={province.id} />
          ))}
        </Picker>
      </View>
      {isAdmin && (
        <View style={styles.actionsRow}>
          <SecondaryButton title="Populate Cities" onPress={handlePopulateCities} style={styles.flexBtn} />
          <SecondaryButton title="Clear All" onPress={handleClearCities} style={styles.flexBtn} />
        </View>
      )}
      {loadingCities ? (
        <ActivityIndicator style={{ marginTop: spacing(10) }} />
      ) : cities.length > 0 ? (
        <FlatList
          data={cities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: spacing(30) }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                if (selectedProvince) await fetchCities(selectedProvince);
                setRefreshing(false);
              }}
            />
          }
        />
      ) : (
        <Text style={styles.infoText}>
          {selectedProvince ? 'No cities found for this province.' : 'Please select a province to view the list of cities.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: spacing(4) },
  screenTitle: { ...typography.h1, textAlign: 'center', marginBottom: spacing(4) },
  pickerWrapper: { backgroundColor: palette.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: palette.border, marginBottom: spacing(4) },
  actionsRow: { flexDirection: 'row', gap: spacing(3), marginBottom: spacing(4) },
  flexBtn: { flex: 1 },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(4), marginBottom: spacing(3), borderWidth: 1, borderColor: palette.border, ...shadow.card },
  cardTitle: { fontSize: 15, fontWeight: '600', color: palette.text },
  infoText: { textAlign: 'center', marginTop: spacing(10), fontSize: 15, color: palette.textMuted, paddingHorizontal: spacing(4) },
});
