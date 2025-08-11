import { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { compareCreatedAt } from '../../utils/sort';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import StatusPill from '../../components/ui/StatusPill';
import FilterHeader from '../../components/ui/FilterHeader';

export default function ProjectsScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
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
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

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
    if (userRole && isFocused) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, isFocused]);

  const fetchProjects = async () => {
    if (!isFocused) return;
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? projects.filter((p) => {
          const hay = [p.projectName, p.projectType, p.projectTier, p.activationName, p.createdByName]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(term);
        })
      : projects;
  const sorted = [...list].sort((a, b) => compareCreatedAt(a, b, sortAsc));
    return sorted;
  }, [projects, search, sortAsc]);

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
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator />
      </View>
    );
  }

  const isAdmin = userRole === 'admin' || userRole === 'superadmin';
  const isSuperadmin = userRole === 'superadmin';
  const canEdit = isAdmin || userRole === 'area manager';

  return (
    <View style={styles.container}>
      <FilterHeader
        title="Projects"
        search={search}
        status={''}
        statusOptions={[]}
        storageKey="filters:projects"
        sortAsc={sortAsc}
        onToggleSort={() => setSortAsc(s => !s)}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />
      {isAdmin && <PrimaryButton title="Add New Project" onPress={() => setIsAddModalVisible(true)} style={styles.addBtn} />}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.projectName}</Text>
            </View>
            <View style={styles.pillsRow}>
              {!!item.projectType && <StatusPill label={item.projectType} tone="info" style={styles.pill} />}
              {!!item.projectTier && <StatusPill label={item.projectTier} tone="warning" style={styles.pill} />}
            </View>
            {!!item.activationName && <Text style={styles.meta}>Activation: <Text style={styles.metaStrong}>{item.activationName}</Text></Text>}
            {!!item.createdByName && <Text style={styles.meta}>Creator: <Text style={styles.metaStrong}>{item.createdByName}</Text></Text>}
            {canEdit && (
              <View style={styles.actionsRow}>
                {isAdmin && (
                  <SecondaryButton
                    title="View Audit"
                    onPress={() => router.push({ pathname: '/(tabs)/audit-logs', params: { collection: 'projects', docId: item.id } })}
                    style={styles.flexBtn}
                  />
                )}
                <SecondaryButton title="Edit" onPress={() => handleEditProject(item)} style={styles.flexBtn} />
                {isSuperadmin && <SecondaryButton title="Delete" onPress={() => handleDeleteProject(item.id)} style={[styles.flexBtn, styles.deleteBtn]} />}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing(30) }}
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

      {/* Add Modal */}
      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Add Project</Text>
            <TextInput style={styles.input} value={formData.activationName} onChangeText={(text) => setFormData({ ...formData, activationName: text })} placeholder="Activation Name" />
            <TextInput style={styles.input} value={formData.projectName} onChangeText={(text) => setFormData({ ...formData, projectName: text })} placeholder="Project Name" />
            <TextInput style={styles.input} value={formData.projectType} onChangeText={(text) => setFormData({ ...formData, projectType: text })} placeholder="Project Type" />
            <TextInput style={styles.input} value={formData.projectTier} onChangeText={(text) => setFormData({ ...formData, projectTier: text })} placeholder="Project Tier" />
            <View style={styles.modalActions}>
              <PrimaryButton title="Add" onPress={handleAddProject} style={styles.flexBtn} />
              <SecondaryButton title="Cancel" onPress={() => setIsAddModalVisible(false)} style={styles.flexBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>
      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} transparent animationType="slide" onRequestClose={() => setIsEditModalVisible(false)}>
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Edit Project</Text>
            <TextInput style={styles.input} value={formData.activationName} onChangeText={(text) => setFormData({ ...formData, activationName: text })} placeholder="Activation Name" />
            <TextInput style={styles.input} value={formData.projectName} onChangeText={(text) => setFormData({ ...formData, projectName: text })} placeholder="Project Name" />
            <TextInput style={styles.input} value={formData.projectType} onChangeText={(text) => setFormData({ ...formData, projectType: text })} placeholder="Project Type" />
            <TextInput style={styles.input} value={formData.projectTier} onChangeText={(text) => setFormData({ ...formData, projectTier: text })} placeholder="Project Tier" />
            <View style={styles.modalActions}>
              <PrimaryButton title="Update" onPress={handleUpdateProject} style={styles.flexBtn} />
              <SecondaryButton title="Cancel" onPress={() => { setIsEditModalVisible(false); setFormData({ activationName: '', projectName: '', projectType: '', projectTier: '' }); }} style={styles.flexBtn} />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: spacing(4) },
  screenTitle: { ...typography.h1, textAlign: 'center', marginBottom: spacing(4) },
  addBtn: { marginBottom: spacing(4) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(4), marginBottom: spacing(3), borderWidth: 1, borderColor: palette.border, ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flexShrink: 1 },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing(2), gap: spacing(2) },
  pill: { marginRight: spacing(2), marginBottom: spacing(1) },
  meta: { fontSize: 13, color: palette.textMuted, marginBottom: spacing(1.2) },
  metaStrong: { color: palette.text },
  actionsRow: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(3) },
  flexBtn: { flex: 1 },
  deleteBtn: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  // Modal styles
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing(6), backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { width: '100%', backgroundColor: palette.surface, borderRadius: radius.xl, padding: spacing(5) },
  modalTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing(5), color: palette.text },
  modalActions: { flexDirection: 'row', gap: spacing(3), marginTop: spacing(2) },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, backgroundColor: palette.surfaceAlt, paddingHorizontal: spacing(3), paddingVertical: spacing(3), marginBottom: spacing(3), fontSize: 14 },
});
