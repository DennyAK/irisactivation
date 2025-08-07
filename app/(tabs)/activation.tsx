import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Button, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function ActivationScreen() {
  const [activations, setActivations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    activationId: '',
    activationName: '',
    activationDetail: '',
  });
  const [selectedActivation, setSelectedActivation] = useState<any>(null);

  useEffect(() => {
    fetchActivations();
  }, []);

  const fetchActivations = async () => {
    setLoading(true);
    try {
      const activationsCollection = collection(db, 'activations');
      const snapshot = await getDocs(activationsCollection);
      const activationList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivations(activationList);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch activations.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!formData.activationId || !formData.activationName) {
      Alert.alert('Validation', 'Activation ID and Name are required.');
      return;
    }
    try {
      if (selectedActivation) {
        await updateDoc(doc(db, 'activations', selectedActivation.id), formData);
      } else {
        await addDoc(collection(db, 'activations'), formData);
      }
      setIsModalVisible(false);
      setFormData({ activationId: '', activationName: '', activationDetail: '' });
      setSelectedActivation(null);
      fetchActivations();
    } catch (error) {
      Alert.alert('Error', 'Failed to save activation.');
    }
  };

  const handleEdit = (item: any) => {
    setFormData({
      activationId: item.activationId || '',
      activationName: item.activationName || '',
      activationDetail: item.activationDetail || '',
    });
    setSelectedActivation(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'activations', id));
      fetchActivations();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete activation.');
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activations</Text>
      <Button title="Add Activation" onPress={() => { setFormData({ activationId: '', activationName: '', activationDetail: '' }); setSelectedActivation(null); setIsModalVisible(true); }} />
      <FlatList
        data={activations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <Text style={styles.itemTitle}>{item.activationName}</Text>
            <Text>ID: {item.activationId}</Text>
            <Text>Detail: {item.activationDetail}</Text>
            <View style={styles.buttonContainer}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <Button title="Delete" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
      />
      <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>{selectedActivation ? 'Edit' : 'Add'} Activation</Text>
            <TextInput style={styles.input} value={formData.activationId} onChangeText={text => setFormData({ ...formData, activationId: text })} placeholder="Activation ID" />
            <TextInput style={styles.input} value={formData.activationName} onChangeText={text => setFormData({ ...formData, activationName: text })} placeholder="Activation Name" />
            <TextInput style={styles.input} value={formData.activationDetail} onChangeText={text => setFormData({ ...formData, activationDetail: text })} placeholder="Activation Detail" />
            <View style={styles.buttonContainer}>
              <Button title={selectedActivation ? 'Update' : 'Add'} onPress={handleAddOrUpdate} />
              <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }
});
