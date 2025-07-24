import { useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function ProjectsScreen() {
  const router = useRouter();
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    activationName: '',
    projectName: '',
    projectType: '',
    projectTier: '',
  });
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchProjects();
    }
  }, [userRole]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const projectsCollection = collection(db, 'projects');
      const projectSnapshot = await getDocs(projectsCollection);
      const projectList = projectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const projectsWithUserNames = await Promise.all(projectList.map(async (project) => {
        let createdByName = 'Unknown User';
        if (project.createdBy) {
          try {
            const userDocRef = doc(db, 'users', project.createdBy);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              createdByName = `${userData.firstName} ${userData.lastName}`.trim() || userData.email;
            }
          } catch (e) {
            console.error("Error fetching user name: ", e);
          }
        }
        return { ...project, createdByName };
      }));

      setProjects(projectsWithUserNames);
    } catch (error) {
      console.error("Error fetching projects: ", error);
      Alert.alert("Error", "Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    if (formData.projectName.trim() === '') {
      Alert.alert("Invalid Name", "Project name cannot be empty.");
      return;
    }
    if (!currentUserId) {
        Alert.alert("Error", "You must be logged in to add a project.");
        return;
    }
    addDoc(collection(db, "projects"), {
      ...formData,
      createdBy: currentUserId,
      createdAt: serverTimestamp()
    }).then((docRef) => {
      updateDoc(docRef, { projectId: docRef.id });
      setIsAddModalVisible(false);
      setFormData({ activationName: '', projectName: '', projectType: '', projectTier: '' });
      fetchProjects();
    }).catch(error => {
      Alert.alert("Add Failed", error.message);
    });
  };

  const handleEditProject = (project: any) => {
    setSelectedProject(project);
    setFormData({
      activationName: project.activationName || '',
      projectName: project.projectName || '',
      projectType: project.projectType || '',
      projectTier: project.projectTier || '',
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateProject = () => {
    if (selectedProject) {
      const projectDoc = doc(db, "projects", selectedProject.id);
      updateDoc(projectDoc, formData).then(() => {
        setIsEditModalVisible(false);
        setFormData({ activationName: '', projectName: '', projectType: '', projectTier: '' });
        setSelectedProject(null);
        fetchProjects();
      }).catch(error => {
        Alert.alert("Update Failed", error.message);
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    Alert.alert("Delete Project", "Are you sure you want to delete this project?", [
      { text: "Cancel", style: "cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "projects", projectId)).then(() => {
          fetchProjects();
        });
      }}
    ]);
  };

  if (loading) {
    return <ActivityIndicator />;
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const canEdit = isAdmin || userRole === 'area manager';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projects</Text>
      {isAdmin && <Button title="Add New Project" onPress={() => setIsAddModalVisible(true)} />}
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.projectContainer}>
            <Text style={styles.itemTitle}>{item.projectName}</Text>
            <Text>Type: {item.projectType}</Text>
            <Text>Tier: {item.projectTier}</Text>
            <Text>Activation: {item.activationName}</Text>
            {canEdit && (
              <View style={styles.buttonContainer}>
                <Button title="Edit" onPress={() => handleEditProject(item)} />
                {isAdmin && <Button title="Delete" onPress={() => handleDeleteProject(item.id)} />}
              </View>
            )}
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchProjects();
              setRefreshing(false);
            }}
          />
        }
      />
      <>
        {/* Add Modal */}
        <Modal visible={isAddModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Add Project</Text>
              <TextInput style={styles.input} value={formData.activationName} onChangeText={(text) => setFormData({...formData, activationName: text})} placeholder="Activation Name" />
              <TextInput style={styles.input} value={formData.projectName} onChangeText={(text) => setFormData({...formData, projectName: text})} placeholder="Project Name" />
              <TextInput style={styles.input} value={formData.projectType} onChangeText={(text) => setFormData({...formData, projectType: text})} placeholder="Project Type" />
              <TextInput style={styles.input} value={formData.projectTier} onChangeText={(text) => setFormData({...formData, projectTier: text})} placeholder="Project Tier" />
              <View style={styles.buttonContainer}>
                <Button title="Add" onPress={handleAddProject} />
                <Button title="Cancel" onPress={() => setIsAddModalVisible(false)} />
              </View>
            </View>
          </ScrollView>
        </Modal>
        {/* Edit Modal */}
        <Modal visible={isEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Edit Project</Text>
              <TextInput style={styles.input} value={formData.activationName} onChangeText={(text) => setFormData({...formData, activationName: text})} placeholder="Activation Name" />
              <TextInput style={styles.input} value={formData.projectName} onChangeText={(text) => setFormData({...formData, projectName: text})} placeholder="Project Name" />
              <TextInput style={styles.input} value={formData.projectType} onChangeText={(text) => setFormData({...formData, projectType: text})} placeholder="Project Type" />
              <TextInput style={styles.input} value={formData.projectTier} onChangeText={(text) => setFormData({...formData, projectTier: text})} placeholder="Project Tier" />
              <View style={styles.buttonContainer}>
                <Button title="Update" onPress={handleUpdateProject} />
                <Button title="Cancel" onPress={() => { setIsEditModalVisible(false); setFormData({ activationName: '', projectName: '', projectType: '', projectTier: '' }); }} />
              </View>
            </View>
          </ScrollView>
        </Modal>
      </>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  projectContainer: {
    marginBottom: 10,
    padding: 10,
    borderColor: 'gray',
    borderWidth: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  }
});
