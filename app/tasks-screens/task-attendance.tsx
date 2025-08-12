// === SAVE POINT: 2024-06-13 ===
// You can undo to this version if any crash happens today.

import { useState, useEffect, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Image, Platform, RefreshControl, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { db, auth, storage } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import TaskAttendanceDetailsModal, { buildTaskAttendanceText } from '@/components/TaskAttendanceDetailsModal';
import * as Clipboard from 'expo-clipboard';
import { Roles, isBAish, isTLish } from '../../constants/roles';
import { AttendanceStatus, getToneForAttendanceStatus, ATTENDANCE_STATUS_OPTIONS } from '../../constants/status';
import stateMachine from '../../constants/stateMachine';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';

export default function TaskAttendanceScreen() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    body: isDark ? '#0b1220' : palette.bg,
    surface: isDark ? '#111827' : palette.surface,
    surfaceAlt: isDark ? '#0f172a' : palette.surfaceAlt,
    border: isDark ? '#1f2937' : palette.border,
    text: isDark ? '#e5e7eb' : palette.text,
    muted: isDark ? '#94a3b8' : palette.textMuted,
    placeholder: isDark ? '#64748b' : '#9ca3af',
  };
  const inputCommonProps = isDark ? { placeholderTextColor: colors.placeholder as any } : {};
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
    taskAttendanceStatus: '', // New field
  });
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  // Sort toggle (default newest first)
  const [sortAsc, setSortAsc] = useState(false);
  // Expand and details
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsItem, setDetailsItem] = useState<any | null>(null);
  // Admin-only status override selection (constrained by state machine)
  const [adminNextStatus, setAdminNextStatus] = useState<string>('');
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const filteredAttendances = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return attendances.filter(r => {
      const outlet = outlets.find(o => o.id === r.outletId);
      const outletName = String(outlet?.outletName || '').toLowerCase();
      const matchesSearch = !q || outletName.includes(q) || String(r.outletId || '').toLowerCase().includes(q);
      const matchesStatus = !statusFilter || (String(r.taskAttendanceStatus || '') === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [attendances, outlets, debouncedSearch, statusFilter]);

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
    fetchOutlets();
    return () => unsubscribe();
  }, []);

  // Fetch all outlets for lookup
  const fetchOutlets = async () => {
    try {
      const outletsCollection = collection(db, 'outlets');
      const outletSnapshot = await getDocs(outletsCollection);
      const outletList = outletSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOutlets(outletList);
    } catch (error) {
      console.error("Error fetching outlets: ", error);
    }
  };

  const isFocused = useIsFocused();
  useEffect(() => {
    if (userRole && isFocused) {
      fetchAttendances();
    }
  }, [userRole, isFocused, sortAsc]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const attendancesCollection = collection(db, 'task_attendance');
      const attendanceSnapshot = await getDocs(attendancesCollection);
      let attendanceList = attendanceSnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, assignedToBA: data.assignedToBA, createdAt: data.createdAt, ...data } as AttendanceItem;
      });
      // Filter for BA-ish role: only show records assigned to current BA
      if (isBAish(userRole as any) && auth.currentUser?.uid) {
        attendanceList = attendanceList.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL-ish role: only show records assigned to current TL
      if (isTLish(userRole as any) && auth.currentUser?.uid) {
        attendanceList = attendanceList.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }

      attendanceList.sort((a, b) => {
        let aTime = 0;
        let bTime = 0;
        if (a.createdAt && typeof a.createdAt.toDate === 'function') {
          aTime = a.createdAt.toDate().getTime();
        }
        if (b.createdAt && typeof b.createdAt.toDate === 'function') {
          bTime = b.createdAt.toDate().getTime();
        }
        return sortAsc ? (aTime - bTime) : (bTime - aTime);
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
      userId: '',
      assignedToBA: '',
      outletId: '',
      checkIn: null,
      checkOut: null,
      checkInLatitude: '',
      checkInLongitude: '',
      checkOutLatitude: '',
      checkOutLongitude: '',
      selfieUrl: '',
      taskAttendanceStatus: '',
    });
  };

  const handleAddAttendance = () => {
    addDoc(collection(db, "task_attendance"), {
      ...formData,
      checkInLatitude: parseFloat(formData.checkInLatitude) || 0,
      checkInLongitude: parseFloat(formData.checkInLongitude) || 0,
      checkOutLatitude: parseFloat(formData.checkOutLatitude) || 0,
      checkOutLongitude: parseFloat(formData.checkOutLongitude) || 0,
      createdAt: serverTimestamp(),
  createdBy: auth.currentUser?.uid || 'unknown'
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
      taskAttendanceStatus: attendance.taskAttendanceStatus || '',
    });
    setIsEditModalVisible(true);
  setAdminNextStatus('');
  };

  const handleUpdateAttendance = async () => {
    if (!selectedAttendance) return;
    try {
      // The formData.selfieUrl should now hold the final Firebase URL if a new image was uploaded
      const currentStatus = selectedAttendance?.taskAttendanceStatus || '';
      let nextStatus = currentStatus;
      if (userRole === Roles.IrisBA) {
        nextStatus = AttendanceStatus.Pending;
      } else if ((userRole === Roles.Admin || userRole === Roles.Superadmin) && adminNextStatus) {
        if (stateMachine.canTransition('Attendance', userRole as any, currentStatus, adminNextStatus as any)) {
          nextStatus = adminNextStatus as any;
        }
      }
      const dataToUpdate = {
        ...formData,
        checkInLatitude: parseFloat(formData.checkInLatitude) || 0,
        checkInLongitude: parseFloat(formData.checkInLongitude) || 0,
        checkOutLatitude: parseFloat(formData.checkOutLatitude) || 0,
        checkOutLongitude: parseFloat(formData.checkOutLongitude) || 0,
        taskAttendanceStatus: nextStatus,
        updatedAt: serverTimestamp(),
  updatedBy: auth.currentUser?.uid || 'unknown'
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
    return <ActivityIndicator style={{ marginTop: spacing(10) }} />;
  }

  // Only these roles can CRUD
  const canManage = [
    Roles.Admin, Roles.Superadmin, Roles.AreaManager
  ].includes((userRole || '') as any);
  // These roles can Read and Update
  const canReadUpdate = canManage || [Roles.IrisBA, Roles.IrisTL].includes((userRole || '') as any);

  const handleApproveByTL = async (attendanceId: string) => {
    try {
      const attendanceDoc = doc(db, "task_attendance", attendanceId);
  await updateDoc(attendanceDoc, { taskAttendanceStatus: AttendanceStatus.ApprovedByTL, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
      fetchAttendances();
      Alert.alert('Success', 'Attendance approved by TL.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleApproveByAM = async (attendanceId: string) => {
    try {
      const attendanceDoc = doc(db, "task_attendance", attendanceId);
  await updateDoc(attendanceDoc, { taskAttendanceStatus: AttendanceStatus.ApprovedByAM, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
      fetchAttendances();
      Alert.alert('Success', 'Attendance approved by Area Manager.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const renderAttendance = ({ item }: { item: any }) => {
  const status = item.taskAttendanceStatus || '';
  const statusTone = getToneForAttendanceStatus(status) as any;
    const outletName = (() => { const outlet = outlets.find(o => o.id === item.outletId); return outlet?.outletName || item.outletId || '-'; })();
    const isExpanded = !!expanded[item.id];
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { shadowOpacity: 0 } : undefined]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{outletName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <StatusPill label={status} tone={statusTone as any} />
          </View>
        </View>
        <Text style={[styles.meta, { color: colors.muted }]}>BA: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToBA || '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>TL: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToTL || '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>Check-in: <Text style={[styles.metaValue, { color: colors.text }]}>{item.checkIn?.toDate ? item.checkIn.toDate().toLocaleString() : '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>Check-out: <Text style={[styles.metaValue, { color: colors.text }]}>{item.checkOut?.toDate ? item.checkOut.toDate().toLocaleString() : '-'}</Text></Text>
        <Text style={[styles.meta, { color: colors.muted }]}>Created: <Text style={[styles.metaValue, { color: colors.text }]}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text></Text>
        {item.selfieUrl ? <Image source={{ uri: item.selfieUrl }} style={styles.thumbnail} /> : <Text style={[styles.meta, { color: colors.muted }]}>No Selfie</Text>}
        {isExpanded && (
          <View style={{ marginTop: spacing(3) }}>
            <Text style={[styles.meta, { color: colors.muted }]}>Check-in Lat: <Text style={[styles.metaValue, { color: colors.text }]}>{item.checkInLatitude || '-'}</Text></Text>
            <Text style={[styles.meta, { color: colors.muted }]}>Check-in Lng: <Text style={[styles.metaValue, { color: colors.text }]}>{item.checkInLongitude || '-'}</Text></Text>
            <Text style={[styles.meta, { color: colors.muted }]}>Check-out Lat: <Text style={[styles.metaValue, { color: colors.text }]}>{item.checkOutLatitude || '-'}</Text></Text>
            <Text style={[styles.meta, { color: colors.muted }]}>Check-out Lng: <Text style={[styles.metaValue, { color: colors.text }]}>{item.checkOutLongitude || '-'}</Text></Text>
          </View>
        )}
        {canReadUpdate && (
          <View style={styles.actionsRow}>
            {userRole === Roles.IrisBA && !item.checkIn && (
              <PrimaryButton title="Check In" onPress={async () => {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission denied', 'Permission to access location was denied');
                return;
              }
              let location = await Location.getCurrentPositionAsync({});
              Alert.alert("Confirm Check-In", "Are you sure you want to check in now?", [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: async () => {
                  try {
                    const attendanceDoc = doc(db, "task_attendance", item.id);
                    await updateDoc(attendanceDoc, {
                      checkIn: new Date(),
                      checkInLatitude: location.coords.latitude.toString(),
                      checkInLongitude: location.coords.longitude.toString(),
                    });
                    fetchAttendances();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to check in.');
                  }
                }}
              ]);
              }} style={styles.actionBtn} />
            )}
            {userRole === Roles.IrisBA && item.checkIn && !item.checkOut && (
              <PrimaryButton title="Check Out" onPress={async () => {
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission denied', 'Permission to access location was denied');
                return;
              }
              let location = await Location.getCurrentPositionAsync({});
              Alert.alert("Confirm Check-Out", "Are you sure you want to check out now?", [
                { text: "Cancel", style: "cancel" },
                { text: "OK", onPress: async () => {
                  try {
                    const attendanceDoc = doc(db, "task_attendance", item.id);
                    await updateDoc(attendanceDoc, {
                      checkOut: new Date(),
                      checkOutLatitude: location.coords.latitude.toString(),
                      checkOutLongitude: location.coords.longitude.toString(),
                    });
                    fetchAttendances();
                  } catch (error) {
                    Alert.alert('Error', 'Failed to check out.');
                  }
                }}
              ]);
              }} style={styles.actionBtn} />
            )}
            {userRole === Roles.IrisBA && (!item.selfieUrl || item.selfieUrl === '') && (
              <SecondaryButton title="Selfie" onPress={async () => {
              try {
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
                if (!auth.currentUser) {
                  Alert.alert("Authentication Error", "You must be logged in to upload images.");
                  return;
                }
                const response = await fetch(uri);
                const blob = await response.blob();
                const storageRef = ref(storage, `task_attendance/${auth.currentUser.uid}/${new Date().getTime()}.jpg`);
                const snapshot = await uploadBytes(storageRef, blob);
                const downloadURL = await getDownloadURL(snapshot.ref);
                const attendanceDoc = doc(db, "task_attendance", item.id);
                await updateDoc(attendanceDoc, { selfieUrl: downloadURL });
                fetchAttendances();
                Alert.alert("Success", "Selfie uploaded and saved.");
              } catch (error) {
                Alert.alert("Upload Failed", `An error occurred. Check the console for more details.`);
              }
              }} style={styles.actionBtn} />
            )}
            {userRole === Roles.IrisTL && stateMachine.canTransition('Attendance', Roles.IrisTL, status || AttendanceStatus.Pending, AttendanceStatus.ApprovedByTL) && (
              <PrimaryButton title="Approve TL" onPress={() => handleApproveByTL(item.id)} style={styles.actionBtn} />
            )}
            {userRole === Roles.AreaManager && stateMachine.canTransition('Attendance', Roles.AreaManager, status || AttendanceStatus.Empty, AttendanceStatus.ApprovedByAM) && (
              <PrimaryButton title="Approve AM" onPress={() => handleApproveByAM(item.id)} style={styles.actionBtn} />
            )}
      <View style={styles.iconActions}>
              <TouchableOpacity
                onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
        style={[styles.iconButton, isDark ? { backgroundColor: '#1f2937' } : {}]}
                accessibilityLabel={isExpanded ? 'Collapse row' : 'Expand row'}
              >
                <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={20} color={scheme === 'dark' ? '#9CA3AF' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setDetailsItem(item); setDetailsVisible(true); }}
        style={[styles.iconButton, isDark ? { backgroundColor: '#1f2937' } : {}]}
                accessibilityLabel="Open details"
              >
        <Ionicons name="newspaper-outline" size={20} color={isDark ? '#60A5FA' : '#007AFF'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

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
      {/* Check-in info (now only display, not button) */}
      {formData.checkIn && (
        <View style={styles.checkInOutContainer}>
          <Text>{formData.checkIn.toLocaleString()}</Text>
        </View>
      )}
      {formData.checkInLatitude && <Text>Check-in Location: {formData.checkInLatitude}, {formData.checkInLongitude}</Text>}
      {/* Check-out info (now only display, not button) */}
      {formData.checkOut && (
        <View style={styles.checkInOutContainer}>
          <Text>{formData.checkOut.toLocaleString()}</Text>
        </View>
      )}
      {formData.checkOutLatitude && <Text>Check-out Location: {formData.checkOutLatitude}, {formData.checkOutLongitude}</Text>}
      {formData.selfieUrl ? <Image source={{ uri: formData.selfieUrl }} style={styles.selfieImage} /> : null}
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.body }]}>
      <FilterHeader
        title={t('attendance')}
        search={search}
        status={statusFilter}
        statusOptions={ATTENDANCE_STATUS_OPTIONS}
        placeholder={t('search_outlet_or_id')}
        storageKey="filters:attendance"
  sortAsc={sortAsc}
  onToggleSort={() => setSortAsc(prev => !prev)}
        onApply={({ search: s, status }) => { setSearch(s); setStatusFilter(status); }}
        onClear={() => { setSearch(''); setStatusFilter(''); }}
      />
      {filteredAttendances.length === 0 ? (
        <EmptyState onReset={() => { setSearch(''); setStatusFilter(''); }} />
      ) : (
      <FlatList
        data={filteredAttendances}
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
      />)}
      <TaskAttendanceDetailsModal
        visible={detailsVisible}
        item={detailsItem}
        onCopyAll={detailsItem ? async () => { await Clipboard.setStringAsync(buildTaskAttendanceText(detailsItem, 'text')); Alert.alert('Copied to clipboard'); } : undefined}
        onClose={() => setDetailsVisible(false)}
      />
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('add')} {t('attendance')}</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <PrimaryButton title={t('add')} onPress={handleAddAttendance} />
              <SecondaryButton title={t('cancel')} onPress={() => { setIsAddModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { borderWidth: 1 } : {}]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('edit')} {t('attendance')}</Text>
            {renderModalFields()}
            {(userRole === Roles.Admin || userRole === Roles.Superadmin) && selectedAttendance && (
              <View style={{ marginBottom: spacing(4) }}>
                <Text style={[styles.input, { color: colors.text, borderColor: 'transparent', backgroundColor: 'transparent' }]}>Admin: Next Status</Text>
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}>
                  <Picker
                    selectedValue={adminNextStatus}
                    onValueChange={(v) => setAdminNextStatus(String(v))}
                  >
                    <Picker.Item label="(no change)" value="" />
                    {stateMachine
                      .nextOptionsForRole('Attendance', (userRole as any) || '', (selectedAttendance?.taskAttendanceStatus || '') as any)
                      .map(opt => (
                        <Picker.Item key={opt} label={opt} value={opt} />
                      ))}
                  </Picker>
                </View>
              </View>
            )}
            <View style={styles.buttonContainer}>
              <PrimaryButton title={t('update')} onPress={handleUpdateAttendance} />
              <SecondaryButton title={t('cancel')} onPress={() => { setIsEditModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(5) },
  screenTitle: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 15, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  meta: { fontSize: 12, color: palette.textMuted, marginBottom: 2 },
  metaValue: { color: palette.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(4) },
  actionBtn: { flexGrow: 1, marginRight: spacing(3), marginBottom: spacing(3) },
  iconActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginLeft: 8 },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: palette.surface, padding: spacing(6), borderRadius: radius.lg },
  input: { height: 40, borderColor: palette.border, borderWidth: 1, marginBottom: spacing(4), padding: spacing(3), borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  multiLineInput: { minHeight: 40, maxHeight: 80, textAlignVertical: 'top' },
  checkInOutContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4), paddingHorizontal: spacing(3) },
  selfieImage: { width: 100, height: 100, alignSelf: 'center', marginVertical: spacing(4), borderRadius: radius.md },
  thumbnail: { width: 60, height: 60, borderRadius: radius.md, marginTop: spacing(3) }
  ,title: { ...typography.h2, color: palette.text, textAlign: 'center', marginBottom: spacing(4) }
  ,buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing(4) }
});
