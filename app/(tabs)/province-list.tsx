import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { TextInput } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, writeBatch, doc, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { provinces as provinceData } from '../../data/indonesian-regions';

export default function ProvinceListScreen() {
  // Add Province modal state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newProvinceName, setNewProvinceName] = useState('');
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const provincesCollection = collection(db, 'provinces');
      const provinceSnapshot = await getDocs(provincesCollection);
      const provinceList = provinceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProvinces(provinceList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error("Error fetching provinces: ", error);
      Alert.alert("Error", "Failed to fetch provinces.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearProvinces = async () => {
    setLoading(true);
    try {
      const provincesCollection = collection(db, 'provinces');
      const provinceSnapshot = await getDocs(provincesCollection);
      const batch = writeBatch(db);
      provinceSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setProvinces([]);
      Alert.alert("Success", "All provinces have been cleared.");
    } catch (error) {
      console.error("Error clearing provinces: ", error);
      Alert.alert("Error", "Failed to clear provinces.");
    } finally {
      setLoading(false);
    }
  };

  const handlePopulateProvinces = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const provincesCollection = collection(db, 'provinces');
      provinceData.forEach(province => {
        const docRef = doc(provincesCollection, province.id);
        batch.set(docRef, { name: province.name });
      });
      await batch.commit();
      Alert.alert("Success", "All provinces have been added to the database.");
      fetchProvinces();
    } catch (error) {
      console.error("Error populating provinces: ", error);
      Alert.alert("Error", "Failed to populate provinces.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Indonesian Provinces</Text>
      {isAdmin && (
        <View style={styles.buttonContainer}>
          {/*
          <Button title="Populate Provinces" onPress={handlePopulateProvinces} />
          <Button title="Clear All" onPress={handleClearAllProvinces} />
          */}
          <Button title="Add Province" onPress={() => setIsAddModalVisible(true)} />
        </View>
      )}
      {/* Add Province Modal */}
      {isAddModalVisible && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Add Province</Text>
            <TextInput
              style={{ borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, height: 40 }}
              value={newProvinceName}
              onChangeText={setNewProvinceName}
              placeholder="Province Name"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Button title="Add" onPress={async () => {
                if (newProvinceName.trim() === '') {
                  Alert.alert('Invalid Name', 'Province name cannot be empty.');
                  return;
                }
                try {
                  const provincesCollection = collection(db, 'provinces');
                  await addDoc(provincesCollection, { name: newProvinceName.trim() });
                  setNewProvinceName('');
                  setIsAddModalVisible(false);
                  fetchProvinces();
                } catch (error) {
                  Alert.alert('Error', 'Failed to add province.');
                }
              }} />
              <Button title="Cancel" onPress={() => { setIsAddModalVisible(false); setNewProvinceName(''); }} />
            </View>
          </View>
        </View>
      )}
      <FlatList
        data={provinces}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text>{item.name}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchProvinces();
              setRefreshing(false);
            }}
          />
        }
      />
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
    marginBottom: 10
  }
});
