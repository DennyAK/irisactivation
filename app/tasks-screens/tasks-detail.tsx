// --- Imports ---
// React hooks, UI components, Firebase config, Firestore functions, Auth, Picker, DateTimePicker
import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Animated } from 'react-native';
// Ionicons removed (unused)
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Platform, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, writeBatch } from 'firebase/firestore';
import { query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

// --- Styles ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(5) },
  title: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
  itemContainer: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  itemTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing(2), color: palette.text },
  modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: spacing(6) },
  modalContent: { width: '95%', backgroundColor: palette.surface, padding: spacing(6), borderRadius: radius.lg },
  input: { height: 44, borderColor: palette.border, borderWidth: 1, marginBottom: spacing(4), paddingHorizontal: spacing(3), borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
  buttonContainer: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: spacing(4), marginBottom: spacing(2), flexWrap: 'wrap' },
  actionBtn: { marginRight: spacing(3), marginBottom: spacing(3), flexGrow: 1, minWidth: 120 },
});

// Animated TouchableOpacity for blinking effect
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// --- Main Component ---
export default function TasksScreen() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  type TaskItem = {
    id: string;
    assignedToUserBA?: string;
    assignedToUserTLID?: string;
    createdAt?: any;
    outletId?: string;
    // add other relevant fields as needed
    [key: string]: any;
  };
  // --- Animated blinking for action buttons ---
  const blinkAnim = useState(new Animated.Value(0))[0];
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [blinkAnim]);
  const router = useRouter();
  const navigation = useNavigation();
  // State for editing task attendance
  const [isEditAttendanceModalVisible, setIsEditAttendanceModalVisible] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState<any>(null);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);

  // Fetch attendance document by ID
  const fetchAttendanceById = async (attendanceId: string) => {
    try {
      const docRef = doc(db, 'task_attendance', attendanceId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAttendanceForm({ id: docSnap.id, ...docSnap.data() });
        setEditingAttendanceId(attendanceId);
        setIsEditAttendanceModalVisible(true);
      } else {
        Alert.alert('Error', 'Attendance document not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch attendance document.');
    }
  };

  // Update attendance document
  const handleUpdateAttendance = async () => {
    if (editingAttendanceId && attendanceForm) {
      try {
        const docRef = doc(db, 'task_attendance', editingAttendanceId);
        await updateDoc(docRef, attendanceForm);
        setIsEditAttendanceModalVisible(false);
        setEditingAttendanceId(null);
        setAttendanceForm(null);
        fetchTasks();
      } catch (error) {
        Alert.alert('Error', 'Failed to update attendance.');
      }
    }
  };
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  // --- State Variables ---
  // tasks: List of all tasks fetched from Firestore
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  // outlets: List of outlets for dropdown selection
  const [outlets, setOutlets] = useState<any[]>([]);
  // loading: Controls loading spinner visibility
  const [loading, setLoading] = useState(true);
  // isAddModalVisible: Controls Add Task modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  // isEditModalVisible: Controls Edit Task modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  // Add after your modal state declarations
  const [isAddChildModalVisible, setIsAddChildModalVisible] = useState(false);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  // formData: Stores all form fields for add/edit
  const [formData, setFormData] = useState({
    outletId: '', // Selected outlet ID
    assignedToUserBA: '', // Selected BA user ID
    assignedToUserTLID: '', // Selected TL user ID
    startDate: new Date(), // Task start date
    remark: '', // Task remark
    // Task-specific fields
    task_attendance: 'No',
    taskAttendanceId: '',
    task_assesment: 'No',
    task_assesmentId: '',
    task_quick_quiz: 'No',
    task_quick_quizId: '',
    task_quick_sales_report: 'No',
    task_quick_sales_reportId: '',
    task_sales_report_detail: 'No',
    task_sales_report_detailId: '',
  });
  // baUsers: List of BA users for dropdown
  const [baUsers, setBAUsers] = useState<any[]>([]);
  // tlUsers: List of TL users for dropdown
  const [tlUsers, setTLUsers] = useState<any[]>([]);
  // showDatePicker: Controls date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  // selectedTask: Stores the task being edited
  const [selectedTask, setSelectedTask] = useState<any>(null);
  // userRole: Current user's role (admin, BA, TL, etc.)
  const [userRole, setUserRole] = useState<string | null>(null);
  // currentUserId: Current user's ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isFocused = useIsFocused();
  // Search-only filter for tasks list
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  // --- useEffect: Initial Data Fetch & Auth ---
  // Runs once on mount: sets up auth listener, fetches all needed data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          }
        });
      } else {
        setUserRole(null);
        setCurrentUserId(null);
      }
    });
    // Only fetch outlets, BA users, TL users on mount
    fetchOutlets();
    fetchBAUsers();
    fetchTLUsers();
    return () => unsubscribe();
  }, []);
  // Fetch tasks only after userRole and currentUserId are loaded
  useEffect(() => {
    if (userRole && currentUserId && isFocused) {
      fetchTasks();
    }
  }, [userRole, currentUserId, isFocused]);

  // --- Data Fetching Functions ---
  // Fetch all tasks from Firestore, attach outlet names
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const tasksCollection = collection(db, 'tasks');
      let taskSnapshot;
      // Use Firestore query for TL/BA roles to avoid permission errors
      if (userRole === 'Iris - TL' && currentUserId) {
        const q = query(tasksCollection, where('assignedToUserTLID', '==', currentUserId));
        taskSnapshot = await getDocs(q);
      } else if (userRole === 'Iris - BA' && currentUserId) {
        const q = query(tasksCollection, where('assignedToUserBA', '==', currentUserId));
        taskSnapshot = await getDocs(q);
      } else {
        // Managers and other roles: fetch all tasks
        taskSnapshot = await getDocs(tasksCollection);
      }
      let taskList = taskSnapshot.docs.map(doc => {
        const data = doc.data() || {};
        return { id: doc.id, assignedToUserBA: data.assignedToUserBA, assignedToUserTLID: data.assignedToUserTLID, createdAt: data.createdAt, outletId: data.outletId, ...data } as TaskItem;
      });

      // Sort by createdAt descending (newest first)
      taskList.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });

      // For each task, fetch the outlet name for display
      const tasksWithOutletNames = await Promise.all(taskList.map(async (task) => {
        let outletName = 'Unknown Outlet';
        let outletProvince = '';
        if (task.outletId) {
          try {
            const outletDocRef = doc(db, 'outlets', task.outletId);
            const outletDocSnap = await getDoc(outletDocRef);
            if (outletDocSnap.exists()) {
              outletName = outletDocSnap.data().outletName;
              outletProvince = outletDocSnap.data().province || '';
            }
          } catch (e) {
            console.error("Error fetching outlet name/province: ", e);
          }
        }
        return { ...task, outletName, outletProvince };
      }));

      setTasks(tasksWithOutletNames);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      Alert.alert("Error", "Failed to fetch tasks.");
    } finally {
      setLoading(false);
    }
  };
  const filteredTasks = ((): TaskItem[] => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(t => String(t.outletName || '').toLowerCase().includes(q) || String(t.id || '').toLowerCase().includes(q));
  })();

  // Fetch all outlets for dropdown
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

  // Fetch all BA users for dropdown
const fetchBAUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const baList = usersSnapshot.docs
      .map(doc => {
        const data = doc.data() as { role?: string; name?: string; email?: string };
        return { id: doc.id, role: data.role || '', name: data.name || '', email: data.email || '' };
      })
      .filter(user => user.role === 'Iris - BA');
    setBAUsers(baList);
  } catch (error) {
    console.error('Error fetching BA users:', error);
  }
};

// Fetch all TL users for dropdown
const fetchTLUsers = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const tlList = usersSnapshot.docs
      .map(doc => {
        const data = doc.data() as { role?: string; name?: string; email?: string };
        return { id: doc.id, role: data.role || '', name: data.name || '', email: data.email || '' };
      })
      .filter(user => user.role === 'Iris - TL');
    setTLUsers(tlList);
  } catch (error) {
    console.error('Error fetching TL users:', error);
  }
};

  // --- Utility: Reset Form Data ---
  // Clears the form fields to default values
  const resetFormData = () => {
    setFormData({
      outletId: '', assignedToUserBA: '', assignedToUserTLID: '',
      startDate: new Date(), remark: '',
      task_attendance: 'No',
      taskAttendanceId: '',
      task_assesment: 'No',
      task_assesmentId: '',
      task_quick_quiz: 'No',
      task_quick_quizId: '',
      task_quick_sales_report: 'No',
      task_quick_sales_reportId: '',
      task_sales_report_detail: 'No',
      task_sales_report_detailId: '',
    });
  };

  // --- CRUD Handlers ---
  // Step 1: Add a new task to Firestore, then show child modal
  const handleAddTask = async () => {
    if (!currentUserId) {
      Alert.alert("Error", "You must be logged in to add a task.");
      return;
    }
    if (!formData.assignedToUserBA || !formData.assignedToUserTLID) {
      Alert.alert("Required Fields", "Assigned to BA and Assigned to TL must be selected.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        ...formData,
        assignedBy: currentUserId,
        createdAt: serverTimestamp()
      });
      setNewTaskId(docRef.id);
      setIsAddModalVisible(false);
      setIsAddChildModalVisible(true);
    } catch (error: any) {
      Alert.alert("Add Failed", error.message);
    }
  };

  // Step 2: Add child documents for the new task (atomic via batch)
  const handleAddChildFeatures = async () => {
    if (!currentUserId) {
      Alert.alert('Error', 'Not authenticated');
      return;
    }
    if (!newTaskId) {
      Alert.alert('Error', 'Task reference missing');
      return;
    }
  try {
      const batch = writeBatch(db);
      const updatedFormData: any = { ...formData };

      // Prepare child docs and parent update in one batch
      if (formData.task_attendance === 'Yes' && !formData.taskAttendanceId) {
        const ref = doc(collection(db, 'task_attendance'));
        batch.set(ref, {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId,
          outletId: formData.outletId || '',
        });
        updatedFormData.taskAttendanceId = ref.id;
      }

      if (formData.task_assesment === 'Yes' && !formData.task_assesmentId) {
        const ref = doc(collection(db, 'task_early_assessment'));
        batch.set(ref, {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId,
          outletId: formData.outletId || '',
        });
        updatedFormData.task_assesmentId = ref.id;
      }

      if (formData.task_quick_quiz === 'Yes' && !formData.task_quick_quizId) {
        const ref = doc(collection(db, 'task_quick_quiz'));
        batch.set(ref, {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId,
        });
        updatedFormData.task_quick_quizId = ref.id;
      }

    if (formData.task_quick_sales_report === 'Yes' && !formData.task_quick_sales_reportId) {
        const ref = doc(collection(db, 'sales_report_quick'));
        // Minimal draft create; rules may allow this if they gate strict checks on submit
        batch.set(ref, {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId,
          outletId: formData.outletId || '',
          taskSalesReportQuickStatus: 'draft',
        });
        updatedFormData.task_quick_sales_reportId = ref.id;
      }

    if (formData.task_sales_report_detail === 'Yes' && !formData.task_sales_report_detailId) {
        const ref = doc(collection(db, 'sales_report_detail'));
        // Minimal draft create; rules may allow this if they gate strict checks on submit
        batch.set(ref, {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId,
          outletId: formData.outletId || '',
          salesReportDetailStatus: 'draft',
        });
        updatedFormData.task_sales_report_detailId = ref.id;
      }

      // Parent update
      const taskDocRef = doc(db, 'tasks', newTaskId);
      batch.update(taskDocRef, updatedFormData);

      await batch.commit();

      setIsAddChildModalVisible(false);
      setNewTaskId(null);
      resetFormData();
      fetchTasks();
    } catch (error: any) {
      // Fallback: try creating each child individually to identify which collection fails
      try {
        const results: Record<string, string | null> = {
          taskAttendanceId: null,
          task_assesmentId: null,
          task_quick_quizId: null,
          task_quick_sales_reportId: null,
          task_sales_report_detailId: null,
        };
        const failures: string[] = [];

        const create = async (col: string, data: any, key: keyof typeof results, label: string) => {
          try {
            const ref = await addDoc(collection(db, col), data);
            results[key as string] = ref.id;
          } catch (e: any) {
            failures.push(label);
          }
        };

        if (formData.task_attendance === 'Yes' && !formData.taskAttendanceId) {
          await create('task_attendance', {
            createdAt: serverTimestamp(),
            createdBy: currentUserId,
            assignedToBA: formData.assignedToUserBA,
            assignedToTL: formData.assignedToUserTLID,
            tasksId: newTaskId,
            outletId: formData.outletId || '',
          }, 'taskAttendanceId' as any, 'Attendance');
        }
        if (formData.task_assesment === 'Yes' && !formData.task_assesmentId) {
          await create('task_early_assessment', {
            createdAt: serverTimestamp(),
            createdBy: currentUserId,
            assignedToBA: formData.assignedToUserBA,
            assignedToTL: formData.assignedToUserTLID,
            tasksId: newTaskId,
            outletId: formData.outletId || '',
          }, 'task_assesmentId' as any, 'Early Assessment');
        }
        if (formData.task_quick_quiz === 'Yes' && !formData.task_quick_quizId) {
          await create('task_quick_quiz', {
            createdAt: serverTimestamp(),
            createdBy: currentUserId,
            assignedToBA: formData.assignedToUserBA,
            assignedToTL: formData.assignedToUserTLID,
            tasksId: newTaskId,
          }, 'task_quick_quizId' as any, 'Quick Quiz');
        }
        if (formData.task_quick_sales_report === 'Yes' && !formData.task_quick_sales_reportId) {
          // Try minimal draft first, then fallback to full payload if rules reject
          try {
            const ref = await addDoc(collection(db, 'sales_report_quick'), {
              createdAt: serverTimestamp(),
              createdBy: currentUserId,
              assignedToBA: formData.assignedToUserBA,
              assignedToTL: formData.assignedToUserTLID,
              tasksId: newTaskId,
              outletId: formData.outletId || '',
              taskSalesReportQuickStatus: 'draft',
            });
            results['task_quick_sales_reportId'] = ref.id;
          } catch (e) {
            try {
              const ref = await addDoc(collection(db, 'sales_report_quick'), {
                createdAt: serverTimestamp(),
                createdBy: currentUserId,
                assignedToBA: formData.assignedToUserBA,
                assignedToTL: formData.assignedToUserTLID,
                tasksId: newTaskId,
                outletId: formData.outletId || '',
                issuesNotesRequests: '',
                learningPoints: '',
                guinessPromoDescription: '',
                guinessSmoothPromoDescription: '',
                guinessSmoothPromoDescriptionType2: '',
                guinessGfesPromoDescription: '',
                guinessGfesPromoDescriptionType2: '',
                guinessKegsPromoDescription: '',
                guinessKegsPromoDescriptionType2: '',
                guinessMdPromoDescription: '',
                guinessMdPromoDescriptionType2: '',
                guinessGdicPromoDescription: '',
                guinessGdicPromoDescriptionType2: '',
                merchandiseDescription1: '',
                merchandiseDescription2: '',
                merchandiseDescription3: '',
                merchandiseDescription4: '',
                merchandiseDescription5: '',
                taskSalesReportQuickStatus: '',
              });
              results['task_quick_sales_reportId'] = ref.id;
            } catch (e2) {
              failures.push('Quick Sales Report');
            }
          }
        }
        if (formData.task_sales_report_detail === 'Yes' && !formData.task_sales_report_detailId) {
          // Try minimal draft first, then fallback to full payload if rules reject
          try {
            const ref = await addDoc(collection(db, 'sales_report_detail'), {
              createdAt: serverTimestamp(),
              createdBy: currentUserId,
              assignedToBA: formData.assignedToUserBA,
              assignedToTL: formData.assignedToUserTLID,
              tasksId: newTaskId,
              outletId: formData.outletId || '',
              salesReportDetailStatus: 'draft',
            });
            results['task_sales_report_detailId'] = ref.id;
          } catch (e) {
            try {
              const ref = await addDoc(collection(db, 'sales_report_detail'), {
                createdAt: serverTimestamp(),
                createdBy: currentUserId,
                assignedToBA: formData.assignedToUserBA,
                assignedToTL: formData.assignedToUserTLID,
                tasksId: newTaskId,
                outletId: formData.outletId || '',
                issuesNotesRequests: '',
                learningPoints: '',
                guinessPromoDescription: '',
                guinessSmoothPromoDescription: '',
                guinessSmoothPromoDescriptionType2: '',
                guinessGfesPromoDescription: '',
                guinessGfesPromoDescriptionType2: '',
                guinessKegsPromoDescription: '',
                guinessKegsPromoDescriptionType2: '',
                guinessMdPromoDescription: '',
                guinessMdPromoDescriptionType2: '',
                guinessGdicPromoDescription: '',
                guinessGdicPromoDescriptionType2: '',
                merchandiseDescription1: '',
                merchandiseDescription2: '',
                merchandiseDescription3: '',
                merchandiseDescription4: '',
                merchandiseDescription5: '',
                salesReportDetailStatus: '',
              });
              results['task_sales_report_detailId'] = ref.id;
            } catch (e2) {
              failures.push('Sales Report Detail');
            }
          }
        }

        const parentUpdate: any = { ...formData };
        Object.assign(parentUpdate, results);
        if (newTaskId) {
          await updateDoc(doc(db, 'tasks', newTaskId), parentUpdate);
        }

        const summary = failures.length
          ? `Some linked tasks failed due to permissions: ${failures.join(', ')}. Others were created successfully.`
          : 'All linked tasks created successfully.';
        Alert.alert('Save Result', summary);
        setIsAddChildModalVisible(false);
        setNewTaskId(null);
        resetFormData();
        fetchTasks();
      } catch (e2: any) {
        const msg = typeof e2?.message === 'string' ? e2.message : String(e2);
        Alert.alert('Error', msg.includes('PERMISSION') || msg.includes('permission') ? `Missing/insufficient permissions: ${msg}` : msg);
      }
    }
  };

  // Prepare to edit a task: fill form with selected task's data
  const handleEditTask = (task: any) => {
    setSelectedTask(task);
    setFormData({
      outletId: task.outletId || '',
      assignedToUserBA: task.assignedToUserBA || '',
      assignedToUserTLID: task.assignedToUserTLID || '',
      startDate: task.startDate?.toDate() || new Date(),
      remark: task.remark || '',
      task_attendance: task.task_attendance || 'No',
      taskAttendanceId: task.taskAttendanceId || '',
      task_assesment: task.task_assesment || 'No',
      task_assesmentId: task.task_assesmentId || '',
      task_quick_quiz: task.task_quick_quiz || 'No',
      task_quick_quizId: task.task_quick_quizId || '',
      task_quick_sales_report: task.task_quick_sales_report || 'No',
      task_quick_sales_reportId: task.task_quick_sales_reportId || '',
      task_sales_report_detail: task.task_sales_report_detail || 'No',
      task_sales_report_detailId: task.task_sales_report_detailId || '',
    });
    setIsEditModalVisible(true);
  };

  // Update an existing task in Firestore
  const handleUpdateTask = () => {
    if (!formData.assignedToUserBA || !formData.assignedToUserTLID) {
      Alert.alert("Required Fields", "Assigned to BA and Assigned to TL must be selected.");
      return;
    }
    if (selectedTask) {
      const taskDoc = doc(db, "tasks", selectedTask.id);
      updateDoc(taskDoc, {
        ...formData,
      }).then(() => {
        setIsEditModalVisible(false);
        resetFormData();
        setSelectedTask(null);
        fetchTasks();
      }).catch(error => {
        Alert.alert("Update Failed", error.message);
      });
    }
  };

  // Delete a task from Firestore (with confirmation)
  const handleDeleteTask = (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "tasks", taskId)).then(() => {
          fetchTasks();
        });
      }}
    ]);
  };

  // --- UI Rendering ---
  // Show loading spinner while fetching data
  if (loading) {
    return <ActivityIndicator style={{ marginTop: spacing(10) }} />;
  }

  // canManage: Only certain roles can add/edit/delete tasks
  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';

  // Subtask status tone helper
  const subtaskTone = (val: string, hasId: boolean) => {
    if (val === 'Yes' && hasId) return 'success';
    if (val === 'Yes' && !hasId) return 'warning';
    return 'neutral';
  };
  // Render a single task item in the list
  const renderTask = ({ item }: { item: any }) => (
    <View style={[styles.itemContainer, isDark && { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937' }]}>
      <Text style={[styles.itemTitle, isDark && { color: '#e5e7eb' }]}>Outlet: {item.outletName}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Province: {item.outletProvince || '-'}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Task Start Date: {item.startDate?.toDate().toLocaleDateString()}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Assigned to BA: {baUsers.find(u => u.id === item.assignedToUserBA)?.name || item.assignedToUserBA}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Assigned to TL: {tlUsers.find(u => u.id === item.assignedToUserTLID)?.name || item.assignedToUserTLID}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Assigned by: {item.assignedBy}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Created Time: {item.createdAt?.toDate().toLocaleString()}</Text>
      <Text style={[isDark && { color: '#e5e7eb' }]}>Remark: {item.remark}</Text>
      {[
        { key: 'task_attendance', id: item.taskAttendanceId, label: 'Attendance', route: 'task-attendance', param: 'attendanceId', button: 'Do Attendance' },
        { key: 'task_assesment', id: item.task_assesmentId, label: 'Assessment', route: 'task-early-assessment', param: 'assessmentId', button: 'Do Assessment' },
        { key: 'task_quick_quiz', id: item.task_quick_quizId, label: 'Quick Quiz', route: 'task-quick-quiz', param: 'quizId', button: 'Do Quick Quiz' },
        { key: 'task_quick_sales_report', id: item.task_quick_sales_reportId, label: 'Quick Sales', route: 'quick-sales-report', param: 'reportId', button: 'Do Quick Sales' },
        { key: 'task_sales_report_detail', id: item.task_sales_report_detailId, label: 'Sales Detail', route: 'sales-report-detail', param: 'detailId', button: 'Do Sales Detail' },
      ].map(sub => (
        <View key={sub.key} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(1.5) }}>
          <StatusPill label={`${sub.label}: ${item[sub.key]}`} tone={subtaskTone(item[sub.key], !!sub.id)} style={{ marginRight: spacing(2), maxWidth: '55%' }} />
          {sub.id && (
            <AnimatedTouchable
              style={{
                flexShrink: 1,
                paddingHorizontal: spacing(3),
                paddingVertical: spacing(1.5),
                backgroundColor: blinkAnim.interpolate({ inputRange: [0, 1], outputRange: ['#786a35', '#ffe066'] }),
                borderRadius: radius.sm,
                alignItems: 'center',
              }}
              onPress={() => (navigation as any).navigate(sub.route as any, { [sub.param]: sub.id })}
            >
              <Text style={{ fontSize: 11, color: '#fff', fontWeight: '600' }}>{sub.button}</Text>
            </AnimatedTouchable>
          )}
        </View>
      ))}
      {canManage && (
        <View style={styles.buttonContainer}>
          <PrimaryButton title={t('edit')} onPress={() => handleEditTask(item)} style={styles.actionBtn} />
          <SecondaryButton title={t('delete')} onPress={() => handleDeleteTask(item.id)} style={styles.actionBtn} />
        </View>
      )}
    </View>
  );
  // --- Date Picker Handler (move inside function body)
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.startDate;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData({ ...formData, startDate: currentDate });
  };

  // Render all fields for Add/Edit modals (dropdowns, text inputs, date picker)
  // Only show switches in child modal (step 2), not in add modal
  const renderAddTaskFields = () => (
    <>
      {/* Outlet dropdown */}
      <Picker
        selectedValue={formData.outletId}
        onValueChange={(itemValue) => setFormData({ ...formData, outletId: itemValue })}
      >
        <Picker.Item label={t('select_outlet') || 'Select an Outlet'} value="" />
        {outlets.map(outlet => (
          <Picker.Item key={outlet.id} label={outlet.outletName} value={outlet.id} />
        ))}
      </Picker>
      {/* Province display (read-only, based on selected outlet) */}
      <Text style={[styles.input, isDark && { backgroundColor: '#0f172a', color: '#e5e7eb', borderColor: '#1f2937' }] }>
        {t('province') || 'Province'}: {(() => {
          const selectedOutlet = outlets.find(o => o.id === formData.outletId);
          return selectedOutlet?.province || '-';
        })()}
      </Text>
      {/* Task Start Date below Outlet */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text style={[styles.input, isDark && { backgroundColor: '#0f172a', color: '#e5e7eb', borderColor: '#1f2937' }]}>
          {(t('task_start_date') || 'Task Start Date') + ': ' + formData.startDate.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={formData.startDate}
          mode="date"
          is24Hour={true}
          display="default"
          onChange={onDateChange}
        />
      )}
      {/* BA user dropdown */}
      <Picker
        selectedValue={String(formData.assignedToUserBA)}
        onValueChange={(itemValue) => setFormData({ ...formData, assignedToUserBA: String(itemValue) })}
      >
        <Picker.Item label={t('select_ba') || 'Select BA'} value="" />
        {baUsers.map(user => (
          <Picker.Item key={String(user.id)} label={user.name || user.email || String(user.id)} value={String(user.id)} />
        ))}
      </Picker>
      {/* TL user dropdown */}
      <Picker
        selectedValue={String(formData.assignedToUserTLID)}
        onValueChange={(itemValue) => setFormData({ ...formData, assignedToUserTLID: String(itemValue) })}
      >
        <Picker.Item label={t('select_tl') || 'Select TL'} value="" />
        {tlUsers.map(user => (
          <Picker.Item key={String(user.id)} label={user.name || user.email || String(user.id)} value={String(user.id)} />
        ))}
      </Picker>
      {/* Remark field */}
      <TextInput
        style={[styles.input, isDark && { backgroundColor: '#0f172a', color: '#e5e7eb', borderColor: '#1f2937' }]}
        value={formData.remark}
        onChangeText={(text) => setFormData({ ...formData, remark: text })}
        placeholder={t('remark') || 'Remark'}
        placeholderTextColor={isDark ? '#64748b' : undefined}
      />
    </>
  );

  // Step 2: switches for child features
  const renderAddChildFields = () => (
    <>
      {/* Task Attendance switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
  <Text style={[{ marginRight: 10 }, isDark && { color: '#e5e7eb' }]}>{t('attendance') || 'Task Attendance'}:</Text>
        <Switch
          value={formData.task_attendance === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_attendance: isChecked ? 'Yes' : 'No' });
          }}
        />
  <Text style={[{ marginLeft: 10 }, isDark && { color: '#e5e7eb' }]}>{formData.task_attendance === 'Yes' ? (t('yes') || 'Yes') : (t('no') || 'No')}</Text>
      </View>
      {/* Task Assessment switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
  <Text style={[{ marginRight: 10 }, isDark && { color: '#e5e7eb' }]}>{t('assessment') || 'Task Assessment'}:</Text>
        <Switch
          value={formData.task_assesment === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_assesment: isChecked ? 'Yes' : 'No' });
          }}
        />
  <Text style={[{ marginLeft: 10 }, isDark && { color: '#e5e7eb' }]}>{formData.task_assesment === 'Yes' ? (t('yes') || 'Yes') : (t('no') || 'No')}</Text>
      </View>
      {/* Task Quick Quiz switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
  <Text style={[{ marginRight: 10 }, isDark && { color: '#e5e7eb' }]}>{t('quick_quiz') || 'Task Quick Quiz'}:</Text>
        <Switch
          value={formData.task_quick_quiz === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_quick_quiz: isChecked ? 'Yes' : 'No' });
          }}
        />
  <Text style={[{ marginLeft: 10 }, isDark && { color: '#e5e7eb' }]}>{formData.task_quick_quiz === 'Yes' ? (t('yes') || 'Yes') : (t('no') || 'No')}</Text>
      </View>
      {/* Task Quick Sales Report switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
  <Text style={[{ marginRight: 10 }, isDark && { color: '#e5e7eb' }]}>{t('quick_sales_report') || 'Task Quick Sales Report'}:</Text>
        <Switch
          value={formData.task_quick_sales_report === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_quick_sales_report: isChecked ? 'Yes' : 'No' });
          }}
        />
  <Text style={[{ marginLeft: 10 }, isDark && { color: '#e5e7eb' }]}>{formData.task_quick_sales_report === 'Yes' ? (t('yes') || 'Yes') : (t('no') || 'No')}</Text>
      </View>
      {/* Task Sales Report Detail switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
  <Text style={[{ marginRight: 10 }, isDark && { color: '#e5e7eb' }]}>{t('sales_detail') || 'Task Sales Report Detail'}:</Text>
        <Switch
          value={formData.task_sales_report_detail === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_sales_report_detail: isChecked ? 'Yes' : 'No' });
          }}
        />
  <Text style={[{ marginLeft: 10 }, isDark && { color: '#e5e7eb' }]}>{formData.task_sales_report_detail === 'Yes' ? (t('yes') || 'Yes') : (t('no') || 'No')}</Text>
      </View>
    </>
  );

  // --- Main Render ---
  return (
    <View style={[styles.screen, isDark && { backgroundColor: '#0b1220' }]}>
      <FilterHeader
        title={t('task_management')}
        search={search}
        status={''}
        statusOptions={[{ label: 'All', value: '' }]}
        placeholder={t('search_outlet_or_task')}
        storageKey="filters:tasks"
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />
      {/* Add Task Button (only for managers) */}
  {canManage && <PrimaryButton title={`${t('add')} ${t('tasks')}`} onPress={() => setIsAddModalVisible(true)} style={{ marginBottom: spacing(5) }} />}
      {/* List of tasks */}
      {filteredTasks.length === 0 ? (
        <EmptyState onReset={() => setSearch('')} />
      ) : (
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchTasks();
              setRefreshing(false);
            }}
          />
        }
      />)}
      {/* Edit Attendance Modal */}
  <Modal visible={isEditAttendanceModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditAttendanceModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
      <View style={[styles.modalContent, isDark && { backgroundColor: '#111827' }]}>
    <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('edit')} {t('attendance')}</Text>
            {attendanceForm && (
              <>
                {/* Only allow editing remark field, as before */}
                <TextInput
      style={[styles.input, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937', color: '#e5e7eb' }]}
                  value={attendanceForm.remark || ''}
                  onChangeText={text => setAttendanceForm({ ...attendanceForm, remark: text })}
                  placeholder={t('remark')}
      placeholderTextColor={isDark ? '#64748b' : undefined}
                />
              </>
            )}
            <View style={styles.buttonContainer}>
              <PrimaryButton title={t('update')} onPress={handleUpdateAttendance} style={styles.actionBtn} />
              <SecondaryButton title={t('cancel')} onPress={() => { setIsEditAttendanceModalVisible(false); setAttendanceForm(null); setEditingAttendanceId(null); }} style={styles.actionBtn} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      {/* Step 1: Add Task Modal (main fields only) */}
  <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <View style={[styles.modalContent, isDark && { backgroundColor: '#111827' }]}>
      <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('add')} {t('tasks')}</Text>
              {renderAddTaskFields()}
              <View style={styles.buttonContainer}>
                <PrimaryButton title={t('next') || 'Next'} onPress={handleAddTask} style={styles.actionBtn} />
                <SecondaryButton title={t('cancel')} onPress={() => { setIsAddModalVisible(false); resetFormData(); }} style={styles.actionBtn} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Step 2: Add Child Features Modal (switches only) */}
  <Modal visible={isAddChildModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddChildModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <View style={[styles.modalContent, isDark && { backgroundColor: '#111827' }]}>
      <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('add')} Features</Text>
              {renderAddChildFields()}
              <View style={styles.buttonContainer}>
                <PrimaryButton title={t('save') || 'Save'} onPress={handleAddChildFeatures} style={styles.actionBtn} />
                <SecondaryButton title={t('cancel')} onPress={() => { setIsAddChildModalVisible(false); setNewTaskId(null); resetFormData(); }} style={styles.actionBtn} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Edit Modal: Form for editing an existing task */}
  <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <View style={[styles.modalContent, isDark && { backgroundColor: '#111827' }]}>
      <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('edit')} {t('tasks')}</Text>
              {renderAddTaskFields()}
              <View style={styles.buttonContainer}>
                <PrimaryButton title={t('update')} onPress={handleUpdateTask} style={styles.actionBtn} />
                <SecondaryButton title={t('cancel')} onPress={() => { setIsEditModalVisible(false); resetFormData(); }} style={styles.actionBtn} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
// (styles moved to top)

}