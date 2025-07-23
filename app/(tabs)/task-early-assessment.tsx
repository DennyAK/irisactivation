import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function TaskEarlyAssessmentScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const initialFormData = {
    personnelEmail: '', teamLeaderName: '', pgFullName: '',
    reportTimestamp: '', locationProvince: '', locationCity: '',
    outletType: '', outletName: '', outletTier: '',
    kegsAvailable: false, microdraughtAvailable: false,
    activityStoutieRunning: false, activityStoutieResult: '', activityStoutiePhotos: '',
    stockKegs: '', stockMicrodraught: '', stockGdic: '', stockSmoothPintCan330: '',
    stockGfesPintCan330: '', stockGfes620: '', stockGfesCanBig500: '',
    expiryKegs: '', expiryMicrodraught: '', expiryGdic: '', expirySmoothPintCan330: '',
    expiryGfesPintCan330: '', expiryGfes620: '', expiryGfesCanBig500: '',
    dailyQuizCompleted: false, roleplayVideoMade: false, pgAppearanceStandard: '',
    outletVisibilityPhotos: '', posmPhotos: '', merchandiseBrought: false,
    guinnessPromotionsAvailable: false, promotionDescription: '', activityEngagement: '',
    issuesNotes: '',
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
    fetchAssessments();
    return () => unsubscribe();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const collectionRef = collection(db, 'task_early_assessment');
      const snapshot = await getDocs(collectionRef);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssessments(list);
    } catch (error) {
      console.error("Error fetching assessments: ", error);
      Alert.alert("Error", "Failed to fetch assessments.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: 'add' | 'edit', item?: any) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setSelectedAssessment(item);
      const toDateString = (timestamp: any) => timestamp?.toDate().toISOString().split('T')[0] || '';
      setFormData({
        ...initialFormData,
        ...item,
        reportTimestamp: toDateString(item.reportTimestamp),
        expiryKegs: toDateString(item.expiryKegs),
        expiryMicrodraught: toDateString(item.expiryMicrodraught),
        expiryGdic: toDateString(item.expiryGdic),
        expirySmoothPintCan330: toDateString(item.expirySmoothPintCan330),
        expiryGfesPintCan330: toDateString(item.expiryGfesPintCan330),
        expiryGfes620: toDateString(item.expiryGfes620),
        expiryGfesCanBig500: toDateString(item.expiryGfesCanBig500),
      });
    } else {
      setSelectedAssessment(null);
      setFormData(initialFormData);
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = () => {
    const dataToSubmit: any = {};
    for (const key in formData) {
        const value = (formData as any)[key];
        if (key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('date')) {
            dataToSubmit[key] = value ? new Date(value) : null;
        } else {
            dataToSubmit[key] = value;
        }
    }

    if (modalType === 'add') {
      addDoc(collection(db, "task_early_assessment"), { ...dataToSubmit, createdAt: serverTimestamp() })
        .then(() => {
          fetchAssessments();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Add Failed", error.message));
    } else if (selectedAssessment) {
      updateDoc(doc(db, "task_early_assessment", selectedAssessment.id), dataToSubmit)
        .then(() => {
          fetchAssessments();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Update Failed", error.message));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Assessment", "Are you sure?", [
      { text: "Cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "task_early_assessment", id)).then(() => fetchAssessments());
      }}
    ]);
  };

  if (loading) return <ActivityIndicator />;

  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';
  const canUpdate = canManage || userRole === 'Iris - BA' || userRole === 'Iris - TL';

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.outletName}</Text>
      <Text>PG: {item.pgFullName}</Text>
      <Text>Date: {item.reportTimestamp?.toDate().toLocaleDateString()}</Text>
      {/* New fields from Tasks */}
      <Text>Assigned to BA: {item.assignedToBA || '-'}</Text>
      <Text>Assigned to TL: {item.assignedToTL || '-'}</Text>
      <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
      <Text>Created By: {item.createdBy || '-'}</Text>
      <Text>Task ID: {item.tasksId || '-'}</Text>
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
          <Text style={styles.title}>{modalType === 'add' ? 'Add' : 'Edit'} Assessment</Text>
          
          <Text style={styles.sectionTitle}>Personnel Information</Text>
          <TextInput style={styles.input} value={formData.personnelEmail} onChangeText={text => setFormData({...formData, personnelEmail: text})} placeholder="Personnel Email" />
          <TextInput style={styles.input} value={formData.teamLeaderName} onChangeText={text => setFormData({...formData, teamLeaderName: text})} placeholder="Team Leader Name" />
          <TextInput style={styles.input} value={formData.pgFullName} onChangeText={text => setFormData({...formData, pgFullName: text})} placeholder="PG Full Name" />

          <Text style={styles.sectionTitle}>Outlet/Venue Details</Text>
          <TextInput style={styles.input} value={formData.reportTimestamp} onChangeText={text => setFormData({...formData, reportTimestamp: text})} placeholder="Report Date (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.locationProvince} onChangeText={text => setFormData({...formData, locationProvince: text})} placeholder="Province" />
          <TextInput style={styles.input} value={formData.locationCity} onChangeText={text => setFormData({...formData, locationCity: text})} placeholder="City" />
          <TextInput style={styles.input} value={formData.outletType} onChangeText={text => setFormData({...formData, outletType: text})} placeholder="Outlet Type" />
          <TextInput style={styles.input} value={formData.outletName} onChangeText={text => setFormData({...formData, outletName: text})} placeholder="Outlet Name" />
          <TextInput style={styles.input} value={formData.outletTier} onChangeText={text => setFormData({...formData, outletTier: text})} placeholder="TIER OUTLET" />

          <Text style={styles.sectionTitle}>Outlet Facilities</Text>
          <View style={styles.switchContainer}><Text>KEGS Available</Text><Switch value={formData.kegsAvailable} onValueChange={val => setFormData({...formData, kegsAvailable: val})} /></View>
          <View style={styles.switchContainer}><Text>Microdraught Available</Text><Switch value={formData.microdraughtAvailable} onValueChange={val => setFormData({...formData, microdraughtAvailable: val})} /></View>

          <Text style={styles.sectionTitle}>Activity Tracking</Text>
          <View style={styles.switchContainer}><Text>Activity Stoutie Running</Text><Switch value={formData.activityStoutieRunning} onValueChange={val => setFormData({...formData, activityStoutieRunning: val})} /></View>
          <TextInput style={styles.input} value={formData.activityStoutieResult} onChangeText={text => setFormData({...formData, activityStoutieResult: text})} placeholder="Activity Stoutie Result" />
          <TextInput style={styles.input} value={formData.activityStoutiePhotos} onChangeText={text => setFormData({...formData, activityStoutiePhotos: text})} placeholder="Activity Stoutie Photos URL" />

          <Text style={styles.sectionTitle}>Product Stock</Text>
          <TextInput style={styles.input} value={formData.stockKegs} onChangeText={text => setFormData({...formData, stockKegs: text})} placeholder="KEGS Stock" />
          <TextInput style={styles.input} value={formData.stockMicrodraught} onChangeText={text => setFormData({...formData, stockMicrodraught: text})} placeholder="Microdraught Stock" />
          <TextInput style={styles.input} value={formData.stockGdic} onChangeText={text => setFormData({...formData, stockGdic: text})} placeholder="GDIC Stock" />
          <TextInput style={styles.input} value={formData.stockSmoothPintCan330} onChangeText={text => setFormData({...formData, stockSmoothPintCan330: text})} placeholder="Smooth Pint/Can 330ml Stock" />
          <TextInput style={styles.input} value={formData.stockGfesPintCan330} onChangeText={text => setFormData({...formData, stockGfesPintCan330: text})} placeholder="GFES Pint/Can 330ml Stock" />
          <TextInput style={styles.input} value={formData.stockGfes620} onChangeText={text => setFormData({...formData, stockGfes620: text})} placeholder="GFES 620ml Stock" />
          <TextInput style={styles.input} value={formData.stockGfesCanBig500} onChangeText={text => setFormData({...formData, stockGfesCanBig500: text})} placeholder="GFES Can Big 500ml Stock" />

          <Text style={styles.sectionTitle}>Product Expiry Dates</Text>
          <TextInput style={styles.input} value={formData.expiryKegs} onChangeText={text => setFormData({...formData, expiryKegs: text})} placeholder="KEGS Expiry (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.expiryMicrodraught} onChangeText={text => setFormData({...formData, expiryMicrodraught: text})} placeholder="Microdraught Expiry (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.expiryGdic} onChangeText={text => setFormData({...formData, expiryGdic: text})} placeholder="GDIC Expiry (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.expirySmoothPintCan330} onChangeText={text => setFormData({...formData, expirySmoothPintCan330: text})} placeholder="Smooth Pint/Can 330ml Expiry (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.expiryGfesPintCan330} onChangeText={text => setFormData({...formData, expiryGfesPintCan330: text})} placeholder="GFES Pint/Can 330ml Expiry (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.expiryGfes620} onChangeText={text => setFormData({...formData, expiryGfes620: text})} placeholder="GFES 620ml Expiry (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.expiryGfesCanBig500} onChangeText={text => setFormData({...formData, expiryGfesCanBig500: text})} placeholder="GFES Can Big 500ml Expiry (YYYY-MM-DD)" />

          <Text style={styles.sectionTitle}>Compliance & Performance</Text>
          <View style={styles.switchContainer}><Text>Daily Quiz Completed</Text><Switch value={formData.dailyQuizCompleted} onValueChange={val => setFormData({...formData, dailyQuizCompleted: val})} /></View>
          <View style={styles.switchContainer}><Text>Roleplay Video Made</Text><Switch value={formData.roleplayVideoMade} onValueChange={val => setFormData({...formData, roleplayVideoMade: val})} /></View>
          <TextInput style={styles.input} value={formData.pgAppearanceStandard} onChangeText={text => setFormData({...formData, pgAppearanceStandard: text})} placeholder="PG Appearance Standard" />

          <Text style={styles.sectionTitle}>Visual Merchandising</Text>
          <TextInput style={styles.input} value={formData.outletVisibilityPhotos} onChangeText={text => setFormData({...formData, outletVisibilityPhotos: text})} placeholder="Outlet Visibility Photos URL" />
          <TextInput style={styles.input} value={formData.posmPhotos} onChangeText={text => setFormData({...formData, posmPhotos: text})} placeholder="POSM Photos URL" />
          <View style={styles.switchContainer}><Text>Merchandise Brought</Text><Switch value={formData.merchandiseBrought} onValueChange={val => setFormData({...formData, merchandiseBrought: val})} /></View>

          <Text style={styles.sectionTitle}>Promotions & Engagement</Text>
          <View style={styles.switchContainer}><Text>Guinness Promotions Available</Text><Switch value={formData.guinnessPromotionsAvailable} onValueChange={val => setFormData({...formData, guinnessPromotionsAvailable: val})} /></View>
          <TextInput style={styles.input} value={formData.promotionDescription} onChangeText={text => setFormData({...formData, promotionDescription: text})} placeholder="Promotion Description" />
          <TextInput style={styles.input} value={formData.activityEngagement} onChangeText={text => setFormData({...formData, activityEngagement: text})} placeholder="Activity Engagement" />

          <Text style={styles.sectionTitle}>Issues/Notes</Text>
          <TextInput style={styles.input} value={formData.issuesNotes} onChangeText={text => setFormData({...formData, issuesNotes: text})} placeholder="Issues, Notes, etc." />

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
      <Text style={styles.title}>Task Early Assessment</Text>
      {canUpdate && <Button title="Add New Assessment" onPress={() => handleOpenModal('add')} />}
      <FlatList
        data={assessments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchAssessments();
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
