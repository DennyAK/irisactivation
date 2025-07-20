
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [baUsers, setBaUsers] = useState<any[]>([]);
  const [tlUsers, setTlUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    outletId: '',
    assignedToUserBA: '',
    assignedToUserTLID: '',
    startDate: new Date(),
    remark: '',
    task_attendance: 'No',
    taskAttendanceId: '',
    task_assesment: 'No',
    taskAssesmentId: '',
    task_quick_sales_report: 'No',
    taskQuickSalesReportId: '',
    task_quick_quiz: 'No',
    taskQuickQuizId: '',
    task_sales_report_detail: 'No',
    taskSalesReportDetailId: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const resetFormData = () => {
    setFormData({
      outletId: '',
      assignedToUserBA: '',
      assignedToUserTLID: '',
      startDate: new Date(),
      remark: '',
      task_attendance: 'No',
      taskAttendanceId: '',
      task_assesment: 'No',
      taskAssesmentId: '',
      task_quick_sales_report: 'No',
      taskQuickSalesReportId: '',
      task_quick_quiz: 'No',
      taskQuickQuizId: '',
      task_sales_report_detail: 'No',
      taskSalesReportDetailId: '',
    });
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const tasksCollection = collection(db, 'tasks');
      const taskSnapshot = await getDocs(tasksCollection);
      const taskList = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
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

  const fetchBAUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const baList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => user.role === 'Iris - BA');
      setBaUsers(baList);
    } catch (error) {
      console.error('Error fetching BA users:', error);
    }
  };

  const fetchTLUsers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const tlList = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((user: any) => user.role === 'Iris - TL');
      setTlUsers(tlList);
    } catch (error) {
      console.error('Error fetching TL users:', error);
    }
  };

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
      taskAssesmentId: task.taskAssesmentId || '',
      task_quick_sales_report: task.task_quick_sales_report || 'No',
      taskQuickSalesReportId: task.taskQuickSalesReportId || '',
      task_quick_quiz: task.task_quick_quiz || 'No',
      taskQuickQuizId: task.taskQuickQuizId || '',
      task_sales_report_detail: task.task_sales_report_detail || 'No',
      taskSalesReportDetailId: task.taskSalesReportDetailId || '',
    });
    setIsEditModalVisible(true);
  };

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

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || formData.startDate;
    setShowDatePicker(Platform.OS === 'ios');
    setFormData({...formData, startDate: currentDate});
  };

  const renderModalFields = () => (
    <>
      <Picker
        selectedValue={formData.outletId}
        onValueChange={(itemValue) => setFormData({...formData, outletId: itemValue})}
      >
        <Picker.Item label="Select an Outlet" value="" />
        {outlets.map(outlet => (
          <Picker.Item key={outlet.id} label={outlet.outletName} value={outlet.id} />
        ))}
      </Picker>
      <Picker
        selectedValue={formData.assignedToUserBA}
        onValueChange={(itemValue) => setFormData({...formData, assignedToUserBA: itemValue})}
      >
        <Picker.Item label="Select BA" value="" />
        {baUsers.map(user => (
          <Picker.Item key={user.id} label={user.name || user.id} value={user.id} />
        ))}
      </Picker>
      <Picker
        selectedValue={formData.assignedToUserTLID}
        onValueChange={(itemValue) => setFormData({...formData, assignedToUserTLID: itemValue})}
      >
        <Picker.Item label="Select TL" value="" />
        {tlUsers.map(user => (
          <Picker.Item key={user.id} label={user.name || user.id} value={user.id} />
        ))}
      </Picker>
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
      <TextInput style={styles.input} value={formData.remark} onChangeText={(text) => setFormData({...formData, remark: text})} placeholder="Remark" />
      <Picker
        selectedValue={formData.task_attendance}
        onValueChange={(itemValue) => setFormData({...formData, task_attendance: itemValue})}
      >
        <Picker.Item label="Task Attendance: No" value="No" />
        <Picker.Item label="Task Attendance: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.taskAttendanceId} onChangeText={(text) => setFormData({...formData, taskAttendanceId: text})} placeholder="Task Attendance ID" />
      <Picker
        selectedValue={formData.task_assesment}
        onValueChange={(itemValue) => setFormData({...formData, task_assesment: itemValue})}
      >
        <Picker.Item label="Task Assessment: No" value="No" />
        <Picker.Item label="Task Assessment: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.taskAssesmentId} onChangeText={(text) => setFormData({...formData, taskAssesmentId: text})} placeholder="Task Assessment ID" />
      <Picker
        selectedValue={formData.task_quick_sales_report}
        onValueChange={(itemValue) => setFormData({...formData, task_quick_sales_report: itemValue})}
      >
        <Picker.Item label="Task Quick Sales Report: No" value="No" />
        <Picker.Item label="Task Quick Sales Report: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.taskQuickSalesReportId} onChangeText={(text) => setFormData({...formData, taskQuickSalesReportId: text})} placeholder="Task Quick Sales Report ID" />
      <Picker
        selectedValue={formData.task_quick_quiz}
        onValueChange={(itemValue) => setFormData({...formData, task_quick_quiz: itemValue})}
      >
        <Picker.Item label="Task Quick Quiz: No" value="No" />
        <Picker.Item label="Task Quick Quiz: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.taskQuickQuizId} onChangeText={(text) => setFormData({...formData, taskQuickQuizId: text})} placeholder="Task Quick Quiz ID" />
      <Picker
        selectedValue={formData.task_sales_report_detail}
        onValueChange={(itemValue) => setFormData({...formData, task_sales_report_detail: itemValue})}
      >
        <Picker.Item label="Task Sales Report Detail: No" value="No" />
        <Picker.Item label="Task Sales Report Detail: Yes" value="Yes" />
      </Picker>
      <TextInput style={styles.input} value={formData.taskSalesReportDetailId} onChangeText={(text) => setFormData({...formData, taskSalesReportDetailId: text})} placeholder="Task Sales Report Detail ID" />
    </>
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
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
    fetchTasks();
    fetchOutlets();
    fetchBAUsers();
    fetchTLUsers();
    return () => unsubscribe();
  }, []);

  const canManage = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';

  if (loading) {
    return <ActivityIndicator />;
  }

  const renderTask = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemTitle}>Outlet: {item.outletName}</Text>
      <Text>Assigned to BA: {(() => {
        const ba = baUsers.find((u: any) => u.id === item.assignedToUserBA);
        return ba ? ba.name || ba.id : item.assignedToUserBA;
      })()}</Text>
      <Text>Assigned to TL: {(() => {
        const tl = tlUsers.find((u: any) => u.id === item.assignedToUserTLID);
        return tl ? tl.name || tl.id : item.assignedToUserTLID;
      })()}</Text>
      <Text>Assigned by: {item.assignedBy}</Text>
      <Text>Task Start Date: {item.startDate?.toDate().toLocaleDateString()}</Text>
      <Text>Created Time: {item.createdAt?.toDate().toLocaleString()}</Text>
      <Text>Remark: {item.remark}</Text>

      <Text>Task Attendance: {item.task_attendance}</Text>
      <Text>Task Attendance ID: {item.taskAttendanceId}</Text>
      <Text>Task Assessment: {item.task_assesment}</Text>
      <Text>Task Assessment ID: {item.taskAssesmentId}</Text>
      <Text>Task Quick Sales Report: {item.task_quick_sales_report}</Text>
      <Text>Task Quick Sales Report ID: {item.taskQuickSalesReportId}</Text>
      <Text>Task Quick Quiz: {item.task_quick_quiz}</Text>
      <Text>Task Quick Quiz ID: {item.taskQuickQuizId}</Text>
      <Text>Task Sales Report Detail: {item.task_sales_report_detail}</Text>
      <Text>Task Sales Report Detail ID: {item.taskSalesReportDetailId}</Text>

      {canManage && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleEditTask(item)} />
          <Button title="Delete" onPress={() => handleDeleteTask(item.id)} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Management</Text>
      {canManage && <Button title="Add New Task" onPress={() => setIsAddModalVisible(true)} />}
      <FlatList data={tasks} keyExtractor={(item) => item.id} renderItem={renderTask} />
      {/* Add Modal */}
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
      {/* Edit Modal */}
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
   