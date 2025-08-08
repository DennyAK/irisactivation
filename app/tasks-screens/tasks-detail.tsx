// --- Imports ---
// React hooks, UI components, Firebase config, Firestore functions, Auth, Picker, DateTimePicker
import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Platform, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '95%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 10,
  },
});

// Animated TouchableOpacity for blinking effect
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// --- Main Component ---
export default function TasksScreen() {
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

  // Step 2: Add child documents for the new task
  const handleAddChildFeatures = async () => {
    let updatedFormData = { ...formData };
    try {
      if (formData.task_attendance === 'Yes' && !formData.taskAttendanceId) {
        const docRef = await addDoc(collection(db, 'task_attendance'), {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId || '',
          outletId: formData.outletId || '',
        });
        updatedFormData.taskAttendanceId = docRef.id;
      }
      if (formData.task_assesment === 'Yes' && !formData.task_assesmentId) {
        const docRef = await addDoc(collection(db, 'task_early_assessment'), {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId || '',
          outletId: formData.outletId || '',
        });
        updatedFormData.task_assesmentId = docRef.id;
      }
      if (formData.task_quick_quiz === 'Yes' && !formData.task_quick_quizId) {
        const docRef = await addDoc(collection(db, 'task_quick_quiz'), {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId || '',
        });
        updatedFormData.task_quick_quizId = docRef.id;
      }
      if (formData.task_quick_sales_report === 'Yes' && !formData.task_quick_sales_reportId) {
        const docRef = await addDoc(collection(db, 'sales_report_quick'), {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId || '',
          outletId: formData.outletId || '',
        });
        updatedFormData.task_quick_sales_reportId = docRef.id;
      }
      if (formData.task_sales_report_detail === 'Yes' && !formData.task_sales_report_detailId) {
        const docRef = await addDoc(collection(db, 'sales_report_detail'), {
          createdAt: serverTimestamp(),
          createdBy: currentUserId,
          assignedToBA: formData.assignedToUserBA,
          assignedToTL: formData.assignedToUserTLID,
          tasksId: newTaskId || '',
          outletId: formData.outletId || '',
        });
        updatedFormData.task_sales_report_detailId = docRef.id;
      }
      // Update the main task with child IDs
      if (newTaskId) {
        const taskDoc = doc(db, 'tasks', newTaskId);
        await updateDoc(taskDoc, updatedFormData);
      }
      setIsAddChildModalVisible(false);
      setNewTaskId(null);
      resetFormData();
      fetchTasks();
    } catch (error: any) {
      Alert.alert('Error', error.message || String(error));
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
    return <ActivityIndicator />;
  }

  // canManage: Only certain roles can add/edit/delete tasks
  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';

  // Render a single task item in the list
  const renderTask = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      {/* Display all task details, including outlet and assigned users */}
      <Text style={styles.itemTitle}>Outlet: {item.outletName}</Text>
      <Text>Province: {item.outletProvince || '-'}</Text>
      <Text>Task Start Date: {item.startDate?.toDate().toLocaleDateString()}</Text>
      <Text>Assigned to BA: {baUsers.find(u => u.id === item.assignedToUserBA)?.name || item.assignedToUserBA}</Text>
      <Text>Assigned to TL: {tlUsers.find(u => u.id === item.assignedToUserTLID)?.name || item.assignedToUserTLID}</Text>
      <Text>Assigned by: {item.assignedBy}</Text>
      <Text>Created Time: {item.createdAt?.toDate().toLocaleString()}</Text>
      <Text>Remark: {item.remark}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Attendance: {item.task_attendance} </Text>
        {item.taskAttendanceId ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.taskAttendanceId})</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <AnimatedTouchable
                style={{
                  width: '90%',
                  minWidth: 100,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#786a35', '#ffe066'],
                  }),
                  borderRadius: 4,
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                }}
                onPress={() => (navigation as any).navigate('task-attendance', { attendanceId: item.taskAttendanceId })}
              >
                <Text style={{ fontSize: 12, color: '#fff' }}>Do Task Attendance</Text>
              </AnimatedTouchable>
            </View>
          </View>
        ) : null}
      </View>
      {/* Task Assessment Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Assessment: {item.task_assesment} </Text>
        {item.task_assesmentId ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_assesmentId})</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <AnimatedTouchable
                style={{
                  width: '90%',
                  minWidth: 100,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#786a35', '#ffe066'],
                  }),
                  borderRadius: 4,
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                }}
                onPress={() => (navigation as any).navigate('task-early-assessment', { assessmentId: item.task_assesmentId })}
              >
                <Text style={{ fontSize: 12, color: '#fff' }}>Do Task Assessment</Text>
              </AnimatedTouchable>
            </View>
          </View>
        ) : null}
      </View>
      {/* Task Quick Quiz Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Quick Quiz: {item.task_quick_quiz} </Text>
        {item.task_quick_quizId ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_quick_quizId})</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <AnimatedTouchable
                style={{
                  width: '90%',
                  minWidth: 100,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#786a35', '#ffe066'],
                  }),
                  borderRadius: 4,
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                }}
                onPress={() => (navigation as any).navigate('task-quick-quiz', { quizId: item.task_quick_quizId })}
              >
                <Text style={{ fontSize: 12, color: '#fff' }}>Do Task Quick Quiz</Text>
              </AnimatedTouchable>
            </View>
          </View>
        ) : null}
      </View>
      {/* Task Quick Sales Report Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Quick Sales Report: {item.task_quick_sales_report} </Text>
        {item.task_quick_sales_reportId ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_quick_sales_reportId})</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <AnimatedTouchable
                style={{
                  width: '90%',
                  minWidth: 100,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#786a35', '#ffe066'],
                  }),
                  borderRadius: 4,
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                }}
                onPress={() => (navigation as any).navigate('quick-sales-report', { reportId: item.task_quick_sales_reportId })}
              >
                <Text style={{ fontSize: 12, color: '#fff' }}>Do Quick Sales Report</Text>
              </AnimatedTouchable>
            </View>
          </View>
        ) : null}
      </View>
      {/* Task Sales Report Detail Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Sales Report Detail: {item.task_sales_report_detail} </Text>
        {item.task_sales_report_detailId ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_sales_report_detailId})</Text>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <AnimatedTouchable
                style={{
                  width: '90%',
                  minWidth: 100,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  backgroundColor: blinkAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#786a35', '#ffe066'],
                  }),
                  borderRadius: 4,
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                }}
                onPress={() => (navigation as any).navigate('sales-report-detail', { detailId: item.task_sales_report_detailId })}
              >
                <Text style={{ fontSize: 12, color: '#fff' }}>Do Sales Report Detail</Text>
              </AnimatedTouchable>
            </View>
          </View>
        ) : null}
      </View>
      {/* Show Edit/Delete buttons only for managers */}
      {canManage && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditTask(item)} />
          <Button title="Delete" onPress={() => handleDeleteTask(item.id)} />
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
        <Picker.Item label="Select an Outlet" value="" />
        {outlets.map(outlet => (
          <Picker.Item key={outlet.id} label={outlet.outletName} value={outlet.id} />
        ))}
      </Picker>
      {/* Province display (read-only, based on selected outlet) */}
      <Text style={styles.input}>
        Province: {(() => {
          const selectedOutlet = outlets.find(o => o.id === formData.outletId);
          return selectedOutlet?.province || '-';
        })()}
      </Text>
      {/* Task Start Date below Outlet */}
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text style={styles.input}>{`Task Start Date: ${formData.startDate.toLocaleDateString()}`}</Text>
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
        <Picker.Item label="Select BA" value="" />
        {baUsers.map(user => (
          <Picker.Item key={String(user.id)} label={user.name || user.email || String(user.id)} value={String(user.id)} />
        ))}
      </Picker>
      {/* TL user dropdown */}
      <Picker
        selectedValue={String(formData.assignedToUserTLID)}
        onValueChange={(itemValue) => setFormData({ ...formData, assignedToUserTLID: String(itemValue) })}
      >
        <Picker.Item label="Select TL" value="" />
        {tlUsers.map(user => (
          <Picker.Item key={String(user.id)} label={user.name || user.email || String(user.id)} value={String(user.id)} />
        ))}
      </Picker>
      {/* Remark field */}
      <TextInput style={styles.input} value={formData.remark} onChangeText={(text) => setFormData({ ...formData, remark: text })} placeholder="Remark" />
    </>
  );

  // Step 2: switches for child features
  const renderAddChildFields = () => (
    <>
      {/* Task Attendance switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Attendance:</Text>
        <Switch
          value={formData.task_attendance === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_attendance: isChecked ? 'Yes' : 'No' });
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_attendance === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      {/* Task Assessment switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Assessment:</Text>
        <Switch
          value={formData.task_assesment === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_assesment: isChecked ? 'Yes' : 'No' });
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_assesment === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      {/* Task Quick Quiz switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Quick Quiz:</Text>
        <Switch
          value={formData.task_quick_quiz === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_quick_quiz: isChecked ? 'Yes' : 'No' });
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_quick_quiz === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      {/* Task Quick Sales Report switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Quick Sales Report:</Text>
        <Switch
          value={formData.task_quick_sales_report === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_quick_sales_report: isChecked ? 'Yes' : 'No' });
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_quick_sales_report === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      {/* Task Sales Report Detail switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Sales Report Detail:</Text>
        <Switch
          value={formData.task_sales_report_detail === 'Yes'}
          onValueChange={(isChecked: boolean) => {
            setFormData({ ...formData, task_sales_report_detail: isChecked ? 'Yes' : 'No' });
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_sales_report_detail === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
    </>
  );

  // --- Main Render ---
  return (
    <View style={styles.container}>
      {/* Page Title */}
      <Text style={styles.title}>Task Management</Text>
      {/* Add Task Button (only for managers) */}
      {canManage && <Button title="Add New Task" onPress={() => setIsAddModalVisible(true)} />}
      {/* List of tasks */}
      <FlatList
        data={tasks}
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
      />
      {/* Edit Attendance Modal */}
      <Modal visible={isEditAttendanceModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditAttendanceModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Task Attendance</Text>
            {attendanceForm && (
              <>
                {/* Only allow editing remark field, as before */}
                <TextInput
                  style={styles.input}
                  value={attendanceForm.remark || ''}
                  onChangeText={text => setAttendanceForm({ ...attendanceForm, remark: text })}
                  placeholder="Remark"
                />
              </>
            )}
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdateAttendance} />
              <Button title="Cancel" onPress={() => { setIsEditAttendanceModalVisible(false); setAttendanceForm(null); setEditingAttendanceId(null); }} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
      {/* Step 1: Add Task Modal (main fields only) */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Add New Task</Text>
              {renderAddTaskFields()}
              <View style={styles.buttonContainer}>
                <Button title="Next" onPress={handleAddTask} />
                <Button title="Cancel" onPress={() => { setIsAddModalVisible(false); resetFormData(); }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Step 2: Add Child Features Modal (switches only) */}
      <Modal visible={isAddChildModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddChildModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Add Task Features</Text>
              {renderAddChildFields()}
              <View style={styles.buttonContainer}>
                <Button title="Save Features" onPress={handleAddChildFeatures} />
                <Button title="Cancel" onPress={() => { setIsAddChildModalVisible(false); setNewTaskId(null); resetFormData(); }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Edit Modal: Form for editing an existing task */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Edit Task</Text>
              {renderAddTaskFields()}
              <View style={styles.buttonContainer}>
                <Button title="Update" onPress={handleUpdateTask} />
                <Button title="Cancel" onPress={() => { setIsEditModalVisible(false); resetFormData(); }} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
// (styles moved to top)

}