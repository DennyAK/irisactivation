import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Button, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { auth } from '../../firebaseConfig';

export default function AdminRoleRequestsScreen() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'role_requests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReview = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'role_requests', id), { status });
      if (status === 'approved') {
        // Find the request to get userId and requestedRole
        const req = requests.find(r => r.id === id);
        if (req) {
          await updateDoc(doc(db, 'users', req.userId), { role: req.requestedRole });
        }
      }
      Alert.alert('Success', `Request ${status}`);
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Role Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>User: {item.email}</Text>
            <Text>Current Role: {item.currentRole}</Text>
            <Text>Requested Role: {item.requestedRole}</Text>
            <Text>Reason: {item.reason}</Text>
            <Text>Status: {item.status}</Text>
            {item.status === 'pending' && (
              <View style={styles.buttonRow}>
                <Button title="Approve" onPress={() => handleReview(item.id, 'approved')} />
                <Button title="Deny" onPress={() => handleReview(item.id, 'denied')} />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
