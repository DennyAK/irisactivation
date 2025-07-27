import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
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
    guardDate: '',
    city: '',
    teamLeaderName: '',
    outletName: '',
    outletTier: '',
    assignedToBA: '',
    assignedToTL: '',
    outletId: '',
    outletProvince: '',
    outletCity: '',
    salesKegs330: '',
    salesKegs500: '',
    salesMd500: '',
    salesGdic400: '',
    salesSmoothPint330: '',
    salesSmoothCan330: '',
    salesGfesPint330: '',
    salesGfesCan330: '',
    salesGfesQuart620: '',
    salesGfesCanbig500: '',
    productRestock: false,
    productRestockDescription: '',
    taskSalesReportQuickStatus: '',

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
    return () => unsubscribe();
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (userRole && isFocused) {
      fetchReports();
    }
  }, [userRole, isFocused]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch all reports
      const collectionRef = collection(db, 'sales_report_quick');
      const snapshot = await getDocs(collectionRef);
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        assignedToBA: doc.data().assignedToBA,
        assignedToTL: doc.data().assignedToTL,
        outletId: doc.data().outletId || '',
        outletName: doc.data().outletName || '',
        ...doc.data()
      }));
      // Filter for BA role: only show records assigned to current user
      if (userRole === 'Iris - BA' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
      if (userRole === 'Iris - TL' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }

      // Fetch all outlets and build a map
      const outletsSnapshot = await getDocs(collection(db, 'outlets'));
      const outletMap: Record<string, any> = {};
      outletsSnapshot.forEach(doc => {
        outletMap[doc.id] = doc.data();
      });

      // Merge outlet info into each report
      list = list.map(report => {
        const outlet = outletMap[report.outletId] || {};
        return {
          ...report,
          outletName: outlet.outletName || report.outletName || '-',
          outletProvince: outlet.outletProvince || outlet.province || '-',
          outletCity: outlet.outletCity || outlet.city || '-',
          outletTier: outlet.outletTier || outlet.tier || '-',
        };
      });

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

      <Text>Outlet ID: {item.outletId || '-'}</Text>
      <Text style={styles.itemTitle}>{item.outletName} - {item.guardDate?.toDate ? item.guardDate.toDate().toLocaleDateString() : '-'}</Text>
      <Text>Province: {item.outletProvince || '-'}</Text>
      <Text>City: {item.outletCity || '-'}</Text>

      <Text>Outlet Tier: {item.outletTier || '-'}</Text>
      <Text>Assigned to BA: {item.assignedToBA || '-'}</Text>
      <Text>Assigned to TL: {item.assignedToTL || '-'}</Text>
      <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
      <Text>Created By: {item.createdBy || '-'}</Text>
      <Text>Task ID: {item.tasksId || '-'}</Text>
      <Text>Task Sales Report Quick Status: {item.taskSalesReportQuickStatus || '-'}</Text>

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
          
          <Text style={styles.sectionTitle}>Personnel Information</Text>
          <Text>Assigned to BA: {formData.assignedToBA || '-'}</Text>
          <Text>Assigned to TL: {formData.assignedToTL || '-'}</Text>
          <Text style={styles.sectionTitle}>Outlet / Venue Details</Text>

          <Text>Outlet ID: {formData.outletId || '-'}</Text>
          <Text style={styles.itemTitle}>{formData.outletName} - {formData.guardDate ? formData.guardDate : '-'}</Text>
          <Text>Province: {formData.outletProvince || '-'}</Text>
          <Text>City: {formData.outletCity || '-'}</Text>
          <Text>Outlet Tier: {formData.outletTier || '-'}</Text>
          
          <Text style={styles.sectionTitle}>Guinness Selling Data</Text>
          <TextInput style={styles.input} value={formData.salesKegs330} onChangeText={text => setFormData({...formData, salesKegs330: text})} placeholder="KEGS (330ml) glass" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesKegs500} onChangeText={text => setFormData({...formData, salesKegs500: text})} placeholder="KEGS (500ml) glass" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesMd500} onChangeText={text => setFormData({...formData, salesMd500: text})} placeholder="MD (500ml) can" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesGdic400} onChangeText={text => setFormData({...formData, salesGdic400: text})} placeholder="GDIC (400ml) can" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesSmoothPint330} onChangeText={text => setFormData({...formData, salesSmoothPint330: text})} placeholder="SMOOTH PINT 330ml" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesSmoothCan330} onChangeText={text => setFormData({...formData, salesSmoothCan330: text})} placeholder="SMOOTH CAN 330ml" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesGfesPint330} onChangeText={text => setFormData({...formData, salesGfesPint330: text})} placeholder="GFES PINT 330ml" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesGfesCan330} onChangeText={text => setFormData({...formData, salesGfesCan330: text})} placeholder="GFES CAN 330ml" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesGfesQuart620} onChangeText={text => setFormData({...formData, salesGfesQuart620: text})} placeholder="GFES QUART 620ml" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.salesGfesCanbig500} onChangeText={text => setFormData({...formData, salesGfesCanbig500: text})} placeholder="GFES CANBIG 500ml" keyboardType="numeric" />

          <Text style={styles.sectionTitle}>Restock Information</Text>
          <View style={styles.switchContainer}><Text>Product Restock?</Text><Switch value={formData.productRestock} onValueChange={val => setFormData({...formData, productRestock: val})} /></View>
          {formData.productRestock && (
            <TextInput
              style={styles.input}
              value={formData.productRestockDescription}
              onChangeText={text => setFormData({...formData, productRestockDescription: text})}
              placeholder="Restock Description"
            />
          )}
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
      {/* Removed Add New Report button as requested */}
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
