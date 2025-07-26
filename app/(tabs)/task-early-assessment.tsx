import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity, Platform } from 'react-native';

export default function TaskEarlyAssessmentScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  type AssessmentItem = {
    id: string;
    assignedToBA?: string;
    posmAvailable?: boolean;
    // add other relevant fields as needed
    [key: string]: any;
  };
  const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'reviewAM'>('add');
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showExpiryKegsPicker, setShowExpiryKegsPicker] = useState(false);
  const [showExpiryGdicPicker, setShowExpiryGdicPicker] = useState(false);
  const [showExpirySmoothPicker, setShowExpirySmoothPicker] = useState(false);
  const [showExpirySmoothPintPicker, setShowExpirySmoothPintPicker] = useState(false);
  const [showExpirySmoothCanPicker, setShowExpirySmoothCanPicker] = useState(false);
  const [showExpiryGfesPintPicker, setShowExpiryGfesPintPicker] = useState(false);
  const [showExpiryGfesCanPicker, setShowExpiryGfesCanPicker] = useState(false);
  const [showExpiryGfes620Picker, setShowExpiryGfes620Picker] = useState(false);
  const [showExpiryGfesCanBig500Picker, setShowExpiryGfesCanBig500Picker] = useState(false);
  const [showExpiryMicrodraughtPicker, setShowExpiryMicrodraughtPicker] = useState(false);

  // Fetch user role on mount and on auth state change
  useEffect(() => {
    const fetchUserRole = async (uid: string) => {
      try {
        // Example: assuming user roles are stored in a 'users' collection with a 'role' field
        const userDoc = await getDoc(doc(collection(db, 'users'), uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || null);
          console.log('User role:', userDoc.data().role);
        } else {
          setUserRole(null);
          console.log('User doc not found');
        }
      } catch (e) {
        setUserRole(null);
        console.log('Error fetching user role', e);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserRole(user.uid);
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  interface FormDataType {
    digitalActivityEngagementPhoto?: string;
    digitalActivityEngagementDescription?: string;
    guinnessPromotionDisplayedDescriptionPhoto?: string;
    digitalActivityEngagementSwitch?: boolean;
    guinnessPromotionDisplayedDescription?: string;
    guinnessPromotionDisplayed?: boolean;
    activityStoutieRemarks?: string;
    assignedToBA: string;
    assignedToTL: string;
    outletId: string;
    gdicAvailable: boolean;
    smoothAvailable: boolean;
    gfesAvailable: boolean;
    personnelEmail: string;
    teamLeaderName: string;
    pgFullName: string;
    reportTimestamp: string;
    locationProvince: string;
    locationCity: string;
    outletType: string;
    outletName: string;
    outletTier: string;
    kegsAvailable: boolean;
    microdraughtAvailable: boolean;
    activityStoutieRunning: boolean;
    activityStoutieResult: string;
    activityStoutiePhotos: string;
    stockKegs: string;
    stockMicrodraught: string;
    stockGdic: string;
    stockSmoothPint330: string;
    stockSmoothCan330: string;
    stockGfesPint330: string;
    stockGfesCan330: string;
    stockGfes620: string;
    stockGfesCanBig500: string;
    expiryKegs: string;
    expiryMicrodraught: string;
    expiryGdic: string;
    expirySmoothPint330: string;
    expirySmoothCan330: string;
    expiryGfesPint330: string;
    expiryGfesCan330: string;
    expiryGfes620: string;
    expiryGfesCanBig500: string;
    dailyQuizCompleted: boolean;
    roleplayVideoMade: boolean;
    pgAppearanceStandard: boolean;
    baFullBodyPhoto: string;
    outletVisibilityPhotos: string;
    posmPhotos: string;
    posmAvailable: boolean;
    merchandiseAvailable: boolean;
    merchandiseAvailablePhoto: string;
    guinnessPromotionsAvailable: boolean;
    promotionDescription: string;
    activityEngagement: string;
    issuesNotes: string;
    visibilityAvailable: boolean;
  }

  const initialFormData: FormDataType = {
    digitalActivityEngagementPhoto: '',
    digitalActivityEngagementDescription: '',
    guinnessPromotionDisplayedDescriptionPhoto: '',
    digitalActivityEngagementSwitch: false,
    guinnessPromotionDisplayedDescription: '',
    guinnessPromotionDisplayed: false,
    activityStoutieRemarks: '',
    assignedToBA: '',
    assignedToTL: '',
    outletId: '',
    gdicAvailable: false,
    smoothAvailable: false,
    gfesAvailable: false,
    personnelEmail: '',
    teamLeaderName: '',
    pgFullName: '',
    reportTimestamp: '',
    locationProvince: '',
    locationCity: '',
    outletType: '',
    outletName: '',
    outletTier: '',
    kegsAvailable: false,
    microdraughtAvailable: false,
    activityStoutieRunning: false,
    activityStoutieResult: '',
    activityStoutiePhotos: '',
    stockKegs: '',
    stockMicrodraught: '',
    stockGdic: '',
    stockSmoothPint330: '',
    stockSmoothCan330: '',
    stockGfesPint330: '',
    stockGfesCan330: '',
    stockGfes620: '',
    stockGfesCanBig500: '',
    expiryKegs: '',
    expiryMicrodraught: '',
    expiryGdic: '',
    expirySmoothPint330: '',
    expirySmoothCan330: '',
    expiryGfesPint330: '',
    expiryGfesCan330: '',
    expiryGfes620: '',
    expiryGfesCanBig500: '',
    dailyQuizCompleted: false,
    roleplayVideoMade: false,
    pgAppearanceStandard: false,
    baFullBodyPhoto: '',
    outletVisibilityPhotos: '',
    posmPhotos: '',
    posmAvailable: false,
    merchandiseAvailable: false,
    merchandiseAvailablePhoto: '',
    guinnessPromotionsAvailable: false,
    promotionDescription: '',
    activityEngagement: '',
    issuesNotes: '',
    visibilityAvailable: false,
  };

  const [formData, setFormData] = useState<typeof initialFormData>(initialFormData);
  // Track if modal was opened via 'ASSES' button

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const collectionRef = collection(db, 'task_early_assessment');
      const snapshot = await getDocs(collectionRef);
      let list = snapshot.docs.map(doc => ({ id: doc.id, assignedToBA: doc.data().assignedToBA, assignedToTL: doc.data().assignedToTL, ...doc.data() }));
      // Filter for BA role: only show records assigned to current user
      if (userRole === 'Iris - BA' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
      if (userRole === 'Iris - TL' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }
      setAssessments(list);
    } catch (error) {
      console.error("Error fetching assessments: ", error);
      Alert.alert("Error", "Failed to fetch assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
    // Optionally, fetch user role here if needed
  }, [userRole]);

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
        expirySmoothPint330: toDateString(item.expirySmoothPint330),
        expirySmoothCan330: toDateString(item.expirySmoothCan330),
        expiryGfesPint330: toDateString(item.expiryGfesPint330),
        expiryGfesCan330: toDateString(item.expiryGfesCan330),
        expiryGfes620: toDateString(item.expiryGfes620),
        expiryGfesCanBig500: toDateString(item.expiryGfesCanBig500),
      });
    } else {
      setSelectedAssessment(null);
      setFormData(initialFormData);
    }
    setIsModalVisible(true);
  };

  // Modified handleFormSubmit to support status update for BA and TL
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

    // If BA is updating, set status to 'ASSESS BY BA'
    if (userRole === 'Iris - BA' && modalType === 'edit') {
      dataToSubmit.status = 'ASSESS BY BA';
    }
    // If TL is updating, set status to 'ASSESS BY TL'
    if (userRole === 'Iris - TL' && modalType === 'edit') {
      dataToSubmit.status = 'ASSESS BY TL';
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

  const canManage = ['admin', 'superadmin'].includes(userRole || '');
  const isAreaManager = userRole === 'area manager';
  const canUpdate = canManage || isAreaManager || userRole === 'Iris - BA' || userRole === 'Iris - TL';

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>{item.outletName}</Text>
      {/* Assigned to BA (bold) */}
      <Text style={{ fontWeight: 'bold' }}>Assigned to BA: {item.assignedToBA || '-'}</Text>
      <Text>Assigned to TL: {item.assignedToTL || '-'}</Text>
      <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
      <Text>Created By: {item.createdBy || '-'}</Text>
      <Text>Task ID: {item.tasksId || '-'}</Text>
      {/* Task Early Assessment Status */}
      <Text>Task Early Assessment Status: {item.status || '-'}</Text>
      <View style={styles.buttonContainer}>
        {/* Only show ASSESS by BA for Iris - BA and if not already assessed by BA */}
        {userRole === 'Iris - BA' && item.status !== 'ASSESS BY BA' && (
          <Button title="ASSESS by BA" onPress={() => handleOpenModal('edit', item)} />
        )}
        {/* Only show ASSESS by TL for Iris - TL and if status is 'ASSESS BY BA' */}
        {userRole === 'Iris - TL' && item.status === 'ASSESS BY BA' && (
          <Button title="ASSESS by TL" onPress={() => handleOpenModal('edit', item)} />
        )}
        {/* Only admin and superadmin see Edit, but only superadmin sees Delete, not area manager */}
        {canManage && <Button title="Edit" onPress={() => handleOpenModal('edit', item)} />}
        {userRole === 'superadmin' && <Button title="Delete" onPress={() => handleDelete(item.id)} />}
        {isAreaManager && item.status === 'ASSESS BY TL' && (
          <Button title="ASSESS by AM" onPress={() => { setSelectedAssessment(item); setIsReviewModalVisible(true); }} />
        )}
      </View>
    </View>
  );
  // Render review modal for area manager
  const renderReviewModal = () => {
    if (!selectedAssessment) return null;
    const item = selectedAssessment;
    return (
      <Modal visible={isReviewModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsReviewModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Assess by Area Manager</Text>
            <Text style={styles.sectionTitle}>Personnel Information</Text>
            <Text>Personnel Email: {item.personnelEmail}</Text>
            <Text>Team Leader Name: {item.teamLeaderName}</Text>
            <Text>PG Full Name: {item.pgFullName}</Text>
            <Text style={styles.sectionTitle}>Outlet/Venue Details</Text>
            <Text>Report Date: {item.reportTimestamp?.toDate ? item.reportTimestamp.toDate().toLocaleDateString() : item.reportTimestamp || '-'}</Text>
            <Text>Province: {item.locationProvince}</Text>
            <Text>City: {item.locationCity}</Text>
            <Text>Outlet Type: {item.outletType}</Text>
            <Text>Outlet Name: {item.outletName}</Text>
            <Text>Tier Outlet: {item.outletTier}</Text>
            <Text style={styles.sectionTitle}>Outlet Facilities</Text>
            <Text>KEGS Available: {item.kegsAvailable ? 'Yes' : 'No'}</Text>
            <Text>Microdraught Available: {item.microdraughtAvailable ? 'Yes' : 'No'}</Text>
            <Text style={styles.sectionTitle}>Activity Tracking</Text>
            <Text>Activity Stoutie Running: {item.activityStoutieRunning ? 'Yes' : 'No'}</Text>
            <Text>Activity Stoutie Result: {item.activityStoutieResult}</Text>
            <Text>Activity Stoutie Photos: {item.activityStoutiePhotos}</Text>
            <Text style={styles.sectionTitle}>Product Stock</Text>
            <Text>KEGS Stock: {item.stockKegs}</Text>
            <Text>Microdraught Stock: {item.stockMicrodraught}</Text>
            <Text>GDIC Stock: {item.stockGdic}</Text>
            <Text>Smooth Pint/Can 330ml Stock: {item.stockSmoothPintCan330}</Text>
            <Text>GFES Pint/Can 330ml Stock: {item.stockGfesPintCan330}</Text>
            <Text>GFES 620ml Stock: {item.stockGfes620}</Text>
            <Text>GFES Can Big 500ml Stock: {item.stockGfesCanBig500}</Text>
            <Text style={styles.sectionTitle}>Product Expiry Dates</Text>
            <Text>KEGS Expiry: {item.expiryKegs}</Text>
            <Text>Microdraught Expiry: {item.expiryMicrodraught}</Text>
            <Text>GDIC Expiry: {item.expiryGdic}</Text>
            <Text>Smooth Pint/Can 330ml Expiry: {item.expirySmoothPintCan330}</Text>
            <Text>GFES Pint/Can 330ml Expiry: {item.expiryGfesPintCan330}</Text>
            <Text>GFES 620ml Expiry: {item.expiryGfes620}</Text>
            <Text>GFES Can Big 500ml Expiry: {item.expiryGfesCanBig500}</Text>
            <Text style={styles.sectionTitle}>Compliance & Performance</Text>
            <Text>Daily Quiz Completed: {item.dailyQuizCompleted ? 'Yes' : 'No'}</Text>
            <Text>Roleplay Video Made: {item.roleplayVideoMade ? 'Yes' : 'No'}</Text>
            <Text>PG Appearance Standard: {item.pgAppearanceStandard}</Text>
            <Text style={styles.sectionTitle}>Visual Merchandising</Text>
            <Text>Outlet Visibility Photos: {item.outletVisibilityPhotos}</Text>
            <Text>POSM Photos: {item.posmPhotos}</Text>
            <Text>Merchandise Available: {item.merchandiseAvailable ? 'Yes' : 'No'}</Text>
            <Text>Merchandise Available Photo: {item.merchandiseAvailablePhoto ? item.merchandiseAvailablePhoto : '-'}</Text>
            <Text style={styles.sectionTitle}>Promotions & Engagement</Text>
            <Text>Guinness Promotions Available: {item.guinnessPromotionsAvailable ? 'Yes' : 'No'}</Text>
            <Text>Promotion Description: {item.promotionDescription}</Text>
            <Text>Activity Engagement: {item.activityEngagement}</Text>
            <Text style={styles.sectionTitle}>Issues/Notes</Text>
            <Text>{item.issuesNotes}</Text>
            <View style={styles.buttonContainer}>
              <Button title="Done Assess by AM" onPress={() => {
                Alert.alert('Confirm Assess', 'Are you sure assessed?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: async () => {
                    try {
                      await updateDoc(doc(db, 'task_early_assessment', item.id), { status: 'ASSESS BY AM' });
                      fetchAssessments();
                      setIsReviewModalVisible(false);
                      Alert.alert('Success', 'Status updated to ASSESS BY AM.');
                    } catch (e) {
                      Alert.alert('Error', 'Failed to update status.');
                    }
                  }}
                ]);
              }} />
              <Button title="Cancel" onPress={() => setIsReviewModalVisible(false)} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    );
  };

  const renderModal = () => (
    <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{modalType === 'add' ? 'Add' : 'Edit'} Assessment</Text>
          
          <Text style={styles.sectionTitle}>Personnel Information</Text>
          {/* AssignedToBA: ID (read-only) */}
          <TextInput
            style={styles.input}
            value={formData.assignedToBA || ''}
            editable={false}
            placeholder="AssignedToBA : ID"
          />
          {/* AssignedToTL: ID (read-only) */}
          <TextInput
            style={styles.input}
            value={formData.assignedToTL || ''}
            editable={false}
            placeholder="AssignedToTL : ID"
          />

          <Text style={styles.sectionTitle}>Outlet/Venue Details</Text>
          {/* Outlet Name -> OutletID : ID (read-only) */}
          <TextInput
            style={styles.input}
            value={formData.outletId || ''}
            editable={false}
            placeholder="OutletID : ID"
          />
          {/* Report Date -> Timestamp of edit (read-only) */}
          <TextInput
            style={styles.input}
            value={modalType === 'edit' ? (selectedAssessment?.updatedAt ? new Date(selectedAssessment.updatedAt.seconds * 1000).toLocaleString() : '') : ''}
            editable={false}
            placeholder="Edit Timestamp"
          />

          <Text style={styles.sectionTitle}>Product Availabilty / Stock / Expiry Date</Text>
          
          <View style={styles.switchContainer}><Text>KEGS Available</Text><Switch value={formData.kegsAvailable} onValueChange={val => setFormData({...formData, kegsAvailable: val})} /></View>
          <Text style={styles.switchLabel}>Stock - Kegs</Text>
          <TextInput style={styles.input} value={formData.stockKegs} onChangeText={text => setFormData({...formData, stockKegs: text})} placeholder="KEGS Stock" />
          <Text style={styles.switchLabel}>Expired Date - Kegs</Text>
          <TouchableOpacity onPress={() => setShowExpiryKegsPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryKegs}
              placeholder="KEGS Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryKegsPicker && (
            <DateTimePicker
              value={formData.expiryKegs ? new Date(formData.expiryKegs) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryKegsPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryKegs: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}

          <View style={styles.switchContainer}><Text>Microdraught Available</Text><Switch value={formData.microdraughtAvailable} onValueChange={val => setFormData({...formData, microdraughtAvailable: val})} /></View>
          <Text style={styles.switchLabel}>Stock - Microdraught</Text>
          <TextInput style={styles.input} value={formData.stockMicrodraught} onChangeText={text => setFormData({...formData, stockMicrodraught: text})} placeholder="Microdraught Stock" />
          <Text style={styles.switchLabel}>Expired Date - Microdraught</Text>
          <TouchableOpacity onPress={() => setShowExpiryMicrodraughtPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryMicrodraught}
              placeholder="Microdraught Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryMicrodraughtPicker && (
            <DateTimePicker
              value={formData.expiryMicrodraught ? new Date(formData.expiryMicrodraught) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryMicrodraughtPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryMicrodraught: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}

          <View style={styles.switchContainer}><Text>Guinness GDIC Available</Text><Switch value={formData.gdicAvailable} onValueChange={val => setFormData({...formData, gdicAvailable: val})} /></View>
          <Text style={styles.switchLabel}>Stock - GDIC</Text>
          <TextInput style={styles.input} value={formData.stockGdic} onChangeText={text => setFormData({...formData, stockGdic: text})} placeholder="GDIC Stock" />
          <Text style={styles.switchLabel}>Expired Date - GDIC</Text>
          <TouchableOpacity onPress={() => setShowExpiryGdicPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryGdic}
              placeholder="GDIC Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryGdicPicker && (
            <DateTimePicker
              value={formData.expiryGdic ? new Date(formData.expiryGdic) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryGdicPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryGdic: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          
          <View style={styles.switchContainer}><Text>Guinness Smooth Available</Text><Switch value={formData.smoothAvailable} onValueChange={val => setFormData({...formData, smoothAvailable: val})} /></View>
          <Text style={styles.switchLabel}>Stock - Smooth Pint 330ml</Text>
          <TextInput style={styles.input} value={formData.stockSmoothPint330} onChangeText={text => setFormData({...formData, stockSmoothPint330: text})} placeholder="Smooth Pint 330ml Stock" />
          <Text style={styles.switchLabel}>Expired Date - Smooth Pint 330ml</Text>
          <TouchableOpacity onPress={() => setShowExpirySmoothPintPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expirySmoothPint330}
              placeholder="Smooth Pint 330ml Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpirySmoothPintPicker && (
            <DateTimePicker
              value={formData.expirySmoothPint330 ? new Date(formData.expirySmoothPint330) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpirySmoothPintPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expirySmoothPint330: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          <Text style={styles.switchLabel}>Stock - Smooth Can 330ml</Text>
          <TextInput style={styles.input} value={formData.stockSmoothCan330} onChangeText={text => setFormData({...formData, stockSmoothCan330: text})} placeholder="Smooth Can 330ml Stock" />
          <Text style={styles.switchLabel}>Expired Date - Smooth Can 330ml</Text>
          <TouchableOpacity onPress={() => setShowExpirySmoothCanPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expirySmoothCan330}
              placeholder="Smooth Can 330ml Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpirySmoothCanPicker && (
            <DateTimePicker
              value={formData.expirySmoothCan330 ? new Date(formData.expirySmoothCan330) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpirySmoothCanPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expirySmoothCan330: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}

          <View style={styles.switchContainer}><Text>Guinness GFES Available</Text><Switch value={formData.gfesAvailable} onValueChange={val => setFormData({...formData, gfesAvailable: val})} /></View>
          <Text style={styles.switchLabel}>Stock - GFES Pint 330ml</Text>
          <TextInput style={styles.input} value={formData.stockGfesPint330} onChangeText={text => setFormData({...formData, stockGfesPint330: text})} placeholder="GFES Pint 330ml Stock" />
          <Text style={styles.switchLabel}>Expired Date - GFES Pint 330ml</Text>
          <TouchableOpacity onPress={() => setShowExpiryGfesPintPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryGfesPint330}
              placeholder="GFES Pint 330ml Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryGfesPintPicker && (
            <DateTimePicker
              value={formData.expiryGfesPint330 ? new Date(formData.expiryGfesPint330) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryGfesPintPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryGfesPint330: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          <Text style={styles.switchLabel}>Stock - GFES Can 330ml</Text>
          <TextInput style={styles.input} value={formData.stockGfesCan330} onChangeText={text => setFormData({...formData, stockGfesCan330: text})} placeholder="GFES Can 330ml Stock" />
          <Text style={styles.switchLabel}>Expired Date - GFES Can 330ml</Text>
          <TouchableOpacity onPress={() => setShowExpiryGfesCanPicker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryGfesCan330}
              placeholder="GFES Can 330ml Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryGfesCanPicker && (
            <DateTimePicker
              value={formData.expiryGfesCan330 ? new Date(formData.expiryGfesCan330) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryGfesCanPicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryGfesCan330: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          <Text style={styles.switchLabel}>Stock - GFES 620ml</Text>
          <TextInput style={styles.input} value={formData.stockGfes620} onChangeText={text => setFormData({...formData, stockGfes620: text})} placeholder="GFES 620ml Stock" />
          <Text style={styles.switchLabel}>Expired Date - GFES 620ml</Text>
          <TouchableOpacity onPress={() => setShowExpiryGfes620Picker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryGfes620}
              placeholder="GFES 620ml Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryGfes620Picker && (
            <DateTimePicker
              value={formData.expiryGfes620 ? new Date(formData.expiryGfes620) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryGfes620Picker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryGfes620: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          <Text style={styles.switchLabel}>Stock - GFES Can Big 500ml</Text>
          <TextInput style={styles.input} value={formData.stockGfesCanBig500} onChangeText={text => setFormData({...formData, stockGfesCanBig500: text})} placeholder="GFES Can Big 500ml Stock" />
          <Text style={styles.switchLabel}>Expired Date - GFES Can Big 500ml</Text>
          <TouchableOpacity onPress={() => setShowExpiryGfesCanBig500Picker(true)}>
            <TextInput
              style={styles.input}
              value={formData.expiryGfesCanBig500}
              placeholder="GFES Can Big 500ml Expiry (YYYY-MM-DD)"
              editable={false}
              pointerEvents="none"
            />
          </TouchableOpacity>
          {showExpiryGfesCanBig500Picker && (
            <DateTimePicker
              value={formData.expiryGfesCanBig500 ? new Date(formData.expiryGfesCanBig500) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowExpiryGfesCanBig500Picker(false);
                if (selectedDate) {
                  setFormData({ ...formData, expiryGfesCanBig500: selectedDate.toISOString().split('T')[0] });
                }
              }}
            />
          )}
          
          {userRole === 'Iris - TL' && modalType === 'edit' && (
            <>
              <Text style={styles.sectionTitle}>Activity Tracking</Text>
              <Text style={styles.switchLabel}>Activity Stoutie</Text>
              <View style={styles.switchContainer}><Text>Activity Stoutie Running</Text><Switch value={formData.activityStoutieRunning} onValueChange={val => setFormData({...formData, activityStoutieRunning: val})} /></View>
              <Text style={styles.switchLabel}>Activity Stoutie result</Text>
              <TextInput style={styles.input} value={formData.activityStoutieResult} onChangeText={text => setFormData({...formData, activityStoutieResult: text})} placeholder="Activity Stoutie Result" />
              <Text style={styles.switchLabel}>Activity Stoutie Issue/Notes/Remarks</Text>
              <TextInput
                style={styles.input}
                value={formData.activityStoutieRemarks}
                onChangeText={text => setFormData({ ...formData, activityStoutieRemarks: text })}
                placeholder="Activity Stoutie Issue/Notes/Remarks"
              />
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.switchLabel}>Activity Stoutie Photos</Text>
                {formData.activityStoutiePhotos ? (
                  <Image source={{ uri: formData.activityStoutiePhotos }} style={{ width: 120, height: 120, marginBottom: 8, borderRadius: 8 }} />
                ) : null}
                <Button
                  title={formData.activityStoutiePhotos ? 'Change Photo' : 'Pick Photo'}
                  onPress={async () => {
                    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (permissionResult.granted === false) {
                      alert('Permission to access camera roll is required!');
                      return;
                    }
                    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                      setFormData({ ...formData, activityStoutiePhotos: pickerResult.assets[0].uri });
                    }
                  }}
                />
              </View>
          
          <Text style={styles.sectionTitle}>Compliance & Performance</Text>
          <View style={styles.switchContainer}><Text>Daily Quiz Completed</Text><Switch value={formData.dailyQuizCompleted} onValueChange={val => setFormData({...formData, dailyQuizCompleted: val})} /></View>
          <View style={styles.switchContainer}><Text>Roleplay Video Made</Text><Switch value={formData.roleplayVideoMade} onValueChange={val => setFormData({...formData, roleplayVideoMade: val})} /></View>

          <View style={styles.switchContainer}>
            <Text>PG Appearance Standard</Text>
            <Switch
              value={formData.pgAppearanceStandard}
              onValueChange={val => setFormData({ ...formData, pgAppearanceStandard: val })}
            />
          </View>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4 }}>Upload BA Picture Full Body</Text>
            {formData.baFullBodyPhoto ? (
              <Image source={{ uri: formData.baFullBodyPhoto }} style={{ width: 120, height: 160, marginBottom: 8, borderRadius: 8 }} />
            ) : null}
            <Button
              title={formData.baFullBodyPhoto ? 'Change Photo' : 'Pick Photo'}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert('Permission to access camera roll is required!');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setFormData({ ...formData, baFullBodyPhoto: pickerResult.assets[0].uri });
                }
              }}
            />
          </View>

          <Text style={styles.sectionTitle}>Visual Merchandising</Text>

          <Text style={styles.switchLabel}>Visibility available, example : (MOT: Lightbox, Neon Sign, Totem, Glory Fire, Coaster, Barmate, Tripod Banner, Led Banner)
                  (MM : Poster, Flyer, Shelf Talker, Wobbler, Floor Display Unit, Chiller Branding)</Text>
          <View style={styles.switchContainer}>
            <Text>Visibility Available</Text>
            <Switch
              value={formData.visibilityAvailable}
              onValueChange={val => setFormData({ ...formData, visibilityAvailable: val })}
            />
          </View>
    
          
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.switchLabel}>Visibility Picture</Text>
            {formData.outletVisibilityPhotos ? (
              <Image source={{ uri: formData.outletVisibilityPhotos }} style={{ width: 120, height: 120, marginBottom: 8, borderRadius: 8 }} />
            ) : null}
            <Button
              title={formData.outletVisibilityPhotos ? 'Change Photo' : 'Pick Photo'}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert('Permission to access camera roll is required!');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setFormData({ ...formData, outletVisibilityPhotos: pickerResult.assets[0].uri });
                }
              }}
            />
          </View>
          
          <Text style={styles.switchLabel}>POSM available example (MOT : Tent Card, Flagcain, Tripod Banner)
            (MM : Poster, Flyer, Shelf Talker, Wobbler, Floor Display Unit) </Text>

          <View style={styles.switchContainer}>
            <Text>POSM Available</Text>
            <Switch
              value={formData.posmAvailable || false}
              onValueChange={val => setFormData({ ...formData, posmAvailable: val })}
            />
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.switchLabel}>POSM Picture</Text>
            {formData.posmPhotos ? (
              <Image source={{ uri: formData.posmPhotos }} style={{ width: 120, height: 120, marginBottom: 8, borderRadius: 8 }} />
            ) : null}
            <Button
              title={formData.posmPhotos ? 'Change Photo' : 'Pick Photo'}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert('Permission to access camera roll is required!');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setFormData({ ...formData, posmPhotos: pickerResult.assets[0].uri });
                }
              }}
            />
          </View>

          <View style={styles.switchContainer}><Text>Merchandise Available</Text><Switch value={formData.merchandiseAvailable} onValueChange={val => setFormData({...formData, merchandiseAvailable: val})} /></View>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.switchLabel}>Merchandise Available Photo</Text>
            {formData.merchandiseAvailablePhoto ? (
              <Image source={{ uri: formData.merchandiseAvailablePhoto }} style={{ width: 120, height: 120, marginBottom: 8, borderRadius: 8 }} />
            ) : null}
            <Button
              title={formData.merchandiseAvailablePhoto ? 'Change Photo' : 'Pick Photo'}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert('Permission to access camera roll is required!');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setFormData({ ...formData, merchandiseAvailablePhoto: pickerResult.assets[0].uri });
                }
              }}
            />
          </View>

          <Text style={styles.sectionTitle}>Promotions & Engagement</Text>
          <Text style={styles.switchLabel}>Promotions Available</Text>
          <View style={styles.switchContainer}><Text>Guinness Promotions Available</Text><Switch value={formData.guinnessPromotionsAvailable} onValueChange={val => setFormData({...formData, guinnessPromotionsAvailable: val})} /></View>
          <Text style={styles.switchLabel}>Promotions Description</Text>
          <TextInput style={styles.input} value={formData.promotionDescription} onChangeText={text => setFormData({...formData, promotionDescription: text})} placeholder="Promotion Description" />
          <Text style={styles.switchLabel}>Promotions Displayed</Text>
          <View style={styles.switchContainer}>
            <Text>Guinness Promotion Displayed</Text>
            <Switch
              value={formData.guinnessPromotionDisplayed}
              onValueChange={val => setFormData({ ...formData, guinnessPromotionDisplayed: val })}
            />
          </View>
          <Text style={styles.switchLabel}>Guinness Promotion Displayed Description</Text>
          <TextInput
            style={styles.input}
            value={formData.guinnessPromotionDisplayedDescription}
            onChangeText={text => setFormData({ ...formData, guinnessPromotionDisplayedDescription: text })}
            placeholder="Guinness Promotion Displayed Description"
          />
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.switchLabel}>Promotion Displayed Description Photo</Text>
            {formData.guinnessPromotionDisplayedDescriptionPhoto ? (
              <Image source={{ uri: formData.guinnessPromotionDisplayedDescriptionPhoto }} style={{ width: 120, height: 120, marginBottom: 8, borderRadius: 8 }} />
            ) : null}
            <Button
              title={formData.guinnessPromotionDisplayedDescriptionPhoto ? 'Change Photo' : 'Pick Photo'}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert('Permission to access camera roll is required!');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setFormData({ ...formData, guinnessPromotionDisplayedDescriptionPhoto: pickerResult.assets[0].uri });
                }
              }}
            />
          </View>

          <Text style={styles.switchLabel}>Digital Activity Engagement</Text>
          <View style={styles.switchContainer}>
            <Text>Digital Activity Engagement</Text>
            <Switch
              value={formData.digitalActivityEngagementSwitch}
              onValueChange={val => setFormData({ ...formData, digitalActivityEngagementSwitch: val })}
            />
          </View>
          <Text style={styles.switchLabel}>Digital Activity Engagement Description</Text>
          <TextInput
            style={styles.input}
            value={formData.digitalActivityEngagementDescription}
            onChangeText={text => setFormData({ ...formData, digitalActivityEngagementDescription: text })}
            placeholder="Digital Activity Engagement Description"
          />
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.switchLabel}>Digital Activity Engagement Photo</Text>
            {formData.digitalActivityEngagementPhoto ? (
              <Image source={{ uri: formData.digitalActivityEngagementPhoto }} style={{ width: 120, height: 120, marginBottom: 8, borderRadius: 8 }} />
            ) : null}
            <Button
              title={formData.digitalActivityEngagementPhoto ? 'Change Photo' : 'Pick Photo'}
              onPress={async () => {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (permissionResult.granted === false) {
                  alert('Permission to access camera roll is required!');
                  return;
                }
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  setFormData({ ...formData, digitalActivityEngagementPhoto: pickerResult.assets[0].uri });
                }
              }}
            />
          </View>
          </>
          )}


          <Text style={styles.sectionTitle}>Issue/Notes/Request/Input - catatan kecil/permintaan outlet/masukan/masalah</Text>
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
      {renderReviewModal()}
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
  switchLabel: { fontSize: 10, fontWeight: '500', marginBottom: 4 },
});
