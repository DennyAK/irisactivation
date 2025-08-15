import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Modal, TextInput, Alert, TouchableOpacity, RefreshControl, Platform, Linking, ScrollView } from 'react-native';
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { useAppSettings } from '@/components/AppSettings';
import { isAdminRole, isAreaManager, isBAish, isTLish } from '../../constants/roles';

type RpvItem = {
  id: string;
  ownerId: string;
  key: string;
  publicUrl?: string;
  contentType: 'image/jpeg' | 'video/mp4' | 'video/quicktime' | string;
  sizeBytes: number;
  kind: 'image' | 'video';
  status: 'awaiting-upload' | 'ready' | 'archived';
  createdAt?: any;
  movedAt?: any | null;
  tlStatus?: 'pending' | 'approved' | 'changes-requested';
  amStatus?: 'pending' | 'approved' | 'changes-requested';
};

function uuid4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function RolePlayVideoScreen() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const navigation: any = useNavigation();
  const { debugHeaderEnabled } = useAppSettings();
  const colors = {
    body: isDark ? '#0b1220' : palette.bg,
    surface: isDark ? '#111827' : palette.surface,
    surfaceAlt: isDark ? '#0f172a' : palette.surfaceAlt,
    border: isDark ? '#1f2937' : palette.border,
    text: isDark ? '#e5e7eb' : palette.text,
    muted: isDark ? '#94a3b8' : palette.textMuted,
    placeholder: isDark ? '#64748b' : '#9ca3af',
  };
  const inputCommonProps = isDark ? { placeholderTextColor: colors.placeholder as any } : {};

  const [userRole, setUserRole] = useState<string | null>(null);
  const [items, setItems] = useState<RpvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<RpvItem | null>(null);
  const [form, setForm] = useState<{ publicUrl: string; status: RpvItem['status']; key: string; contentType: string; sizeBytes: number }>(
    { publicUrl: '', status: 'awaiting-upload', key: '', contentType: 'video/mp4', sizeBytes: 0 }
  );
  const [pickedAssetUri, setPickedAssetUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const SIGNER_URL = (process.env as any)?.EXPO_PUBLIC_R2_SIGN_URL as string | undefined;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setUserRole(null); setItems([]); setLoading(false); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const role = snap.exists() ? (snap.data() as any)?.role : null;
        setUserRole(role);
      } catch { setUserRole(null); }
    });
    return () => unsub();
  }, []);

  const fetchItems = async () => {
    if (!auth.currentUser?.uid) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const base = collection(db, 'role_play_video');
      let snap;
      if (isBAish(userRole as any)) {
        snap = await getDocs(query(base, where('ownerId', '==', auth.currentUser!.uid)));
      } else if (isTLish(userRole as any)) {
        snap = await getDocs(query(base, where('status', '==', 'ready')));
      } else if (isAreaManager(userRole as any)) {
        snap = await getDocs(query(base, where('tlStatus', '==', 'approved')));
      } else if (isAdminRole(userRole as any)) {
        snap = await getDocs(base);
      } else {
        snap = await getDocs(query(base, where('ownerId', '==', auth.currentUser!.uid)));
      }
      let list: RpvItem[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => {
        const at = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bt = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bt - at;
      });
      setItems(list);
    } catch (e) {
      Alert.alert(t('error') || 'Error', t('failed_to_fetch_reports') || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [userRole]);

  useEffect(() => {
    if (!debugHeaderEnabled) { navigation.setOptions?.({ headerTitle: undefined }); return; }
    const uid = auth.currentUser?.uid || '';
    const shortUid = uid ? `${uid.slice(0,4)}…${uid.slice(-4)}` : '—';
    const label = `role:${userRole || '—'} | uid:${shortUid}`;
    navigation.setOptions?.({
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Text style={{ color: '#ef4444', fontSize: 10 }} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      ),
    });
  }, [userRole, auth.currentUser?.uid, debugHeaderEnabled]);

  const handleOpenAdd = () => {
    setModalType('add');
    const uid = auth.currentUser?.uid || 'unknown';
    const ts = Date.now();
    const ext = 'mp4';
    const key = `users/${uid}/role-play/${ts}-${uuid4()}.${ext}`;
    setForm({ publicUrl: '', status: 'awaiting-upload', key, contentType: 'video/mp4', sizeBytes: 0 });
  setPickedAssetUri(null);
    setIsModalVisible(true);
  };

  const pickVideoAndValidate = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') { Alert.alert('Permission required', 'Media library permission is needed.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, allowsMultipleSelection: false });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset) return;
    const durationSec = (asset.duration || 0);
    if (durationSec > 300) {
      Alert.alert('Video too long', 'Please select a video no longer than 5 minutes.');
      return;
    }
    const uri = asset.uri || '';
    const size = (asset as any).fileSize || 0;
    const mime = (asset as any).mimeType || 'video/mp4';
    const ext = uri.endsWith('.mov') ? 'mov' : 'mp4';
    const newKey = form.key.replace(/\.(mp4|mov)$/i, `.${ext}`);
    setForm(prev => ({ ...prev, sizeBytes: size, contentType: ext === 'mov' ? 'video/quicktime' : 'video/mp4', key: newKey }));
    setPickedAssetUri(uri);
    Alert.alert('Prepared', 'Video metadata captured. Use your upload tool to send to Cloudflare R2 with this key.');
  };

  const requestPresign = async (key: string, contentType: string, sizeBytes: number): Promise<{ uploadUrl: string; method?: string; headers?: Record<string,string>; publicUrl?: string }> => {
    if (!SIGNER_URL) throw new Error('Missing EXPO_PUBLIC_R2_SIGN_URL');
    const res = await fetch(SIGNER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, contentType, sizeBytes, ownerId: auth.currentUser?.uid || 'unknown' }),
    });
    if (!res.ok) throw new Error(`Signer error: ${res.status}`);
    const data = await res.json();
    if (!data.uploadUrl) throw new Error('Signer response missing uploadUrl');
    return data;
  };

  const uploadSelectedVideo = async (docIdOrNull: string | null) => {
    try {
      if (!pickedAssetUri) { Alert.alert('No video', 'Please pick a video first.'); return; }
      if (!form.key) { Alert.alert('Missing key', 'Key is required.'); return; }
      setUploading(true);
      const presign = await requestPresign(form.key, form.contentType, form.sizeBytes || 0);
      const rs = await fetch(pickedAssetUri);
      const blob = await rs.blob();
      const method = presign.method || 'PUT';
      const headers = Object.assign({}, presign.headers || {}, { 'Content-Type': form.contentType });
      const up = await fetch(presign.uploadUrl, { method, headers, body: blob } as any);
      if (!up.ok) throw new Error(`Upload failed: ${up.status}`);
      const publicUrl = presign.publicUrl || '';
      // Update Firestore metadata
      if (docIdOrNull) {
        await updateDoc(doc(db, 'role_play_video', docIdOrNull), {
          status: 'ready',
          publicUrl,
          tlStatus: 'pending',
          amStatus: 'pending',
        });
      }
      Alert.alert('Uploaded', 'Video uploaded to R2 successfully.');
    } catch (e: any) {
      Alert.alert('Upload error', e?.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'add') {
        const ref = collection(db, 'role_play_video');
        await addDoc(ref, {
          ownerId: auth.currentUser?.uid || 'unknown',
          key: form.key,
          publicUrl: form.publicUrl || '',
          contentType: form.contentType,
          sizeBytes: form.sizeBytes || 0,
          kind: 'video',
          status: form.status || 'awaiting-upload',
          createdAt: serverTimestamp(),
          movedAt: null,
          tlStatus: 'pending',
          amStatus: 'pending',
        });
      } else if (modalType === 'edit' && selectedItem) {
        const ref = doc(db, 'role_play_video', selectedItem.id);
  await updateDoc(ref, {
          publicUrl: form.publicUrl || '',
          contentType: form.contentType,
          sizeBytes: form.sizeBytes || 0,
          status: form.status,
          movedAt: form.status === 'archived' ? serverTimestamp() : selectedItem.movedAt || null,
        });
      }
      setIsModalVisible(false);
      fetchItems();
    } catch (e) {
      Alert.alert(t('error') || 'Error', 'Failed to save.');
    }
  };

  const handleCreateAndUpload = async () => {
    if (!pickedAssetUri) { Alert.alert('No video', 'Please pick a video first.'); return; }
    try {
      const ref = collection(db, 'role_play_video');
      const created = await addDoc(ref, {
        ownerId: auth.currentUser?.uid || 'unknown',
        key: form.key,
        publicUrl: '',
        contentType: form.contentType,
        sizeBytes: form.sizeBytes || 0,
        kind: 'video',
        status: 'awaiting-upload',
        createdAt: serverTimestamp(),
        movedAt: null,
        tlStatus: 'pending',
        amStatus: 'pending',
      });
      await uploadSelectedVideo(created.id);
      setIsModalVisible(false);
      fetchItems();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create and upload');
    }
  };

  const handleEdit = (item: RpvItem) => {
    setSelectedItem(item);
    setModalType('edit');
    setForm({
      publicUrl: item.publicUrl || '',
      status: item.status,
      key: item.key,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes || 0,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (item: RpvItem) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'role_play_video', item.id));
          fetchItems();
        } catch { Alert.alert('Error', 'Failed to delete'); }
      }}
    ]);
  };

  const renderItem = ({ item }: { item: RpvItem }) => {
    const created = item?.createdAt?.toDate ? item.createdAt.toDate() : null;
    const canOpen = !!item.publicUrl;
    const canBAEdit = isBAish(userRole as any) && item.ownerId === (auth.currentUser?.uid || '');
    const canTLReview = isTLish(userRole as any) && item.status === 'ready';
    const canAMReview = isAreaManager(userRole as any) && (item.tlStatus || 'pending') === 'approved';
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Role Play Video</Text>
          <StatusPill tone={item.status === 'ready' ? 'success' : item.status === 'archived' ? 'warning' : 'info'} label={item.status} />
        </View>
        <Text style={{ color: colors.muted, marginTop: 4 }}>Key: {item.key}</Text>
        {item.sizeBytes ? <Text style={{ color: colors.muted, marginTop: 2 }}>Size: {item.sizeBytes} bytes</Text> : null}
        {created ? <Text style={{ color: colors.muted, marginTop: 2 }}>Created: {created.toLocaleString()}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing(1) }}>
          <StatusPill tone={(item.tlStatus || 'pending') === 'approved' ? 'success' : (item.tlStatus === 'changes-requested' ? 'warning' : 'neutral')} label={`TL: ${item.tlStatus || 'pending'}`} />
          <StatusPill tone={(item.amStatus || 'pending') === 'approved' ? 'success' : (item.amStatus === 'changes-requested' ? 'warning' : 'neutral')} label={`AM: ${item.amStatus || 'pending'}`} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing(3) }}>
          {canBAEdit && <PrimaryButton title="Edit" onPress={() => handleEdit(item)} />}
          {canOpen ? (
            <SecondaryButton title={Platform.OS === 'web' ? 'Preview' : 'Open'} onPress={() => Linking.openURL(item.publicUrl!)} />
          ) : null}
          {isAdminRole(userRole as any) && <SecondaryButton title="Delete" onPress={() => handleDelete(item)} />}
          {canTLReview && (
            <>
              <PrimaryButton title="TL Approve" onPress={async () => { try { await updateDoc(doc(db, 'role_play_video', item.id), { tlStatus: 'approved' }); fetchItems(); } catch {} }} />
              <SecondaryButton title="TL Request Changes" onPress={async () => { try { await updateDoc(doc(db, 'role_play_video', item.id), { tlStatus: 'changes-requested', status: 'awaiting-upload' }); fetchItems(); } catch {} }} />
            </>
          )}
      {canAMReview && (
            <>
              <PrimaryButton title="AM Approve" onPress={async () => { try { await updateDoc(doc(db, 'role_play_video', item.id), { amStatus: 'approved' }); fetchItems(); } catch {} }} />
        <SecondaryButton title="AM Request Changes" onPress={async () => { try { await updateDoc(doc(db, 'role_play_video', item.id), { amStatus: 'changes-requested', tlStatus: 'pending', status: 'awaiting-upload' }); fetchItems(); } catch {} }} />
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.body }]}>      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4) }}>
        <Text style={[styles.header, { color: colors.text }]}>Role Play Video</Text>
        {(isBAish(userRole as any) || isAdminRole(userRole as any)) ? (
          <PrimaryButton title="Add New" onPress={handleOpenAdd} />
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator />
      ) : items.length === 0 ? (
        <Text style={{ color: colors.muted }}>No items yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems().finally(() => setRefreshing(false)); }} />}
          contentContainerStyle={{ paddingBottom: spacing(20) }}
        />
      )}

      <Modal visible={isModalVisible} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.body }]}>          
          <Text style={[styles.modalTitle, { color: colors.text }]}>{modalType === 'add' ? 'Add Role Play Video' : 'Edit Role Play Video'}</Text>
          <ScrollView contentContainerStyle={{ paddingBottom: spacing(10) }}>
            <Text style={[styles.label, { color: colors.muted }]}>Key</Text>
            <TextInput value={form.key} onChangeText={(v) => setForm(prev => ({ ...prev, key: v }))} style={[styles.input, { borderColor: colors.border, color: colors.text }]} {...inputCommonProps} />

            <Text style={[styles.label, { color: colors.muted }]}>Public URL (optional)</Text>
            <TextInput value={form.publicUrl} onChangeText={(v) => setForm(prev => ({ ...prev, publicUrl: v }))} style={[styles.input, { borderColor: colors.border, color: colors.text }]} {...inputCommonProps} />

            <Text style={[styles.label, { color: colors.muted }]}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing(3) }}>
              {(['awaiting-upload','ready','archived'] as const).map(s => (
                <TouchableOpacity key={s} onPress={() => setForm(prev => ({ ...prev, status: s }))}>
                  <StatusPill tone={form.status === s ? 'primary' : 'neutral'} label={s} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>Content Type</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: spacing(3) }}>
              {(['video/mp4','video/quicktime'] as const).map(ct => (
                <TouchableOpacity key={ct} onPress={() => setForm(prev => ({ ...prev, contentType: ct }))}>
                  <StatusPill tone={form.contentType === ct ? 'primary' : 'neutral'} label={ct} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.muted }]}>Size (bytes)</Text>
            <TextInput value={String(form.sizeBytes || 0)} keyboardType="numeric" onChangeText={(v) => setForm(prev => ({ ...prev, sizeBytes: parseInt(v || '0', 10) || 0 }))} style={[styles.input, { borderColor: colors.border, color: colors.text }]} {...inputCommonProps} />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing(4), flexWrap: 'wrap' }}>
              <SecondaryButton title={pickedAssetUri ? 'Re-pick Video' : 'Pick Video (<= 5 min)'} onPress={pickVideoAndValidate} />
              {modalType === 'add' ? (
                <>
                  <PrimaryButton title="Create" onPress={handleSubmit} />
                  <PrimaryButton title={uploading ? 'Uploading…' : 'Create + Upload'} onPress={handleCreateAndUpload} />
                </>
              ) : (
                <>
                  <PrimaryButton title="Save" onPress={handleSubmit} />
                  <SecondaryButton title={uploading ? 'Uploading…' : 'Upload'} onPress={() => uploadSelectedVideo(selectedItem?.id || null)} />
                </>
              )}
            </View>
          </ScrollView>

          <SecondaryButton title="Close" onPress={() => setIsModalVisible(false)} style={{ marginTop: spacing(4) }} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing(4) },
  header: { ...typography.h1 },
  card: { padding: spacing(4), borderRadius: radius.md, borderWidth: 1, marginBottom: spacing(3), ...shadow.card },
  cardTitle: { ...typography.h2 },
  modalContainer: { flex: 1, padding: spacing(4) },
  modalTitle: { ...typography.h2, marginBottom: spacing(3) },
  label: { ...typography.label, marginTop: spacing(3), marginBottom: spacing(1) },
  input: { borderWidth: 1, borderRadius: radius.sm, padding: spacing(3) },
});
