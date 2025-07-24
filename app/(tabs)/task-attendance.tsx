// === SAVE POINT: 2024-06-13 ===
// You can undo to this version if any crash happens today.

import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Image, Platform, RefreshControl } from 'react-native';
import { db, auth, storage } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function TaskAttendanceScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  type AttendanceItem = {
    id: string;
    assignedToBA?: string;
    createdAt?: any;
    // add other relevant fields as needed
    [key: string]: any;
  };
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    assignedToBA: '',
    outletId: '',
    checkIn: null as Date | null,
    checkOut: null as Date | null,
    checkInLatitude: '',
    checkInLongitude: '',
    checkOutLatitude: '',
    checkOutLongitude: '',
    selfieUrl: '',
  });
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      }
    })();
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
    // fetchAttendances();
    return () => unsubscribe();
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (userRole && isFocused) {
      fetchAttendances();
    }
  }, [userRole, isFocused]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const attendancesCollection = collection(db, 'task_attendance');
      const attendanceSnapshot = await getDocs(attendancesCollection);
      let attendanceList = attendanceSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, assignedToBA: data.assignedToBA, createdAt: data.createdAt, ...data } as AttendanceItem;
      });
      // Filter for BA role: only show records assigned to current user
      if (userRole === 'Iris - BA' && auth.currentUser?.uid) {
        attendanceList = attendanceList.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
      if (userRole === 'Iris - TL' && auth.currentUser?.uid) {
        attendanceList = attendanceList.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }
      // Sort by createdAt descending (newest first)
      attendanceList.sort((a, b) => {
        let aTime = 0;
        let bTime = 0;
        if (a.createdAt && typeof a.createdAt.toDate === 'function') {
          aTime = a.createdAt.toDate().getTime();
        }
        if (b.createdAt && typeof b.createdAt.toDate === 'function') {
          bTime = b.createdAt.toDate().getTime();
        }
        return bTime - aTime;
      });
      setAttendances(attendanceList);
    } catch (error) {
      console.error("Error fetching attendances: ", error);
      Alert.alert("Error", "Failed to fetch attendances.");
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      userId: '', assignedToBA: '', outletId: '', checkIn: null, checkOut: null,
      checkInLatitude: '', checkInLongitude: '', checkOutLatitude: '', checkOutLongitude: '', selfieUrl: '',
    });
  };

  const handleAddAttendance = () => {
    addDoc(collection(db, "task_attendance"), {
      ...formData,
      checkInLatitude: parseFloat(formData.checkInLatitude) || 0,
      checkInLongitude: parseFloat(formData.checkInLongitude) || 0,
      checkOutLatitude: parseFloat(formData.checkOutLatitude) || 0,
      checkOutLongitude: parseFloat(formData.checkOutLongitude) || 0,
      createdAt: serverTimestamp()
    }).then(() => {
      setIsAddModalVisible(false);
      resetFormData();
      fetchAttendances();
    }).catch(error => {
      Alert.alert("Add Failed", error.message);
    });
  };

  const handleEditAttendance = (attendance: any) => {
    setSelectedAttendance(attendance);
    setFormData({
      userId: attendance.userId || '',
      assignedToBA: attendance.assignedToBA || '',
      outletId: attendance.outletId || '',
      checkIn: attendance.checkIn?.toDate() || null,
      checkOut: attendance.checkOut?.toDate() || null,
      checkInLatitude: attendance.checkInLatitude?.toString() || '',
      checkInLongitude: attendance.checkInLongitude?.toString() || '',
      checkOutLatitude: attendance.checkOutLatitude?.toString() || '',
      checkOutLongitude: attendance.checkOutLongitude?.toString() || '',
      selfieUrl: attendance.selfieUrl || '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateAttendance = async () => {
    if (!selectedAttendance) return;
    try {
      // The formData.selfieUrl should now hold the final Firebase URL if a new image was uploaded
      const dataToUpdate = {
        ...formData,
        checkInLatitude: parseFloat(formData.checkInLatitude) || 0,
        checkInLongitude: parseFloat(formData.checkInLongitude) || 0,
        checkOutLatitude: parseFloat(formData.checkOutLatitude) || 0,
        checkOutLongitude: parseFloat(formData.checkOutLongitude) || 0,
      };

      const attendanceDoc = doc(db, "task_attendance", selectedAttendance.id);
      await updateDoc(attendanceDoc, dataToUpdate);

      Alert.alert("Success", "Attendance record updated successfully.");
      setIsEditModalVisible(false);
      fetchAttendances(); // Refresh the list
    } catch (error: any) {
      Alert.alert("Update Failed", error.message);
    }
  };
  
  const confirmCheckIn = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    
    Alert.alert("Confirm Check-In", "Are you sure you want to check in now?", [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => setFormData({
            ...formData, 
            checkIn: new Date(),
            checkInLatitude: location.coords.latitude.toString(),
            checkInLongitude: location.coords.longitude.toString(),
        }) }
    ]);
  };

  const confirmCheckOut = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    Alert.alert("Confirm Check-Out", "Are you sure you want to check out now?", [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => setFormData({
            ...formData, 
            checkOut: new Date(),
            checkOutLatitude: location.coords.latitude.toString(),
            checkOutLongitude: location.coords.longitude.toString(),
        }) }
    ]);
  };

  // Existing gallery upload
  const pickAndUploadImage = async () => {

    try {
      // 1. Pick Image
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        Alert.alert('Cancelled', 'Image selection was cancelled.');
        return;
      }

      const uri = result.assets[0].uri;
      Alert.alert('Step 1: Image Picked', `URI: ${uri}`);
      // Do NOT set selfieUrl to cache URI here

      // 2. Upload to Firebase
      if (!auth.currentUser) {
        Alert.alert("Authentication Error", "You must be logged in to upload images.");
        return;
      }
      Alert.alert('Step 2: Starting Upload', 'Preparing to upload to Firebase Storage...');
      const response = await fetch(uri);
      const blob = await response.blob();
      Alert.alert('Step 3: Blob Created', 'Image has been prepared for upload.');

      const storageRef = ref(storage, `task_attendance/${auth.currentUser.uid}/${new Date().getTime()}.jpg`);
      const snapshot = await uploadBytes(storageRef, blob);
      Alert.alert('Step 4: Upload Complete', `File uploaded successfully to: ${snapshot.ref.fullPath}`);

      const downloadURL = await getDownloadURL(snapshot.ref);
      Alert.alert('Step 5: URL Retrieved', `File available at: ${downloadURL}`);

      // 3. Update form state with the final URL
      setFormData(prev => ({ ...prev, selfieUrl: downloadURL }));

      // 4. If editing, update Firestore immediately
      if (selectedAttendance) {
        const attendanceDoc = doc(db, "task_attendance", selectedAttendance.id);
        await updateDoc(attendanceDoc, { selfieUrl: downloadURL });
        fetchAttendances();
        Alert.alert("Success", "Selfie uploaded and saved.");
      }
    } catch (error: any) {
      console.error("CRITICAL ERROR during image pick and upload: ", error);
      Alert.alert("Upload Failed", `An error occurred: ${error.message}. Check the console for more details.`);
    }
  };

  const handleDeleteAttendance = (attendanceId: string) => {
    Alert.alert("Delete Attendance", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "task_attendance", attendanceId)).then(() => {
          fetchAttendances();
        });
      }}
    ]);
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  // Only these roles can CRUD
  const canManage = [
    'admin', 'superadmin', 'area manager'
  ].includes(userRole || '');
  // These roles can Read and Update
  const canReadUpdate = canManage || ['Iris - BA', 'Iris - TL'].includes(userRole || '');

  const renderAttendance = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>Assigned to BA:</Text>
      <Text style={styles.longText}>{item.assignedToBA || '-'}</Text>
      <Text>Outlet: {item.outletId}</Text>
      <Text>Check-in: {item.checkIn?.toDate().toLocaleString()}</Text>
      <Text>Check-out: {item.checkOut?.toDate().toLocaleString()}</Text>
      <Text>Assigned to TL: {item.assignedToTL || '-'}</Text>
      <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
      <Text>Created By: {item.createdBy || '-'}</Text>
      <Text>Task ID: {item.tasksId || '-'}</Text>
      {item.selfieUrl && item.selfieUrl !== '' ? <Image source={{ uri: item.selfieUrl }} style={styles.thumbnail} /> : <Text>No Selfie</Text>}
      {canReadUpdate && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditAttendance(item)} />
          {canManage && <Button title="Delete" onPress={() => handleDeleteAttendance(item.id)} />}
        </View>
      )}
    </View>
  );

  const renderModalFields = () => (
    <>
      {/* Assigned to BA (id) - non-editable */}
      <Text style={styles.input}>Assigned to BA:</Text>
      <TextInput
        style={[styles.input, styles.multiLineInput]}
        value={formData.assignedToBA || '-'}
        editable={false}
        multiline={true}
      />
      <Text style={styles.input}>Outlet ID:</Text>
      <TextInput
        style={[styles.input, styles.multiLineInput]}
        value={formData.outletId}
        placeholder="Outlet ID"
        multiline={true}
        editable={false}
      />
      <View style={styles.checkInOutContainer}>
        <Button title="Check In Now" onPress={confirmCheckIn} disabled={!!formData.checkIn} />
        {formData.checkIn && <Text>{formData.checkIn.toLocaleString()}</Text>}
      </View>
      {formData.checkInLatitude && <Text>Check-in Location: {formData.checkInLatitude}, {formData.checkInLongitude}</Text>}
      <View style={styles.checkInOutContainer}>
        <Button title="Check Out Now" onPress={confirmCheckOut} disabled={!formData.checkIn || !!formData.checkOut} />
        {formData.checkOut && <Text>{formData.checkOut.toLocaleString()}</Text>}
      </View>
      {formData.checkOutLatitude && <Text>Check-out Location: {formData.checkOutLatitude}, {formData.checkOutLongitude}</Text>}
      <Button title="Upload Selfie" onPress={pickAndUploadImage} />
      {formData.selfieUrl ? <Image source={{ uri: formData.selfieUrl }} style={styles.selfieImage} /> : null}
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Attendance</Text>
      <FlatList
        data={attendances}
        keyExtractor={(item) => item.id}
        renderItem={renderAttendance}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchAttendances();
              setRefreshing(false);
            }}
          />
        }
      />
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add Attendance</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Add" onPress={handleAddAttendance} />
              <Button title="Cancel" onPress={() => { setIsAddModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Attendance</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdateAttendance} />
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
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  longText: { fontSize: 15, marginBottom: 8, color: '#333', flexWrap: 'wrap' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  multiLineInput: { minHeight: 40, maxHeight: 80, textAlignVertical: 'top' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  checkInOutContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 },
  selfieImage: { width: 100, height: 100, alignSelf: 'center', marginVertical: 10, borderRadius: 5 },
  thumbnail: { width: 50, height: 50, borderRadius: 5, marginTop: 10 }
});
