// === SAVE POINT: 2024-06-13 ===
// You can undo to this version if any crash happens today.

import { useState, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Image, Platform, RefreshControl, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { db, auth, storage } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, Timestamp, onSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { pickImage } from '@/components/utils/pickImage';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import TaskAttendanceDetailsModal, { buildTaskAttendanceText } from '@/components/TaskAttendanceDetailsModal';
import * as Clipboard from 'expo-clipboard';
import { Roles, isBAish, isTLish } from '../../constants/roles';
import { AttendanceStatus, getToneForAttendanceStatus, ATTENDANCE_STATUS_OPTIONS } from '../../constants/status';
import stateMachine from '../../constants/stateMachine';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';
import { useAppSettings } from '@/components/AppSettings';

export default function TaskAttendanceScreen() {
  // Cross-platform confirm helper: on web use window.confirm so OK button actually triggers
  const confirmAsync = async (title: string, message: string): Promise<boolean> => {
    if (Platform.OS === 'web') {
      try {
        return Promise.resolve(window.confirm(`${title}\n\n${message}`));
      } catch {
        // Fallback to simple alert without cancel
        window.alert(`${title}\n\n${message}`);
        return true;
      }
    }
    return new Promise<boolean>((resolve) => {
      Alert.alert(title, message, [
        { text: t('cancel') || 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: t('ok') || 'OK', onPress: () => resolve(true) },
      ]);
    });
  };

  const params = useLocalSearchParams<{ attendanceId?: string }>();
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
  // Per-item loading states to avoid double taps and race conditions
  const [loadingById, setLoadingById] = useState<Record<string, { checkIn?: boolean; checkOut?: boolean; selfie?: boolean }>>({});
  // Inline error messages per item (e.g., permission-denied) for quick diagnosis
  const [lastErrorById, setLastErrorById] = useState<Record<string, string | undefined>>({});
  // Cache of userId -> display name for showing BA/TL names
  const [userNames, setUserNames] = useState<Record<string, string>>({});
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
  const { debugHeaderEnabled } = useAppSettings();

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
  const navigation: any = useNavigation();
  // Real-time subscription to attendance records with role-based filtering
  useEffect(() => {
    if (!userRole || !isFocused) return;
    const uid = auth.currentUser?.uid;
    let colRef = collection(db, 'task_attendance');
    let qRef: any = colRef;
    if (isBAish(userRole as any)) {
      if (!uid) { setAttendances([]); return; }
      qRef = query(colRef, where('assignedToBA', '==', uid));
    } else if (isTLish(userRole as any)) {
      if (!uid) { setAttendances([]); return; }
      qRef = query(colRef, where('assignedToTL', '==', uid));
    }
    setLoading(true);
    const unsub = onSnapshot(qRef, (snap: any) => {
      let list = snap.docs.map((d: any) => {
        const data = d.data();
        return { id: d.id, assignedToBA: (data as any).assignedToBA, createdAt: (data as any).createdAt, ...data } as any;
      });
      list.sort((a: any, b: any) => {
        let aTime = 0, bTime = 0;
        if (a.createdAt && typeof a.createdAt.toDate === 'function') aTime = a.createdAt.toDate().getTime();
        if (b.createdAt && typeof b.createdAt.toDate === 'function') bTime = b.createdAt.toDate().getTime();
        return sortAsc ? (aTime - bTime) : (bTime - aTime);
      });
      setAttendances(list);
      // Preload BA/TL display names for this page
      try {
        const uids: string[] = Array.from(new Set(list.flatMap((it: any) => [it.assignedToBA, it.assignedToTL]).filter(Boolean)));
        const missing = uids.filter(uid => !!uid && !userNames[uid]);
        if (missing.length) {
          (async () => {
            const entries: Record<string, string> = {};
            for (const uid of missing) {
              try {
                const uSnap = await getDoc(doc(db, 'users', uid));
                if (uSnap.exists()) {
                  const u = uSnap.data() as any;
                  const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || u?.phone || uid;
                  entries[uid] = name;
                } else {
                  entries[uid] = uid;
                }
              } catch {
                entries[uid] = uid;
              }
            }
            setUserNames(prev => ({ ...prev, ...entries }));
          })();
        }
      } catch {}
      setLoading(false);
    }, (err: any) => {
      console.error('onSnapshot attendance error', err);
      setLoading(false);
    });
    return () => unsub();
  }, [userRole, isFocused, sortAsc]);

  // Temporary DBG header label (center, toggleable)
  useEffect(() => {
    if (!debugHeaderEnabled) {
      navigation.setOptions?.({ headerTitle: undefined });
      return;
    }
    const uid = auth.currentUser?.uid || '';
    const shortUid = uid ? `${uid.slice(0,4)}…${uid.slice(-4)}` : '—';
    const resolveUser = (u?: string) => (u ? (userNames[u] || u) : '—');
    const ba = detailsVisible && detailsItem ? resolveUser(detailsItem.assignedToBA) : undefined;
    const tl = detailsVisible && detailsItem ? resolveUser(detailsItem.assignedToTL) : undefined;
    const label = `role:${userRole || '—'} | uid:${shortUid}` + (ba || tl ? ` | BA:${ba || '—'} | TL:${tl || '—'}` : '');
    navigation.setOptions?.({
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Text style={{ color: '#ef4444', fontSize: 10 }} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      ),
    });
  }, [userRole, auth.currentUser?.uid, detailsVisible, detailsItem, userNames, debugHeaderEnabled]);

  // Auto-open details when navigated with an attendanceId (AM review)
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    const shouldOpen = !!params?.attendanceId && !!userRole && isFocused && !autoOpened;
    if (!shouldOpen) return;
    (async () => {
      try {
        const id = String(params.attendanceId);
        const snap = await getDoc(doc(db, 'task_attendance', id));
        if (snap.exists()) {
          setDetailsItem({ id: snap.id, ...snap.data() });
          setDetailsVisible(true);
        }
      } catch {}
      setAutoOpened(true);
    })();
  }, [params?.attendanceId, userRole, isFocused, autoOpened]);

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
      Alert.alert(t('error') || 'Error', t('failed_to_fetch_attendances') || 'Failed to fetch attendances.');
    } finally {
      setLoading(false);
    }
  };

  // Cross-platform geolocation helper: uses navigator.geolocation on web
  const getCurrentCoords = async (): Promise<{ latitude: number; longitude: number }> => {
    if (Platform.OS === 'web') {
      if (!('geolocation' in navigator)) throw new Error('Geolocation not available');
      return await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error(t('location_permission_denied') || 'Permission to access location was denied');
    const loc = await Location.getCurrentPositionAsync({});
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
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
      Alert.alert(t('add_failed') || 'Add Failed', error.message);
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

      Alert.alert(t('success') || 'Success', t('attendance_updated') || 'Attendance record updated successfully.');
      setIsEditModalVisible(false);
      fetchAttendances(); // Refresh the list
    } catch (error: any) {
      Alert.alert(t('update_failed') || 'Update Failed', error.message);
    }
  };
  
  const confirmCheckIn = async () => {
    let location: { coords: { latitude: number; longitude: number } };
    if (Platform.OS === 'web') {
      if (!('geolocation' in navigator)) {
        Alert.alert(t('permission_denied') || 'Permission denied', 'Geolocation not available in this browser.');
        return;
      }
      try {
        location = await new Promise<any>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      } catch (e: any) {
        Alert.alert(t('permission_denied') || 'Permission denied', e?.message || 'Unable to access location.');
        return;
      }
    } else {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_denied') || 'Permission denied', t('location_permission_denied') || 'Permission to access location was denied');
        return;
      }
      location = await Location.getCurrentPositionAsync({});
    }
    
    Alert.alert(t('confirm_check_in') || 'Confirm Check-In', t('confirm_check_in_msg') || 'Are you sure you want to check in now?', [
        { text: t('cancel') || 'Cancel', style: "cancel" },
        { text: t('ok') || 'OK', onPress: () => setFormData({
            ...formData, 
            checkIn: new Date(),
            checkInLatitude: location.coords.latitude.toString(),
            checkInLongitude: location.coords.longitude.toString(),
        }) }
    ]);
  };

  const confirmCheckOut = async () => {
    let location: { coords: { latitude: number; longitude: number } };
    if (Platform.OS === 'web') {
      if (!('geolocation' in navigator)) {
        Alert.alert(t('permission_denied') || 'Permission denied', 'Geolocation not available in this browser.');
        return;
      }
      try {
        location = await new Promise<any>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      } catch (e: any) {
        Alert.alert(t('permission_denied') || 'Permission denied', e?.message || 'Unable to access location.');
        return;
      }
    } else {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_denied') || 'Permission denied', t('location_permission_denied') || 'Permission to access location was denied');
        return;
      }
      location = await Location.getCurrentPositionAsync({});
    }

    Alert.alert(t('confirm_check_out') || 'Confirm Check-Out', t('confirm_check_out_msg') || 'Are you sure you want to check out now?', [
        { text: t('cancel') || 'Cancel', style: "cancel" },
        { text: t('ok') || 'OK', onPress: () => setFormData({
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
  const result2 = await pickImage();
  if (result2.canceled || !result2.uri) {
        Alert.alert(t('cancelled') || 'Cancelled', t('image_selection_cancelled') || 'Image selection was cancelled.');
        return;
      }

  const uri = result2.uri;
  const pickedFile = (result2 as any).file as File | undefined;
  // Debug note retained intentionally: image picked
      // Do NOT set selfieUrl to cache URI here

      // 2. Upload to Firebase
      if (!auth.currentUser) {
        Alert.alert(t('authentication_error') || 'Authentication Error', t('must_be_logged_in_to_upload_images') || 'You must be logged in to upload images.');
        return;
      }
      // Debug note retained intentionally: starting upload
      let blob: Blob;
      if (Platform.OS === 'web' && pickedFile) {
        blob = pickedFile; // use original File to preserve type and avoid revoke timing issues
      } else {
        const response = await fetch(uri);
        blob = await response.blob();
      }
      // Debug note retained intentionally: blob created

      const storageRef = ref(storage, `task_attendance/${auth.currentUser.uid}/${new Date().getTime()}.jpg`);
      const metadata = (Platform.OS === 'web' && pickedFile) ? { contentType: pickedFile.type || 'image/jpeg' } : undefined;
      const snapshot = await uploadBytes(storageRef, blob, metadata as any);
      // Debug note retained intentionally: upload complete

      const downloadURL = await getDownloadURL(snapshot.ref);
      // Debug note retained intentionally: url retrieved

      // 3. Update form state with the final URL
      setFormData(prev => ({ ...prev, selfieUrl: downloadURL }));

      // 4. If editing, update Firestore immediately
      if (selectedAttendance) {
        const attendanceDoc = doc(db, "task_attendance", selectedAttendance.id);
        await updateDoc(attendanceDoc, { selfieUrl: downloadURL });
        fetchAttendances();
        Alert.alert(
          t('success') || 'Success',
          `${t('photo_uploaded_success') || 'Selfie uploaded and saved.'}\n\n${t('selfie_post_upload_warning') || 'Please ensure your face is clearly visible. If needed, re-upload before approval.'}`
        );
      }
    } catch (error: any) {
      console.error("CRITICAL ERROR during image pick and upload: ", error);
      Alert.alert(t('upload_failed') || 'Upload Failed', `An error occurred: ${error?.message || String(error)}. Check the console for more details.`);
    }
  };

  const handleDeleteAttendance = (attendanceId: string) => {
    Alert.alert(t('delete_attendance') || 'Delete Attendance', t('confirm_delete_attendance') || 'Are you sure you want to delete this record?', [
      { text: t('cancel') || 'Cancel', style: "cancel" },
      { text: t('ok') || 'OK', onPress: () => {
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
  Alert.alert(t('success') || 'Success', t('attendance_approved_by_tl') || 'Attendance approved by TL.');
    } catch (error: any) {
  Alert.alert(t('error') || 'Error', error.message);
    }
  };

  const handleApproveByAM = async (attendanceId: string) => {
    try {
      const attendanceDoc = doc(db, "task_attendance", attendanceId);
  await updateDoc(attendanceDoc, { taskAttendanceStatus: AttendanceStatus.ApprovedByAM, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
  fetchAttendances();
  Alert.alert(t('success') || 'Success', t('attendance_approved_by_am') || 'Attendance approved by Area Manager.');
    } catch (error: any) {
  Alert.alert(t('error') || 'Error', error.message);
    }
  };

  const renderAttendance = ({ item }: { item: any }) => {
  const status = item.taskAttendanceStatus || '';
  const statusTone = getToneForAttendanceStatus(status) as any;
  const currentUid = auth.currentUser?.uid;
  const isOwnerBA = !!currentUid && item.assignedToBA === currentUid;
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
  <Text style={[styles.meta, { color: colors.muted }]}>BA: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToBA ? (userNames[item.assignedToBA] || item.assignedToBA) : '-'}</Text></Text>
  <Text style={[styles.meta, { color: colors.muted }]}>TL: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToTL ? (userNames[item.assignedToTL] || item.assignedToTL) : '-'}</Text></Text>
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
      {userRole === Roles.IrisBA && isOwnerBA && !item.checkIn && (
              <PrimaryButton
                title="Check In"
                loading={!!loadingById[item.id]?.checkIn}
                onPress={async () => {
                  // Confirm first to avoid popup blockers, then request geolocation
                  const proceed = await confirmAsync('Confirm Check-In', 'Are you sure you want to check in now?');
                  if (!proceed) return;
                  setLoadingById(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), checkIn: true } }));
                  try {
                    const coords = await getCurrentCoords();
                    const attendanceDoc = doc(db, "task_attendance", item.id);
                    await updateDoc(attendanceDoc, {
                      checkIn: serverTimestamp(),
                      checkInLatitude: Number(coords.latitude),
                      checkInLongitude: Number(coords.longitude),
                      ...(String(item.taskAttendanceStatus || '') === '' ? { taskAttendanceStatus: AttendanceStatus.Pending } : {}),
                      updatedAt: serverTimestamp(),
                      updatedBy: auth.currentUser?.uid || 'unknown',
                    });
                    console.info('[Attendance] Check-in success', { id: item.id, role: userRole });
                    // Realtime listener will update UI
                  } catch (error: any) {
        console.error('Check-in failed', error);
        const msg = `${error?.code || 'unknown'}: ${error?.message || 'Failed to check in.'}`;
        setLastErrorById(prev => ({ ...prev, [item.id]: msg }));
        Alert.alert('Error', msg);
                  } finally {
                    setLoadingById(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), checkIn: false } }));
                  }
                }}
                style={styles.actionBtn}
              />
            )}
      {userRole === Roles.IrisBA && isOwnerBA && item.checkIn && !item.checkOut && (
              <PrimaryButton
                title="Check Out"
                loading={!!loadingById[item.id]?.checkOut}
                onPress={async () => {
                  const proceed = await confirmAsync('Confirm Check-Out', 'Are you sure you want to check out now?');
                  if (!proceed) return;
                  setLoadingById(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), checkOut: true } }));
                  try {
                    const coords = await getCurrentCoords();
                    const attendanceDoc = doc(db, "task_attendance", item.id);
                    await updateDoc(attendanceDoc, {
                      checkOut: serverTimestamp(),
                      checkOutLatitude: Number(coords.latitude),
                      checkOutLongitude: Number(coords.longitude),
                      updatedAt: serverTimestamp(),
                      updatedBy: auth.currentUser?.uid || 'unknown',
                    });
                    console.info('[Attendance] Check-out success', { id: item.id, role: userRole });
                    // Realtime listener will update UI
                  } catch (error: any) {
        console.error('Check-out failed', error);
        const msg = `${error?.code || 'unknown'}: ${error?.message || 'Failed to check out.'}`;
        setLastErrorById(prev => ({ ...prev, [item.id]: msg }));
        Alert.alert('Error', msg);
                  } finally {
                    setLoadingById(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), checkOut: false } }));
                  }
                }}
                style={styles.actionBtn}
              />
            )}
      {userRole === Roles.IrisBA && isOwnerBA && (!item.selfieUrl || item.selfieUrl === '') && (
              <SecondaryButton
                title="Selfie"
                loading={!!loadingById[item.id]?.selfie}
                onPress={async () => {
                  setLoadingById(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), selfie: true } }));
                  try {
                    const result2 = await pickImage();
                    if (result2.canceled || !result2.uri) {
                      return; // silent cancel
                    }
                    const uri = result2.uri;
                    if (!auth.currentUser) {
                      Alert.alert("Authentication Error", "You must be logged in to upload images.");
                      return;
                    }
                    let blob: Blob;
                    const pickedFile = (result2 as any).file as File | undefined;
                    if (Platform.OS === 'web' && pickedFile) {
                      blob = pickedFile;
                    } else {
                      const response = await fetch(uri);
                      blob = await response.blob();
                    }
                    const storageRef = ref(storage, `task_attendance/${auth.currentUser.uid}/${new Date().getTime()}.jpg`);
                    const metadata = (Platform.OS === 'web' && pickedFile) ? { contentType: pickedFile.type || 'image/jpeg' } : undefined;
                    const snapshot = await uploadBytes(storageRef, blob, metadata as any);
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    const attendanceDoc = doc(db, "task_attendance", item.id);
                    await updateDoc(attendanceDoc, {
                      selfieUrl: downloadURL,
                      ...(String(item.taskAttendanceStatus || '') === '' ? { taskAttendanceStatus: AttendanceStatus.Pending } : {}),
                      updatedAt: serverTimestamp(),
                      updatedBy: auth.currentUser?.uid || 'unknown',
                    });
                    console.info('[Attendance] Selfie upload success', { id: item.id, role: userRole });
                    // Realtime listener will update UI
                    Alert.alert(
                      t('success') || 'Success',
                      `${t('photo_uploaded_success') || 'Selfie uploaded and saved.'}\n\n${t('selfie_post_upload_warning') || 'Please ensure your face is clearly visible. If needed, re-upload before approval.'}`
                    );
                  } catch (error: any) {
                    console.error('Selfie upload failed', error);
                    const msg = `${error?.code || 'unknown'}: ${error?.message || 'An error occurred. Check the console for more details.'}`;
                    setLastErrorById(prev => ({ ...prev, [item.id]: msg }));
                    Alert.alert("Upload Failed", msg);
                  } finally {
                    setLoadingById(prev => ({ ...prev, [item.id]: { ...(prev[item.id] || {}), selfie: false } }));
                  }
                }}
                style={styles.actionBtn}
              />
            )}
            {!isOwnerBA && userRole === Roles.IrisBA && (
              <Text style={[styles.meta, { color: '#dc2626', width: '100%' }]}>Not assigned to you</Text>
            )}
            {!!lastErrorById[item.id] && (
              <Text style={[styles.meta, { color: '#dc2626', width: '100%' }]}>{lastErrorById[item.id]}</Text>
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
        userNames={userNames}
        outlets={outlets}
        onCopyAll={detailsItem ? async () => { await Clipboard.setStringAsync(buildTaskAttendanceText(detailsItem, 'text', { userNames, outlets })); Alert.alert(t('copied_to_clipboard')); } : undefined}
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
        <Text style={[styles.input, { color: colors.text, borderColor: 'transparent', backgroundColor: 'transparent' }]}>{t('admin_next_status')}</Text>
                <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }}>
                  <Picker
                    selectedValue={adminNextStatus}
                    onValueChange={(v) => setAdminNextStatus(String(v))}
                  >
          <Picker.Item label={t('no_change')} value="" />
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
