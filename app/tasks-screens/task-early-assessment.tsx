import { useState, useEffect, useMemo } from 'react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl, TouchableOpacity, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import TaskEarlyAssessmentDetailsModal, { buildTaskEarlyAssessmentText } from '@/components/TaskEarlyAssessmentDetailsModal';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Roles, isBAish, isTLish } from '../../constants/roles';
import { EAStatus, getToneForEAStatus, nextStatusOnSubmitEA, EA_STATUS_OPTIONS } from '../../constants/status';
import stateMachine from '../../constants/stateMachine';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';

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
  // Expand and description details
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsItem, setDetailsItem] = useState<any | null>(null);
  // Sort toggle (default newest first)
  const [sortAsc, setSortAsc] = useState(false);
  const [outletDetails, setOutletDetails] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  // Admin-only status override selection (constrained)
  const [adminNextStatus, setAdminNextStatus] = useState<string>('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const filteredAssessments = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return assessments.filter(r => {
      const matchesSearch = !q || (String(r.outletName || '').toLowerCase().includes(q)) || (String(r.outletId || '').toLowerCase().includes(q));
      const matchesStatus = !statusFilter || (String(r.status || '') === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [assessments, debouncedSearch, statusFilter]);
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
  const storage = getStorage();

  // Helper to upload image to Firebase Storage and get download URL
  const uploadImageAndGetUrl = async (localUri: string, fieldName: string) => {
    try {
      // Convert localUri to blob
      const response = await fetch(localUri);
      const blob = await response.blob();
      // Fetch outletName from Firestore using outletId
      let outletName = formData.outletId;
      try {
        const outletDoc = await getDoc(doc(collection(db, 'outlets'), formData.outletId));
        if (outletDoc.exists()) {
          outletName = outletDoc.data().outletName || formData.outletId;
        }
      } catch (err) {
        // fallback to outletId if fetch fails
      }
      // Sanitize outletName for filename (remove spaces and special chars)
      outletName = String(outletName).replace(/[^a-zA-Z0-9_-]/g, '_');
      // Unique filename: outletName_fieldName_timestamp
      const filename = `${outletName}_${fieldName}_${Date.now()}`;
      const imageRef = storageRef(storage, `task_early_assessment/${filename}`);
      await uploadBytes(imageRef, blob);
      const downloadUrl = await getDownloadURL(imageRef);
      Alert.alert('Success', 'Photo uploaded successfully!');
      return downloadUrl;
    } catch (e) {
      Alert.alert('Upload Error', e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to upload photo.');
      return '';
    }
  };
  // Track if modal was opened via 'ASSES' button

  const fetchAssessments = async () => {
    if (!userRole) {
      setAssessments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const collectionRef = collection(db, 'task_early_assessment');
      const snapshot = await getDocs(collectionRef);
      let list = snapshot.docs.map(doc => ({ id: doc.id, assignedToBA: doc.data().assignedToBA, assignedToTL: doc.data().assignedToTL, ...doc.data() }));
      // Filter for BA role: only show records assigned to current user
  if (isBAish(userRole as any) && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
  if (isTLish(userRole as any) && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }
      // Sort by createdAt asc/desc when available
      const sorted = [...list].sort((a: any, b: any) => {
        const ta = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return sortAsc ? (ta - tb) : (tb - ta);
      });
      setAssessments(sorted);
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
  }, [userRole, sortAsc]);

  const handleOpenModal = (type: 'add' | 'edit', item?: any) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setSelectedAssessment(item);
      const toDateString = (value: any) => {
        if (!value) return '';
        // Firestore Timestamp object
        if (typeof value === 'object' && typeof value.toDate === 'function') {
          return value.toDate().toISOString().split('T')[0];
        }
        // Already a Date object
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        // Already a string in YYYY-MM-DD format
        if (typeof value === 'string') {
          // If string is in ISO format, extract date part
          if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return value.split('T')[0];
          }
          // Try to parse as date
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
          return '';
        }
        return '';
      };
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
  setAdminNextStatus('');
    setIsModalVisible(true);
  };

  // Fetch outlet details when selectedAssessment changes and review modal is opened
  useEffect(() => {
    const fetchOutletDetails = async () => {
      if (selectedAssessment?.outletId && isReviewModalVisible) {
        try {
          const outletDoc = await getDoc(doc(collection(db, 'outlets'), selectedAssessment.outletId));
          if (outletDoc.exists()) {
            setOutletDetails(outletDoc.data());
          } else {
            setOutletDetails(null);
          }
        } catch (err) {
          setOutletDetails(null);
        }
      } else {
        setOutletDetails(null);
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing(2), paddingHorizontal: spacing(2) }}>
              <SecondaryButton title={sortAsc ? 'Oldest first' : 'Newest first'} onPress={() => setSortAsc(prev => !prev)} />
            </View>
      }
    };
    fetchOutletDetails();
  }, [selectedAssessment?.outletId, isReviewModalVisible]);

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

    // Compute next status centrally on edit
    if (modalType === 'edit') {
      const prev = (selectedAssessment?.status || '') as any;
      let next = nextStatusOnSubmitEA((userRole as any) || '', prev);
      // Admin/superadmin picker can override within allowed transitions
      if ((userRole === Roles.Admin || userRole === Roles.Superadmin) && adminNextStatus) {
        if (stateMachine.canTransition('EA', userRole as any, prev, adminNextStatus as any)) {
          next = adminNextStatus as any;
        }
      }
      dataToSubmit.status = next;
    }

    if (modalType === 'add') {
  addDoc(collection(db, "task_early_assessment"), { ...dataToSubmit, createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'unknown' })
        .then(() => {
          fetchAssessments();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Add Failed", error.message));
    } else if (selectedAssessment) {
  updateDoc(doc(db, "task_early_assessment", selectedAssessment.id), { ...dataToSubmit, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' })
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

  if (loading) return <ActivityIndicator style={{ marginTop: spacing(10) }} />;

  const canManage = [Roles.Admin, Roles.Superadmin].includes((userRole || '') as any);
  const isAreaManager = userRole === Roles.AreaManager;
  const canUpdate = canManage || isAreaManager || userRole === Roles.IrisBA || userRole === Roles.IrisTL;

  const renderItem = ({ item }: { item: any }) => {
  const status = item.status || '';
  const tone = getToneForEAStatus(status) as any;
    const isExpanded = !!expanded[item.id];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.outletName || 'Outlet'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusPill label={status} tone={tone as any} />
          </View>
        </View>
        <Text style={styles.meta}>Assigned BA: <Text style={styles.metaValue}>{item.assignedToBA || '-'}</Text></Text>
        <Text style={styles.meta}>Assigned TL: <Text style={styles.metaValue}>{item.assignedToTL || '-'}</Text></Text>
        <Text style={styles.meta}>Created: <Text style={styles.metaValue}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text></Text>
        <Text style={styles.meta}>Task ID: <Text style={styles.metaValue}>{item.tasksId || '-'}</Text></Text>
        {isExpanded && (
          <View style={{ marginTop: spacing(3) }}>
            <Text style={styles.meta}>KEGS Avail: <Text style={styles.metaValue}>{item.kegsAvailable ? 'Yes' : 'No'}</Text></Text>
            <Text style={styles.meta}>GDIC Avail: <Text style={styles.metaValue}>{item.gdicAvailable ? 'Yes' : 'No'}</Text></Text>
            <Text style={styles.meta}>Smooth Avail: <Text style={styles.metaValue}>{item.smoothAvailable ? 'Yes' : 'No'}</Text></Text>
            <Text style={styles.meta}>GFES Avail: <Text style={styles.metaValue}>{item.gfesAvailable ? 'Yes' : 'No'}</Text></Text>
            <Text style={styles.meta}>POSM Avail: <Text style={styles.metaValue}>{item.posmAvailable ? 'Yes' : 'No'}</Text></Text>
            <Text style={styles.meta}>Merchandise Avail: <Text style={styles.metaValue}>{item.merchandiseAvailable ? 'Yes' : 'No'}</Text></Text>
          </View>
        )}
  <View style={styles.actionsRow}>
          {userRole === Roles.IrisBA && stateMachine.canTransition('EA', Roles.IrisBA, status || EAStatus.Empty, EAStatus.AssessByBA) && (
            <PrimaryButton title="Assess BA" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
          )}
          {userRole === Roles.IrisTL && stateMachine.canTransition('EA', Roles.IrisTL, status || EAStatus.Empty, EAStatus.AssessByTL) && (
            <PrimaryButton title="Assess TL" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
          )}
          {canManage && (
            <SecondaryButton title="Edit" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
          )}
          {userRole === 'superadmin' && (
            <SecondaryButton title="Delete" onPress={() => handleDelete(item.id)} style={styles.actionBtn} />
          )}
          {isAreaManager && stateMachine.canTransition('EA', Roles.AreaManager, status || EAStatus.Empty, EAStatus.AssessByAM) && (
            <PrimaryButton title="Assess AM" onPress={() => { setSelectedAssessment(item); setIsReviewModalVisible(true); }} style={styles.actionBtn} />
          )}
          <View style={styles.iconActions}>
            <TouchableOpacity
              onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              style={styles.iconButton}
              accessibilityLabel={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setDetailsItem(item); setDetailsVisible(true); }}
              style={styles.iconButton}
              accessibilityLabel="Open details"
            >
              <Ionicons name="newspaper-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
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
            <Text>Assigned to BA ID: {item.assignedToBA}</Text>
            <Text>Assigned to TL : {item.assignedToTL}</Text>
            <Text style={styles.sectionTitle}>Outlet/Venue Details</Text>
            <Text>Outlet ID: {item.outletId}</Text>
            <Text>Province: {outletDetails?.outletProvince || '-'}</Text>
            <Text>City: {outletDetails?.outletCity || '-'}</Text>
            <Text>Outlet Type: {outletDetails?.outletType || '-'}</Text>
            <Text>Outlet Name: {outletDetails?.outletName || '-'}</Text>
            <Text>Tier Outlet: {outletDetails?.outletTier || '-'}</Text>
            <Text style={styles.sectionTitle}>Product Availability</Text>
            <Text>KEGS Available: {item.kegsAvailable ? 'Yes' : 'No'}</Text>
            <Text>KEGS Stock: {item.kegsStock}</Text>
            <Text>Expired Date KEGS: {item.expiryKegs}</Text>
            <Text>Microdraught Available: {item.microdraughtAvailable ? 'Yes' : 'No'}</Text>
            <Text>Microdraught Stock: {item.microdraughtStock}</Text>
            <Text>Expired Date Microdraught: {item.expiryMicrodraught}</Text>
            <Text>GDIC Available: {item.gdicAvailable ? 'Yes' : 'No'}</Text>
            <Text>GDIC Stock: {item.gdicStock}</Text>
            <Text>Expired Date GDIC: {item.expiryGdic}</Text>
            <Text>Smooth Available: {item.smoothAvailable ? 'Yes' : 'No'}</Text>
            <Text>Smooth Pint 330ml Available: {item.smoothPint330mlAvailable ? 'Yes' : 'No'}</Text>
            <Text>Smooth Pint 330ml Stock: {item.smoothPint330mlStock}</Text>
            <Text>Expired Date Smooth Pint 330ml: {item.expirySmoothPint330ml}</Text>
            <Text>Smooth Can 330ml Available: {item.smoothCan330mlAvailable ? 'Yes' : 'No'}</Text>
            <Text>Smooth Can 330ml Stock: {item.smoothCan330mlStock}</Text>
            <Text>Expired Date Smooth Can 330ml: {item.expirySmoothCan330ml}</Text>
            <Text>GFES Available: {item.gfesAvailable ? 'Yes' : 'No'}</Text>
            <Text>GFES Pint 330ml Stock: {item.gfesPint330mlStock}</Text>
            <Text>Expired Date GFES Pint 330ml: {item.expiryGfesPint330ml}</Text>
            <Text>GFES Quart 620ml Available: {item.gfesQuart620mlAvailable ? 'Yes' : 'No'}</Text>
            <Text>GFES Quart 620ml Stock: {item.gfesQuart620mlStock}</Text>
            <Text>Expired Date GFES Quart 620ml: {item.expiryGfesQuart620ml}</Text>
            <Text>GFES Can 330ml Available: {item.gfesCan330mlAvailable ? 'Yes' : 'No'}</Text>
            <Text>GFES Can 330ml Stock: {item.gfesCan330mlStock}</Text>
            <Text>Expired Date GFES Can 330ml: {item.expiryGfesCan330ml}</Text>
            <Text>GFES Can Big 500ml Available: {item.gfesCanBig500mlAvailable ? 'Yes' : 'No'}</Text>
            <Text>GFES Can Big 500ml Stock: {item.gfesCanBig500mlStock}</Text>
            <Text>Expired Date GFES Can Big 500ml: {item.expiryGfesCanBig500ml}</Text>    
            <Text style={styles.sectionTitle}>Activity Tracking</Text>
            <Text style={styles.switchLabel}>Activity Stoutie </Text>
            <Text>Activity Stoutie Running: {item.activityStoutieRunning ? 'Yes' : 'No'}</Text>
            <Text>Activity Stoutie Result: {item.activityStoutieResult}</Text>
            <Text>Activity Stoutie Photos:</Text>
            {item.activityStoutiePhotos ? (
              <Image source={{ uri: item.activityStoutiePhotos }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}
            <Text style={styles.sectionTitle}>Compliance & Performance</Text>
            <Text>Daily Quiz Completed: {item.dailyQuizCompleted ? 'Yes' : 'No'}</Text>
            <Text>Roleplay Video Made: {item.roleplayVideoMade ? 'Yes' : 'No'}</Text>
            <Text>PG Appearance Standard: {item.pgAppearanceStandard}</Text>
            {item.baFullBodyPhoto ? (
              <Image source={{ uri: item.baFullBodyPhoto }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}
            <Text style={styles.sectionTitle}>Visual Merchandising</Text>
            <Text>Visibility Available: {item.visibilityAvailable ? 'Yes' : 'No'}</Text>
            <Text>Outlet Visibility Description : {item.outletVisibilityDescription}</Text>
            <Text>Outlet Visibility Photos:</Text>
            {item.outletVisibilityPhotos ? (
              <Image source={{ uri: item.outletVisibilityPhotos }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}
            <Text>POSM Available: {item.posmAvailable ? 'Yes' : 'No'}</Text>
            <Text>POSM Description: {item.posmDescription}</Text>
            <Text>POSM Photos:</Text>
            {item.posmPhotos ? (
              <Image source={{ uri: item.posmPhotos }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}
            <Text>Merchandise Available: {item.merchandiseAvailable ? 'Yes' : 'No'}</Text>
            <Text>Merchandise Description: {item.merchandiseDescription}</Text>
            {item.merchandiseAvailablePhoto ? (
              <Image source={{ uri: item.merchandiseAvailablePhoto }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}
            <Text style={styles.sectionTitle}>Promotions & Engagement</Text>
            <Text>Guinness Promotions Available: {item.guinnessPromotionsAvailable ? 'Yes' : 'No'}</Text>
            <Text>Promotion Description: {item.promotionDescription}</Text>
            <Text>Guinness Promotion Displayed: {item.guinnessPromotionDisplayed ? 'Yes' : 'No'}</Text>
            <Text>Guinness Promotion Displayed Description: {item.guinnessPromotionDisplayedDescription}</Text>
            {item.guinnessPromotionDisplayedDescriptionPhoto ? (
              <Image source={{ uri: item.guinnessPromotionDisplayedDescriptionPhoto }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}
            <Text>Digital Activity Engagement: {item.digitalActivityEngagement}</Text>
            <Text>Digital Activity Engagement Description: {item.digitalActivityEngagementDescription}</Text>
            {item.digitalActivityEngagementPhoto ? (
              <Image source={{ uri: item.digitalActivityEngagementPhoto }} style={{ width: 80, height: 80, borderRadius: 8, marginBottom: 8 }} />
            ) : (
              <Text style={{ color: '#888' }}>No photo</Text>
            )}  
            <Text style={styles.sectionTitle}>Issues/Notes</Text>
            <Text>{item.issuesNotes}</Text>
            <View style={styles.buttonContainer}>
              <View style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
    <PrimaryButton title="Done Assess by AM" onPress={() => {
                  Alert.alert('Confirm Assess', 'Are you sure assessed?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: async () => {
                      try {
  await updateDoc(doc(db, 'task_early_assessment', item.id), { status: EAStatus.AssessByAM, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
                        fetchAssessments();
                        setIsReviewModalVisible(false);
                        Alert.alert('Success', 'Status updated to ASSESS BY AM.');
                      } catch (e) {
                        Alert.alert('Error', 'Failed to update status.');
                      }
                    }}
                  ]);
                }} />
                <View style={{ height: 12 }} />
    <SecondaryButton title="REASSESS by TL" onPress={() => {
                  Alert.alert('Confirm Reassess', 'Reassign to TL? Status will be set to RE ASSESS BY TL.', [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: async () => {
                      try {
  await updateDoc(doc(db, 'task_early_assessment', item.id), { status: EAStatus.ReassessByTL, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
                        fetchAssessments();
                        setIsReviewModalVisible(false);
                        Alert.alert('Success', 'Status updated to RE ASSESS BY TL.');
                      } catch (e) {
                        Alert.alert('Error', 'Failed to update status.');
                      }
                    }}
                  ]);
                }} />
                <View style={{ height: 12 }} />
                <SecondaryButton title="Cancel" onPress={() => setIsReviewModalVisible(false)} />
              </View>
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
          {(userRole === Roles.Admin || userRole === Roles.Superadmin) && selectedAssessment && (
            <View style={{ marginBottom: spacing(4) }}>
              <Text style={styles.sectionTitle}>Admin: Next Status</Text>
              <View style={{ borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, backgroundColor: palette.surfaceAlt }}>
                <Picker
                  selectedValue={adminNextStatus}
                  onValueChange={(v) => setAdminNextStatus(String(v))}
                >
                  <Picker.Item label="(no change)" value="" />
                  {stateMachine
                    .nextOptionsForRole('EA', (userRole as any) || '', (selectedAssessment?.status || '') as any)
                    .map(opt => (
                      <Picker.Item key={opt} label={opt} value={opt} />
                    ))}
                </Picker>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Personnel Information</Text>
          <Text>Assigned to BA ID: {formData.assignedToBA}</Text>
          <Text>Assigned to TL : {formData.assignedToTL}</Text>
          <Text style={styles.sectionTitle}>Outlet/Venue Details</Text>
          <Text>Outlet ID: {formData.outletId}</Text>
          <Text>Province: {outletDetails?.outletProvince || '-'}</Text>
          <Text>City: {outletDetails?.outletCity || '-'}</Text>
          <Text>Outlet Type: {outletDetails?.outletType || '-'}</Text>
          <Text>Outlet Name: {outletDetails?.outletName || '-'}</Text>
          <Text>Tier Outlet: {outletDetails?.outletTier || '-'}</Text>

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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                if (event.type === 'set' && selectedDate) {
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
                    const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                      const localUri = pickerResult.assets[0].uri;
                      const downloadUrl = await uploadImageAndGetUrl(localUri, 'activityStoutiePhotos');
                      if (downloadUrl) {
                        setFormData({ ...formData, activityStoutiePhotos: downloadUrl });
                      }
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
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const localUri = pickerResult.assets[0].uri;
                  const downloadUrl = await uploadImageAndGetUrl(localUri, 'baFullBodyPhoto');
                  if (downloadUrl) {
                    setFormData({ ...formData, baFullBodyPhoto: downloadUrl });
                  }
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
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const localUri = pickerResult.assets[0].uri;
                  const downloadUrl = await uploadImageAndGetUrl(localUri, 'outletVisibilityPhotos');
                  if (downloadUrl) {
                    setFormData({ ...formData, outletVisibilityPhotos: downloadUrl });
                  }
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
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const localUri = pickerResult.assets[0].uri;
                  const downloadUrl = await uploadImageAndGetUrl(localUri, 'posmPhotos');
                  if (downloadUrl) {
                    setFormData({ ...formData, posmPhotos: downloadUrl });
                  }
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
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const localUri = pickerResult.assets[0].uri;
                  const downloadUrl = await uploadImageAndGetUrl(localUri, 'merchandiseAvailablePhoto');
                  if (downloadUrl) {
                    setFormData({ ...formData, merchandiseAvailablePhoto: downloadUrl });
                  }
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
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const localUri = pickerResult.assets[0].uri;
                  const downloadUrl = await uploadImageAndGetUrl(localUri, 'guinnessPromotionDisplayedDescriptionPhoto');
                  if (downloadUrl) {
                    setFormData({ ...formData, guinnessPromotionDisplayedDescriptionPhoto: downloadUrl });
                  }
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
                const pickerResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
                if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                  const localUri = pickerResult.assets[0].uri;
                  const downloadUrl = await uploadImageAndGetUrl(localUri, 'digitalActivityEngagementPhoto');
                  if (downloadUrl) {
                    setFormData({ ...formData, digitalActivityEngagementPhoto: downloadUrl });
                  }
                }
              }}
            />
          </View>
          </>
          )}


          <Text style={styles.sectionTitle}>Issue/Notes/Request/Input - catatan kecil/permintaan outlet/masukan/masalah</Text>
          <TextInput style={styles.input} value={formData.issuesNotes} onChangeText={text => setFormData({...formData, issuesNotes: text})} placeholder="Issues, Notes, etc." />

          <View style={styles.buttonContainer}>
            <PrimaryButton title={modalType === 'add' ? 'Add' : 'Update'} onPress={handleFormSubmit} />
            <SecondaryButton title="Cancel" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <View style={styles.screen}>
      <FilterHeader
        title="Task Early Assessment"
        search={search}
        status={statusFilter}
        statusOptions={EA_STATUS_OPTIONS}
        placeholder="Search outlet or ID"
        storageKey="filters:ea"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(prev => !prev)}
        onApply={({ search: s, status }) => { setSearch(s); setStatusFilter(status); }}
        onClear={() => { setSearch(''); setStatusFilter(''); }}
      />
      {userRole === 'superadmin' && (
        <PrimaryButton title="Add Assessment" onPress={() => handleOpenModal('add')} style={{ marginBottom: spacing(5) }} />
      )}
      
      {filteredAssessments.length === 0 ? (
        <EmptyState onReset={() => { setSearch(''); setStatusFilter(''); }} />
      ) : (
      <FlatList
        data={filteredAssessments}
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
      />)}
      <TaskEarlyAssessmentDetailsModal
        visible={detailsVisible}
        item={detailsItem}
        onCopyAll={detailsItem ? async () => { await Clipboard.setStringAsync(buildTaskEarlyAssessmentText(detailsItem, 'text')); Alert.alert('Copied to clipboard'); } : undefined}
        onClose={() => setDetailsVisible(false)}
      />
      {renderModal()}
      {renderReviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  // Legacy references retained where still used inside modal
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing(5) },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(3), paddingHorizontal: spacing(2) },
  switchLabel: { fontSize: 10, fontWeight: '500', marginBottom: spacing(1) },
  sectionTitle: { ...typography.h2, marginTop: spacing(6), marginBottom: spacing(3), color: palette.text, borderTopColor: palette.border, borderTopWidth: 1, paddingTop: spacing(4) },
  input: { height: 44, borderColor: palette.border, borderWidth: 1, marginBottom: spacing(3), paddingHorizontal: spacing(3), borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing(6) },
  modalContent: { width: '92%', backgroundColor: palette.surface, padding: spacing(6), borderRadius: radius.lg, marginVertical: spacing(10) },
  modalTitle: { ...typography.h2, color: palette.text, textAlign: 'center', marginBottom: spacing(4) },
  title: { ...typography.h2, color: palette.text, textAlign: 'center', marginBottom: spacing(4) },
  // New screen styles
  screen: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(5) },
  screenTitle: { ...typography.h1, color: palette.text, marginBottom: spacing(6), textAlign: 'center' },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  meta: { fontSize: 12, color: palette.textMuted, marginBottom: 2 },
  metaValue: { color: palette.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(4) },
  actionBtn: { flexGrow: 1, marginRight: spacing(3), marginBottom: spacing(3) },
  iconActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginLeft: 8 },
});
