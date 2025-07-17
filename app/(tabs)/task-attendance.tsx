import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function TaskAttendanceScreen() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    outletId: '',
    checkIn: '', // Will be handled as a string for input
    checkOut: '', // Will be handled as a string for input
    latitude: '',
    longitude: '',
    selfieUrl: '',
  });
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
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
    fetchAttendances();
    return () => unsubscribe();
  }, []);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const attendancesCollection = collection(db, 'task_attendance');
      const attendanceSnapshot = await getDocs(attendancesCollection);
      const attendanceList = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      userId: '', outletId: '', checkIn: '', checkOut: '',
      latitude: '', longitude: '', selfieUrl: '',
    });
  };

  const handleAddAttendance = () => {
    addDoc(collection(db, "task_attendance"), {
      ...formData,
      checkIn: formData.checkIn ? new Date(formData.checkIn) : null,
      checkOut: formData.checkOut ? new Date(formData.checkOut) : null,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
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
      outletId: attendance.outletId || '',
      checkIn: attendance.checkIn?.toDate().toISOString().split('T')[0] || '',
      checkOut: attendance.checkOut?.toDate().toISOString().split('T')[0] || '',
      latitude: attendance.latitude?.toString() || '',
      longitude: attendance.longitude?.toString() || '',
      selfieUrl: attendance.selfieUrl || '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateAttendance = () => {
    if (selectedAttendance) {
      const attendanceDoc = doc(db, "task_attendance", selectedAttendance.id);
      updateDoc(attendanceDoc, {
        ...formData,
        checkIn: formData.checkIn ? new Date(formData.checkIn) : null,
        checkOut: formData.checkOut ? new Date(formData.checkOut) : null,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0,
      }).then(() => {
        setIsEditModalVisible(false);
        resetFormData();
        setSelectedAttendance(null);
        fetchAttendances();
      }).catch(error => {
        Alert.alert("Update Failed", error.message);
      });
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

  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';
  const canUpdate = canManage || userRole === 'Iris - BA' || userRole === 'Iris - TL';

  const renderAttendance = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>User: {item.userId}</Text>
      <Text>Outlet: {item.outletId}</Text>
      <Text>Check-in: {item.checkIn?.toDate().toLocaleString()}</Text>
      <Text>Check-out: {item.checkOut?.toDate().toLocaleString()}</Text>
      <Text>Selfie URL: {item.selfieUrl}</Text>
      {canUpdate && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditAttendance(item)} />
          {canManage && <Button title="Delete" onPress={() => handleDeleteAttendance(item.id)} />}
        </View>
      )}
    </View>
  );

  const renderModalFields = () => (
    <>
      <TextInput style={styles.input} value={formData.userId} onChangeText={(text) => setFormData({...formData, userId: text})} placeholder="User ID" />
      <TextInput style={styles.input} value={formData.outletId} onChangeText={(text) => setFormData({...formData, outletId: text})} placeholder="Outlet ID" />
      <TextInput style={styles.input} value={formData.checkIn} onChangeText={(text) => setFormData({...formData, checkIn: text})} placeholder="Check-in (YYYY-MM-DD HH:MM)" />
      <TextInput style={styles.input} value={formData.checkOut} onChangeText={(text) => setFormData({...formData, checkOut: text})} placeholder="Check-out (YYYY-MM-DD HH:MM)" />
      <TextInput style={styles.input} value={formData.latitude} onChangeText={(text) => setFormData({...formData, latitude: text})} placeholder="Latitude" keyboardType="numeric" />
      <TextInput style={styles.input} value={formData.longitude} onChangeText={(text) => setFormData({...formData, longitude: text})} placeholder="Longitude" keyboardType="numeric" />
      <TextInput style={styles.input} value={formData.selfieUrl} onChangeText={(text) => setFormData({...formData, selfieUrl: text})} placeholder="Selfie URL" />
    </>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Attendance</Text>
      {canUpdate && <Button title="Add New Record" onPress={() => setIsAddModalVisible(true)} />}
      <FlatList data={attendances} keyExtractor={(item) => item.id} renderItem={renderAttendance} />
      
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
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }
});
