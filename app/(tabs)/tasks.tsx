// --- Imports ---
// React hooks, UI components, Firebase config, Firestore functions, Auth, Picker, DateTimePicker
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- Main Component ---
export default function TasksScreen() {
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
        .map(doc => ({ id: doc.id, ...doc.data() }))
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
        .map(doc => ({ id: doc.id, ...doc.data() }))
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
      <Text>Assigned to BA: {baUsers.find(u => u.id === item.assignedToUserBA)?.name || item.assignedToUserBA}</Text>
      <Text>Assigned to TL: {tlUsers.find(u => u.id === item.assignedToUserTLID)?.name || item.assignedToUserTLID}</Text>
      <Text>Assigned by: {item.assignedBy}</Text>
      <Text>Task Start Date: {item.startDate?.toDate().toLocaleDateString()}</Text>
      <Text>Created Time: {item.createdAt?.toDate().toLocaleString()}</Text>
      <Text>Remark: {item.remark}</Text>
      <Text>Task Attendance: {item.task_attendance} {item.taskAttendanceId ? `(ID: ${item.taskAttendanceId})` : ''}</Text>
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
      {/* BA user dropdown */}
      <Picker
        selectedValue={formData.assignedToUserBA}
        onValueChange={(itemValue) => setFormData({...formData, assignedToUserBA: itemValue})}
      >
        <Picker.Item label="Select BA" value="" />
        {baUsers.map(user => (
          <Picker.Item key={user.id} label={user.name} value={user.id} />
        ))}
      </Picker>
      {/* TL user dropdown */}
      <Picker
        selectedValue={formData.assignedToUserTLID}
        onValueChange={(itemValue) => setFormData({...formData, assignedToUserTLID: itemValue})}
      >
        <Picker.Item label="Select TL" value="" />
        {tlUsers.map(user => (
          <Picker.Item key={user.id} label={user.name} value={user.id} />
        ))}
      </Picker>
      {/* Task Attendance dropdown and ID */}
      <Picker
        selectedValue={formData.task_attendance}
        onValueChange={(itemValue) => setFormData({...formData, task_attendance: itemValue})}
      >
        <Picker.Item label="Task Attendance: No" value="No" />
        <Picker.Item label="Task Attendance: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.taskAttendanceId} onChangeText={(text) => setFormData({...formData, taskAttendanceId: text})} placeholder="Task Attendance ID" />
      {/* Task Assessment dropdown and ID */}
      <Picker
        selectedValue={formData.task_assesment}
        onValueChange={(itemValue) => setFormData({...formData, task_assesment: itemValue})}
      >
        <Picker.Item label="Task Assessment: No" value="No" />
        <Picker.Item label="Task Assessment: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.task_assesmentId} onChangeText={(text) => setFormData({...formData, task_assesmentId: text})} placeholder="Task Assessment ID" />
      {/* Task Quick Quiz dropdown and ID */}
      <Picker
        selectedValue={formData.task_quick_quiz}
        onValueChange={(itemValue) => setFormData({...formData, task_quick_quiz: itemValue})}
      >
        <Picker.Item label="Task Quick Quiz: No" value="No" />
        <Picker.Item label="Task Quick Quiz: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.task_quick_quizId} onChangeText={(text) => setFormData({...formData, task_quick_quizId: text})} placeholder="Task Quick Quiz ID" />
      {/* Task Quick Sales Report dropdown and ID */}
      <Picker
        selectedValue={formData.task_quick_sales_report}
        onValueChange={(itemValue) => setFormData({...formData, task_quick_sales_report: itemValue})}
      >
        <Picker.Item label="Task Quick Sales Report: No" value="No" />
        <Picker.Item label="Task Quick Sales Report: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.task_quick_sales_reportId} onChangeText={(text) => setFormData({...formData, task_quick_sales_reportId: text})} placeholder="Task Quick Sales Report ID" />
      {/* Task Sales Report Detail dropdown and ID */}
      <Picker
        selectedValue={formData.task_sales_report_detail}
        onValueChange={(itemValue) => setFormData({...formData, task_sales_report_detail: itemValue})}
      >
        <Picker.Item label="Task Sales Report Detail: No" value="No" />
        <Picker.Item label="Task Sales Report Detail: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.task_sales_report_detailId} onChangeText={(text) => setFormData({...formData, task_sales_report_detailId: text})} placeholder="Task Sales Report Detail ID" />
      {/* Date picker for start date */}
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
      <FlatList data={tasks} keyExtractor={(item) => item.id} renderItem={renderTask} />
      
      {/* Add Modal: Form for adding a new task */}
      <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Add New Task</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Add" onPress={handleAddTask} />
              <Button title="Cancel" onPress={() => { setIsAddModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Edit Modal: Form for editing an existing task */}
      <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Edit Task</Text>
            {renderModalFields()}
            <View style={styles.buttonContainer}>
              <Button title="Update" onPress={handleUpdateTask} />
              <Button title="Cancel" onPress={() => { setIsEditModalVisible(false); resetFormData(); }} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

// --- Styles ---
// All styles for layout, text, modals, inputs, buttons
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }
});