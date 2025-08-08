import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Alert, ActivityIndicator } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { auth } from '../../firebaseConfig';
import { useIsFocused } from '@react-navigation/native';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';

export default function AdminRoleRequestsScreen() {
  type RoleRequestItem = {
    id: string;
    userId?: string;
    requestedRole?: string;
    status?: string;
    createdAt?: any;
    [key: string]: any;
  };
  const [requests, setRequests] = useState<RoleRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'role_requests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(doc => {
        const data = doc.data() || {};
        return { id: doc.id, userId: data.userId, requestedRole: data.requestedRole, status: data.status, createdAt: data.createdAt, ...data } as RoleRequestItem;
      }));
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
        if (req && req.userId) {
          await updateDoc(doc(db, 'users', req.userId), { role: req.requestedRole });
        }
      }
      Alert.alert('Success', `Request ${status}`);
      fetchRequests();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: spacing(10) }} />;

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Role Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.email || 'Unknown User'}</Text>
              <StatusPill label={item.status || '—'} tone={item.status === 'approved' ? 'success' : item.status === 'denied' ? 'danger' : 'warning'} />
            </View>
            <Text style={styles.meta}>Current Role: <Text style={styles.metaValue}>{item.currentRole || '-'}</Text></Text>
            <Text style={styles.meta}>Requested: <Text style={styles.metaValue}>{item.requestedRole || '-'}</Text></Text>
            {item.reason ? <Text style={styles.meta}>Reason: <Text style={styles.reason}>{item.reason}</Text></Text> : null}
            {item.createdAt?.toDate ? (
              <Text style={styles.meta}>Created: <Text style={styles.metaValue}>{item.createdAt.toDate().toLocaleString()}</Text></Text>
            ) : null}
            {item.status === 'pending' && (
              <View style={styles.actionsRow}>
                <PrimaryButton title="Approve" onPress={() => handleReview(item.id, 'approved')} style={styles.actionBtn} />
                <SecondaryButton title="Deny" onPress={() => handleReview(item.id, 'denied')} style={styles.actionBtn} />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: spacing(5), paddingTop: spacing(10) },
  screenTitle: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  meta: { fontSize: 12, color: palette.textMuted, marginBottom: 2 },
  metaValue: { color: palette.text, fontWeight: '600' },
  reason: { color: palette.text, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', marginTop: spacing(4) },
  actionBtn: { flex: 1, marginRight: spacing(3) },
});
