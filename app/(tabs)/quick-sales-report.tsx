import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function QuickSalesReportScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const initialFormData = {
    guardDate: '', city: '', teamLeaderName: '', outletName: '', outletTier: '',
    salesKegs330: '', salesKegs500: '', salesMd500: '', salesGdic400: '',
    salesSmoothPintCan330: '', salesGfesPintCan330: '', salesGfesQuart620: '',
    salesGfesCanbig500: '', productRestock: false,
  };

  const [formData, setFormData] = useState(initialFormData);

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
    fetchReports();
    return () => unsubscribe();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const collectionRef = collection(db, 'sales_report_quick');
      const snapshot = await getDocs(collectionRef);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(list);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      Alert.alert("Error", "Failed to fetch sales reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: 'add' | 'edit', item?: any) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setSelectedReport(item);
      setFormData({
        ...initialFormData,
        ...item,
        guardDate: item.guardDate?.toDate().toISOString().split('T')[0] || '',
      });
    } else {
      setSelectedReport(null);
      setFormData(initialFormData);
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = () => {
    const dataToSubmit: any = {
        ...formData,
        guardDate: formData.guardDate ? new Date(formData.guardDate) : null,
        entryTimestamp: serverTimestamp(),
    };

    if (modalType === 'add') {
      addDoc(collection(db, "sales_report_quick"), dataToSubmit)
        .then(() => {
          fetchReports();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Add Failed", error.message));
    } else if (selectedReport) {
      updateDoc(doc(db, "sales_report_quick", selectedReport.id), dataToSubmit)
        .then(() => {
          fetchReports();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Update Failed", error.message));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Report", "Are you sure?", [
      { text: "Cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "sales_report_quick", id)).then(() => fetchReports());
      }}
    ]);
  };

  if (loading) return <ActivityIndicator />;

  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';
  const canUpdate = canManage || userRole === 'Iris - BA' || userRole === 'Iris - TL';

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.outletName} - {item.guardDate?.toDate().toLocaleDateString()}</Text>
      <Text>Leader: {item.teamLeaderName}</Text>
      <Text>City: {item.city}</Text>
      {canUpdate && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleOpenModal('edit', item)} />
          {canManage && <Button title="Delete" onPress={() => handleDelete(item.id)} />}
        </View>
      )}
    </View>
  );

  const renderModal = () => (
    <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{modalType === 'add' ? 'Add' : 'Edit'} Sales Report</Text>
          
          <Text style={styles.sectionTitle}>Date and Location</Text>
          <TextInput style={styles.input} value={formData.guardDate} onChangeText={text => setFormData({...formData, guardDate: text})} placeholder="Guard Date (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.city} onChangeText={text => setFormData({...formData, city: text})} placeholder="City" />

          <Text style={styles.sectionTitle}>Team and Outlet Information</Text>
          <TextInput style={styles.input} value={formData.teamLeaderName} onChangeText={text => setFormData({...formData, teamLeaderName: text})} placeholder="Team Leader Name" />
          <TextInput style={styles.input} value={formData.outletName} onChangeText={text => setFormData({...formData, outletName: text})} placeholder="Outlet Name" />
          <TextInput style={styles.input} value={formData.outletTier} onChangeText={text => setFormData({...formData, outletTier: text})} placeholder="Outlet Tier" />

          <Text style={styles.sectionTitle}>Selling Data</Text>
          <TextInput style={styles.input} value={formData.salesKegs330} onChangeText={text => setFormData({...formData, salesKegs330: text})} placeholder="KEGS (330ml) glass" />
          <TextInput style={styles.input} value={formData.salesKegs500} onChangeText={text => setFormData({...formData, salesKegs500: text})} placeholder="KEGS (500ml) glass" />
          <TextInput style={styles.input} value={formData.salesMd500} onChangeText={text => setFormData({...formData, salesMd500: text})} placeholder="MD (500ml) can" />
          <TextInput style={styles.input} value={formData.salesGdic400} onChangeText={text => setFormData({...formData, salesGdic400: text})} placeholder="GDIC (400ml) can" />
          <TextInput style={styles.input} value={formData.salesSmoothPintCan330} onChangeText={text => setFormData({...formData, salesSmoothPintCan330: text})} placeholder="SMOOTH PINT&CAN 330ml" />
          <TextInput style={styles.input} value={formData.salesGfesPintCan330} onChangeText={text => setFormData({...formData, salesGfesPintCan330: text})} placeholder="GFES PINT&CAN 330ml" />
          <TextInput style={styles.input} value={formData.salesGfesQuart620} onChangeText={text => setFormData({...formData, salesGfesQuart620: text})} placeholder="GFES QUART 620ml" />
          <TextInput style={styles.input} value={formData.salesGfesCanbig500} onChangeText={text => setFormData({...formData, salesGfesCanbig500: text})} placeholder="GFES CANBIG 500ml" />

          <Text style={styles.sectionTitle}>Restock Information</Text>
          <View style={styles.switchContainer}><Text>Product Restock?</Text><Switch value={formData.productRestock} onValueChange={val => setFormData({...formData, productRestock: val})} /></View>

          <View style={styles.buttonContainer}>
            <Button title={modalType === 'add' ? 'Add' : 'Update'} onPress={handleFormSubmit} />
            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Sales Report</Text>
      {canUpdate && <Button title="Add New Report" onPress={() => handleOpenModal('add')} />}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchReports();
              setRefreshing(false);
            }}
          />
        }
      />
      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 10 },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 8 },
});
