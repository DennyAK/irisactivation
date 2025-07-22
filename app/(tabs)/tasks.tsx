// --- Imports ---
// React hooks, UI components, Firebase config, Firestore functions, Auth, Picker, DateTimePicker
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Platform, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

// --- Main Component ---
export default function TasksScreen() {
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
  const [tasks, setTasks] = useState<any[]>([]);
  // outlets: List of outlets for dropdown selection
  const [outlets, setOutlets] = useState<any[]>([]);
  // loading: Controls loading spinner visibility
  const [loading, setLoading] = useState(true);
  // isAddModalVisible: Controls Add Task modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  // isEditModalVisible: Controls Edit Task modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
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
    // Fetch all tasks, outlets, BA users, TL users
    fetchTasks();
    fetchOutlets();
    fetchBAUsers();
    fetchTLUsers();
    return () => unsubscribe();
  }, []);

  // --- Data Fetching Functions ---
  // Fetch all tasks from Firestore, attach outlet names
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const tasksCollection = collection(db, 'tasks');
      const taskSnapshot = await getDocs(tasksCollection);
      const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      // For each task, fetch the outlet name for display
      const tasksWithOutletNames = await Promise.all(taskList.map(async (task) => {
        let outletName = 'Unknown Outlet';
        if (task.outletId) {
          try {
            const outletDocRef = doc(db, 'outlets', task.outletId);
            const outletDocSnap = await getDoc(outletDocRef);
            if (outletDocSnap.exists()) {
              outletName = outletDocSnap.data().outletName;
            }
          } catch (e) {
            console.error("Error fetching outlet name: ", e);
          }
        }
        return { ...task, outletName };
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
  // Add a new task to Firestore
  const handleAddTask = () => {
    if (!currentUserId) {
        Alert.alert("Error", "You must be logged in to add a task.");
        return;
    }
    addDoc(collection(db, "tasks"), {
      ...formData,
      assignedBy: currentUserId,
      createdAt: serverTimestamp()
    }).then(() => {
      setIsAddModalVisible(false);
      resetFormData();
      fetchTasks();
    }).catch(error => {
      Alert.alert("Add Failed", error.message);
    });
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
      <Text>Task Start Date: {item.startDate?.toDate().toLocaleDateString()}</Text>
      <Text>Assigned to BA: {baUsers.find(u => u.id === item.assignedToUserBA)?.name || item.assignedToUserBA}</Text>
      <Text>Assigned to TL: {tlUsers.find(u => u.id === item.assignedToUserTLID)?.name || item.assignedToUserTLID}</Text>
      <Text>Assigned by: {item.assignedBy}</Text>
      <Text>Created Time: {item.createdAt?.toDate().toLocaleString()}</Text>
      <Text>Remark: {item.remark}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Attendance: {item.task_attendance} </Text>
        {item.taskAttendanceId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.taskAttendanceId})</Text>
            <TouchableOpacity
              style={{ marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e0e0e0', borderRadius: 4 }}
              onPress={() => (navigation as any).navigate('task-attendance', { attendanceId: item.taskAttendanceId })}
            >
              <Text style={{ fontSize: 12, color: '#007AFF' }}>Do Task Attendance</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {/* Task Assessment Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Assessment: {item.task_assesment} </Text>
        {item.task_assesmentId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_assesmentId})</Text>
            <TouchableOpacity
              style={{ marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e0e0e0', borderRadius: 4 }}
              onPress={() => (navigation as any).navigate('task-early-assessment', { assessmentId: item.task_assesmentId })}
            >
              <Text style={{ fontSize: 12, color: '#007AFF' }}>Do Task Assessment</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {/* Task Quick Quiz Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Quick Quiz: {item.task_quick_quiz} </Text>
        {item.task_quick_quizId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_quick_quizId})</Text>
            <TouchableOpacity
              style={{ marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e0e0e0', borderRadius: 4 }}
              onPress={() => (navigation as any).navigate('task-quick-quiz', { quizId: item.task_quick_quizId })}
            >
              <Text style={{ fontSize: 12, color: '#007AFF' }}>Do Task Quick Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {/* Task Quick Sales Report Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Quick Sales Report: {item.task_quick_sales_report} </Text>
        {item.task_quick_sales_reportId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_quick_sales_reportId})</Text>
            <TouchableOpacity
              style={{ marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e0e0e0', borderRadius: 4 }}
              onPress={() => (navigation as any).navigate('quick-sales-report', { reportId: item.task_quick_sales_reportId })}
            >
              <Text style={{ fontSize: 12, color: '#007AFF' }}>Do Quick Sales Report</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {/* Task Sales Report Detail Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
        <Text style={{ maxWidth: '50%', flexShrink: 1 }}>Task Sales Report Detail: {item.task_sales_report_detail} </Text>
        {item.task_sales_report_detailId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginLeft: 4, maxWidth: 120, flexShrink: 1 }}>(ID: {item.task_sales_report_detailId})</Text>
            <TouchableOpacity
              style={{ marginLeft: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#e0e0e0', borderRadius: 4 }}
              onPress={() => (navigation as any).navigate('sales-report-detail', { detailId: item.task_sales_report_detailId })}
            >
              <Text style={{ fontSize: 12, color: '#007AFF' }}>Do Sales Report Detail</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      <Text>Task Assessment: {item.task_assesment} {item.task_assesmentId ? `(ID: ${item.task_assesmentId})` : ''}</Text>
      <Text>Task Quick Quiz: {item.task_quick_quiz} {item.task_quick_quizId ? `(ID: ${item.task_quick_quizId})` : ''}</Text>
      <Text>Task Quick Sales Report: {item.task_quick_sales_report} {item.task_quick_sales_reportId ? `(ID: ${item.task_quick_sales_reportId})` : ''}</Text>
      <Text>Task Sales Report Detail: {item.task_sales_report_detail} {item.task_sales_report_detailId ? `(ID: ${item.task_sales_report_detailId})` : ''}</Text>
      {/* Show Edit/Delete buttons only for managers */}
      {canManage && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditTask(item)} />
          <Button title="Delete" onPress={() => handleDeleteTask(item.id)} />
        </View>
      )}
    </View>
  );

  // Handle date selection for the task start date
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.startDate;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData({...formData, startDate: currentDate});
  };

  // Render all fields for Add/Edit modals (dropdowns, text inputs, date picker)
  const renderModalFields = () => (
    <>
      {/* Outlet dropdown */}
      <Picker
        selectedValue={formData.outletId}
        onValueChange={(itemValue) => setFormData({...formData, outletId: itemValue})}
      >
        <Picker.Item label="Select an Outlet" value="" />
        {outlets.map(outlet => (
          <Picker.Item key={outlet.id} label={outlet.outletName} value={outlet.id} />
        ))}
      </Picker>
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
        onValueChange={(itemValue) => setFormData({...formData, assignedToUserBA: String(itemValue)})}
      >
        <Picker.Item label="Select BA" value="" />
        {baUsers.map(user => (
          <Picker.Item key={String(user.id)} label={user.name || user.email || String(user.id)} value={String(user.id)} />
        ))}
      </Picker>
      {/* TL user dropdown */}
      <Picker
        selectedValue={String(formData.assignedToUserTLID)}
        onValueChange={(itemValue) => setFormData({...formData, assignedToUserTLID: String(itemValue)})}
      >
        <Picker.Item label="Select TL" value="" />
        {tlUsers.map(user => (
          <Picker.Item key={String(user.id)} label={user.name || user.email || String(user.id)} value={String(user.id)} />
        ))}
      </Picker>
      {/* Task Attendance dropdown and ID */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Attendance:</Text>
        <Switch
          value={formData.task_attendance === 'Yes'}
          onValueChange={async (isChecked: boolean) => {
            const itemValue = isChecked ? 'Yes' : 'No';
            if (itemValue === 'Yes' && formData.task_attendance !== 'Yes') {
              try {
                const docRef = await addDoc(collection(db, 'task_attendance'), {
                  createdAt: serverTimestamp(),
                  createdBy: currentUserId,
                  // Add more fields if needed
                });
                setFormData({
                  ...formData,
                  task_attendance: itemValue,
                  taskAttendanceId: docRef.id,
                });
              } catch (error) {
                const errMsg = (error as any)?.message || String(error);
                Alert.alert('Error', `Failed to create task attendance: ${errMsg}`);
                setFormData({ ...formData, task_attendance: itemValue });
              }
            } else {
              setFormData({ ...formData, task_attendance: itemValue });
            }
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_attendance === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      <TextInput style={styles.input} value={formData.taskAttendanceId} editable={false} placeholder="Task Attendance ID" />
      {/* Task Assessment dropdown and ID */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Assessment:</Text>
        <Switch
          value={formData.task_assesment === 'Yes'}
          onValueChange={async (isChecked: boolean) => {
            const itemValue = isChecked ? 'Yes' : 'No';
            if (itemValue === 'Yes' && formData.task_assesment !== 'Yes') {
              try {
                const docRef = await addDoc(collection(db, 'task_early_assessment'), {
                  createdAt: serverTimestamp(),
                  createdBy: currentUserId,
                  // You can add more fields here if needed
                });
                setFormData({
                  ...formData,
                  task_assesment: itemValue,
                  task_assesmentId: docRef.id,
                });
              } catch (error) {
                const errMsg = (error as any)?.message || String(error);
                Alert.alert('Error', `Failed to create early assessment: ${errMsg}`);
                setFormData({ ...formData, task_assesment: itemValue });
              }
            } else {
              setFormData({ ...formData, task_assesment: itemValue });
            }
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_assesment === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      <TextInput style={styles.input} value={formData.task_assesmentId} editable={false} placeholder="Task Assessment ID" />
      {/* Task Quick Quiz dropdown and ID */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Quick Quiz:</Text>
        <Switch
          value={formData.task_quick_quiz === 'Yes'}
          onValueChange={async (isChecked: boolean) => {
            const itemValue = isChecked ? 'Yes' : 'No';
            if (itemValue === 'Yes' && formData.task_quick_quiz !== 'Yes') {
              try {
                const docRef = await addDoc(collection(db, 'task_quick_quiz'), {
                  createdAt: serverTimestamp(),
                  createdBy: currentUserId,
                  // Add more fields if needed
                });
                setFormData({
                  ...formData,
                  task_quick_quiz: itemValue,
                  task_quick_quizId: docRef.id,
                });
              } catch (error) {
                const errMsg = (error as any)?.message || String(error);
                Alert.alert('Error', `Failed to create task quick quiz: ${errMsg}`);
                setFormData({ ...formData, task_quick_quiz: itemValue });
              }
            } else {
              setFormData({ ...formData, task_quick_quiz: itemValue });
            }
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_quick_quiz === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      <TextInput style={styles.input} value={formData.task_quick_quizId} editable={false} placeholder="Task Quick Quiz ID" />
      {/* Task Quick Sales Report dropdown and ID */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Quick Sales Report:</Text>
        <Switch
          value={formData.task_quick_sales_report === 'Yes'}
          onValueChange={async (isChecked: boolean) => {
            const itemValue = isChecked ? 'Yes' : 'No';
            if (itemValue === 'Yes' && formData.task_quick_sales_report !== 'Yes') {
              try {
                const docRef = await addDoc(collection(db, 'sales_report_quick'), {
                  createdAt: serverTimestamp(),
                  createdBy: currentUserId,
                  // Add more fields if needed
                });
                setFormData({
                  ...formData,
                  task_quick_sales_report: itemValue,
                  task_quick_sales_reportId: docRef.id,
                });
              } catch (error) {
                const errMsg = (error as any)?.message || String(error);
                Alert.alert('Error', `Failed to create quick sales report: ${errMsg}`);
                setFormData({ ...formData, task_quick_sales_report: itemValue });
              }
            } else {
              setFormData({ ...formData, task_quick_sales_report: itemValue });
            }
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_quick_sales_report === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      <TextInput style={styles.input} value={formData.task_quick_sales_reportId} editable={false} placeholder="Task Quick Sales Report ID" />
      {/* Task Sales Report Detail dropdown and ID */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ marginRight: 10 }}>Task Sales Report Detail:</Text>
        <Switch
          value={formData.task_sales_report_detail === 'Yes'}
          onValueChange={async (isChecked: boolean) => {
            const itemValue = isChecked ? 'Yes' : 'No';
            if (itemValue === 'Yes' && formData.task_sales_report_detail !== 'Yes') {
              try {
                const docRef = await addDoc(collection(db, 'sales_report_detail'), {
                  createdAt: serverTimestamp(),
                  createdBy: currentUserId,
                  // Add more fields if needed
                });
                setFormData({
                  ...formData,
                  task_sales_report_detail: itemValue,
                  task_sales_report_detailId: docRef.id,
                });
              } catch (error) {
                const errMsg = (error as any)?.message || String(error);
                Alert.alert('Error', `Failed to create sales report detail: ${errMsg}`);
                setFormData({ ...formData, task_sales_report_detail: itemValue });
              }
            } else {
              setFormData({ ...formData, task_sales_report_detail: itemValue });
            }
          }}
        />
        <Text style={{ marginLeft: 10 }}>{formData.task_sales_report_detail === 'Yes' ? 'Yes' : 'No'}</Text>
      </View>
      <TextInput style={styles.input} value={formData.task_sales_report_detailId} editable={false} placeholder="Task Sales Report Detail ID" />
      {/* Remark field */}
      <TextInput style={styles.input} value={formData.remark} onChangeText={(text) => setFormData({...formData, remark: text})} placeholder="Remark" />
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
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
    <View style={styles.modalContainer}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Add New Task</Text>
          {renderModalFields()}
          <View style={styles.buttonContainer}>
            <Button title="Add" onPress={handleAddTask} />
            <Button title="Cancel" onPress={() => { setIsAddModalVisible(false); resetFormData(); }} />
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
              {renderModalFields()}
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
}

// --- Styles ---
// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemContainer: {
    marginBottom: 12,
    padding: 15,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
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