import { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { compareCreatedAt } from '../../utils/sort';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import StatusPill from '../../components/ui/StatusPill';
import FilterHeader from '../../components/ui/FilterHeader';

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
  // Filters & Sort
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(''); // no status in outlets, kept for API compatibility
  const [sortAsc, setSortAsc] = useState(false); // default newest first

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

  const filteredOutlets = useMemo(() => {
    const term = search.trim().toLowerCase();
    const bySearch = term
      ? outlets.filter((o) => {
          const hay = [
            o.outletName,
            o.provinceName,
            o.cityName,
            o.outletChannel,
            o.outletTier,
            o.outletCompleteAddress,
            o.outletContactNo,
            o.outletPicName,
            o.outletPicContactNumber,
            o.outletSocialMedia,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(term);
        })
      : outlets;
  const sorted = [...bySearch].sort((a, b) => compareCreatedAt(a, b, sortAsc));
    return sorted;
  }, [outlets, search, sortAsc]);

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
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator />
      </View>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const canCreateOrEdit = isAdmin || userRole === 'area manager';
  const canDeleteOutlet = userRole === 'superadmin';

  const channelTone = (val: string): any => {
    if (!val) return 'neutral';
    if (val.includes('EVENT')) return 'info';
    if (val.includes('WEEKLY') || val.includes('MONTHLY')) return 'primary';
    return 'success';
  };

  const renderOutlet = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.outletName}</Text>
      </View>
      <View style={styles.metaRow}>
        {!!item.outletChannel && <StatusPill label={item.outletChannel} tone={channelTone(item.outletChannel)} style={styles.pill} />}
        {!!item.outletTier && <StatusPill label={item.outletTier} tone="warning" style={styles.pill} />}
      </View>
      <Text style={styles.metaText}>Province: <Text style={styles.metaStrong}>{item.provinceName || '-'}</Text></Text>
      <Text style={styles.metaText}>Address: <Text style={styles.metaStrong}>{item.outletCompleteAddress || '-'}, {item.cityName || '-'}, {item.provinceName || '-'}</Text></Text>
      <Text style={styles.metaText}>Contact: <Text style={styles.metaStrong}>{item.outletContactNo || '-'}</Text></Text>
      <Text style={styles.metaText}>PIC: <Text style={styles.metaStrong}>{item.outletPicName || '-'} ({item.outletPicContactNumber || '-'})</Text></Text>
      {!!item.outletSocialMedia && <Text style={styles.metaText}>Social: <Text style={styles.metaStrong}>{item.outletSocialMedia}</Text></Text>}
      <Text style={styles.coords}>Coords: {item.latitude}, {item.longitude}</Text>
      <View style={styles.actionsRow}>
        <SecondaryButton
          title="History"
          onPress={() => {
            const url = `/outlets-screens/outlet-history?outletId=${encodeURIComponent(item.id)}&outletName=${encodeURIComponent(item.outletName || '')}`;
            router.push(url as any);
          }}
        />
        {isAdmin && (
          <SecondaryButton
            title="View Audit"
            onPress={() => router.push({ pathname: '/audit-screens/audit-logs' as any, params: { collection: 'outlets', docId: item.id } })}
          />
        )}
        {canCreateOrEdit && (
          <SecondaryButton title="Edit" onPress={() => handleEditOutlet(item)} />
        )}
  {canDeleteOutlet && (
          <SecondaryButton title="Delete" onPress={() => handleDeleteOutlet(item.id)} style={styles.dangerBtn} />
        )}
      </View>
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

  <SecondaryButton title="Get Current Location" onPress={getLocation} />
      <TextInput style={styles.input} value={formData.latitude} onChangeText={(text) => setFormData({...formData, latitude: text})} placeholder="Latitude" />
      <TextInput style={styles.input} value={formData.longitude} onChangeText={(text) => setFormData({...formData, longitude: text})} placeholder="Longitude" />
    </>
  );

  return (
    <View style={styles.container}>
      <FilterHeader
        title="Outlets"
        search={search}
        status={status}
        statusOptions={[]}
        storageKey="filters:outlets"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc((s) => !s)}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => { setSearch(''); setStatus(''); }}
      />
      {canCreateOrEdit && (
        <PrimaryButton title="Add New Outlet" onPress={() => setIsAddModalVisible(true)} style={styles.addBtn} />
      )}
      <FlatList
        data={filteredOutlets}
        keyExtractor={(item) => item.id}
        renderItem={renderOutlet}
        contentContainerStyle={{ paddingBottom: spacing(30) }}
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
      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add New Outlet</Text>
            {renderModalFields()}
            <View style={styles.modalActions}>
              <PrimaryButton title="Add" onPress={handleAddOutlet} style={styles.flexBtn} />
              <SecondaryButton title="Cancel" onPress={() => setIsAddModalVisible(false)} style={styles.flexBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Outlet</Text>
            {renderModalFields()}
            <View style={styles.modalActions}>
              <PrimaryButton title="Update" onPress={handleUpdateOutlet} style={styles.flexBtn} />
              <SecondaryButton title="Cancel" onPress={() => { setIsEditModalVisible(false); resetFormData(); }} style={styles.flexBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: spacing(4) },
  screenTitle: { ...typography.h1, marginBottom: spacing(4), textAlign: 'center' },
  addBtn: { marginBottom: spacing(4) },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flexShrink: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing(2), gap: spacing(2) },
  pill: { marginRight: spacing(2), marginBottom: spacing(1) },
  metaText: { fontSize: 13, color: palette.textMuted, marginBottom: spacing(1.2) },
  metaStrong: { color: palette.text },
  coords: { fontSize: 12, color: palette.textMuted, marginTop: spacing(1) },
  actionsRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(3) },
  dangerBtn: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  // Modal styles
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing(6), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { width: '100%', backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing(5), maxHeight: '90%' },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing(4), color: palette.text },
  modalActions: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(4) },
  flexBtn: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    marginBottom: spacing(3),
    backgroundColor: palette.surfaceAlt,
    fontSize: 14,
  },
});
