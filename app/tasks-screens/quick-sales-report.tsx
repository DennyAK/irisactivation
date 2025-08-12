import { useState, useEffect, useMemo } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
// Phase 4 UI integration
import { palette, spacing, radius, shadow, typography } from '../../constants/Design';
import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { StatusPill } from '../../components/ui/StatusPill';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where, orderBy, startAfter, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import QuickSalesReportDetailsModal, { buildQuickSalesReportText } from '@/components/QuickSalesReportDetailsModal';
import * as Clipboard from 'expo-clipboard';
import { Roles, isAdminRole, isBAish, isTLish } from '../../constants/roles';
import { QRStatus, getToneForQRStatus, nextStatusOnSubmitQR, QR_STATUS_OPTIONS } from '../../constants/status';
import stateMachine from '../../constants/stateMachine';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';

export default function QuickSalesReportScreen() {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
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
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAMReviewModalVisible, setIsAMReviewModalVisible] = useState(false);
  // Expanded rows + details modal (description)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsItem, setDetailsItem] = useState<any | null>(null);
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const filteredReports = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return reports.filter(r => {
      const matchesSearch = !q || (String(r.outletName || '').toLowerCase().includes(q)) || (String(r.outletId || '').toLowerCase().includes(q));
      const matchesStatus = !statusFilter || (String(r.taskSalesReportQuickStatus || '') === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [reports, debouncedSearch, statusFilter]);

  // Sort by date toggle
  const [sortAsc, setSortAsc] = useState(false);

  const initialFormData = {
    guardDate: '',
    city: '',
    teamLeaderName: '',
    outletName: '',
    outletTier: '',
    assignedToBA: '',
    assignedToTL: '',
    outletId: '',
    outletProvince: '',
    outletCity: '',
    salesKegs330: '',
    salesKegs500: '',
    salesMd500: '',
    salesGdic400: '',
    salesSmoothPint330: '',
    salesSmoothCan330: '',
    salesGfesPint330: '',
    salesGfesCan330: '',
    salesGfesQuart620: '',
    salesGfesCanbig500: '',
    productRestock: false,
    productRestockDescription: '',
    taskSalesReportQuickStatus: '',

  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) setUserRole(docSnap.data().role);
        });
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (userRole && isFocused) {
      fetchReports(true);
    }
  }, [userRole, isFocused, sortAsc]);

  // Pagination state
  const PAGE_SIZE = 20;
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [endReached, setEndReached] = useState(false);

  const fetchReports = async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      setEndReached(false);
      setLastDoc(null);
    } else {
      if (loadingMore || endReached) return;
      setLoadingMore(true);
    }
    try {
      const collectionRef = collection(db, 'sales_report_quick');
      const uid = auth.currentUser?.uid || '';
      let base = collectionRef;
      let qRef: any;
  if (isBAish(userRole as any) && uid) {
        qRef = query(base, where('assignedToBA', '==', uid));
  } else if (isTLish(userRole as any) && uid) {
        qRef = query(base, where('assignedToTL', '==', uid));
      } else {
        qRef = query(base);
      }
      const dir: 'asc' | 'desc' = sortAsc ? 'asc' : 'desc';
      const cursor = reset ? null : lastDoc;
      const pageable = cursor
        ? query(qRef, orderBy('createdAt', dir), startAfter(cursor), limit(PAGE_SIZE))
        : query(qRef, orderBy('createdAt', dir), limit(PAGE_SIZE));
      const snapshot = await getDocs(pageable);
      if (snapshot.empty) {
        if (reset) setReports([]);
        setEndReached(true);
      }
      let list = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as any;
        return { id: docSnap.id, ...data };
      });

      // Fetch all outlets and build a map
      const outletsSnapshot = await getDocs(collection(db, 'outlets'));
      const outletMap: Record<string, any> = {};
      outletsSnapshot.forEach(doc => {
        outletMap[doc.id] = doc.data();
      });

      // Merge outlet info into each report
      list = list.map(report => {
        const outlet = outletMap[report.outletId] || {};
        return {
          ...report,
          outletName: outlet.outletName || report.outletName || '-',
          outletProvince: outlet.outletProvince || outlet.province || '-',
          outletCity: outlet.outletCity || outlet.city || '-',
          outletTier: outlet.outletTier || outlet.tier || '-',
        };
      });

      if (reset) {
        setReports(list);
      } else {
        setReports(prev => [...prev, ...list]);
      }
      const last = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastDoc(last);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      Alert.alert("Error", "Failed to fetch sales reports.");
    } finally {
      if (reset) setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleOpenModal = (type: 'add' | 'edit', item?: any) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setSelectedReport(item);
      setFormData({
        ...initialFormData,
        ...item,
        guardDate: item.guardDate?.toDate().toISOString().split('T')[0] || '',
      });
    } else {
      setSelectedReport(null);
      setFormData(initialFormData);
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = () => {
    const dataToSubmit: any = {
        ...formData,
        guardDate: formData.guardDate ? new Date(formData.guardDate) : null,
        entryTimestamp: serverTimestamp(),
    };
    // Compute next status via centralized helper, allow admin picker override
    if (selectedReport) {
  const prev = (selectedReport.taskSalesReportQuickStatus || '') as any;
      const adminChosen = formData.taskSalesReportQuickStatus as any;
      const computed = nextStatusOnSubmitQR((userRole as any) || '', prev);
      dataToSubmit.taskSalesReportQuickStatus = adminChosen || computed;
      dataToSubmit.updatedAt = serverTimestamp();
  dataToSubmit.updatedBy = auth.currentUser?.uid || 'unknown';
    }
    if (modalType === 'add') {
      addDoc(collection(db, "sales_report_quick"), { ...dataToSubmit, createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'unknown' })
        .then(() => {
          fetchReports(true);
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Add Failed", error.message));
    } else if (selectedReport) {
      updateDoc(doc(db, "sales_report_quick", selectedReport.id), dataToSubmit)
        .then(() => {
          fetchReports(true);
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Update Failed", error.message));
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Report", "Are you sure?", [
      { text: "Cancel" },
      { text: "OK", onPress: () => {
  deleteDoc(doc(db, "sales_report_quick", id)).then(() => fetchReports(true));
      }}
    ]);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: spacing(10) }} />;

  const canManage = userRole === Roles.Admin || userRole === Roles.Superadmin || userRole === Roles.AreaManager;
  const canUpdate = canManage || userRole === Roles.IrisBA || userRole === Roles.IrisTL;

  const renderItem = ({ item }: { item: any }) => {
  const status = item.taskSalesReportQuickStatus || '';
  const statusTone = getToneForQRStatus(status) as any;
    const isExpanded = !!expanded[item.id];
    return (
  <View style={[styles.card, isDark ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, shadowOpacity: 0 } : undefined]}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.outletName || '-'}</Text>
          <StatusPill label={status || '—'} tone={statusTone as any} />
        </View>
        <Text style={[styles.metaText, { color: colors.muted }]}>Outlet ID: <Text style={[styles.metaValue, { color: colors.text }]}>{item.outletId || '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>Date: <Text style={[styles.metaValue, { color: colors.text }]}>{item.guardDate?.toDate ? item.guardDate.toDate().toLocaleDateString() : '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>Province: <Text style={[styles.metaValue, { color: colors.text }]}>{item.outletProvince || '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>City: <Text style={[styles.metaValue, { color: colors.text }]}>{item.outletCity || '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>Tier: <Text style={[styles.metaValue, { color: colors.text }]}>{item.outletTier || '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>BA: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToBA || '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>TL: <Text style={[styles.metaValue, { color: colors.text }]}>{item.assignedToTL || '-'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.muted }]}>Created: <Text style={[styles.metaValue, { color: colors.text }]}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text></Text>
        {isExpanded && (
          <View style={{ marginTop: spacing(3) }}>
            <Text style={[styles.metaText, { color: colors.muted }]}>KEGS 330ml: <Text style={[styles.metaValue, { color: colors.text }]}>{item.salesKegs330 || '-'}</Text></Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>KEGS 500ml: <Text style={[styles.metaValue, { color: colors.text }]}>{item.salesKegs500 || '-'}</Text></Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>MD 500ml: <Text style={[styles.metaValue, { color: colors.text }]}>{item.salesMd500 || '-'}</Text></Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>GDIC 400ml: <Text style={[styles.metaValue, { color: colors.text }]}>{item.salesGdic400 || '-'}</Text></Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>Smooth Pint 330ml: <Text style={[styles.metaValue, { color: colors.text }]}>{item.salesSmoothPint330 || '-'}</Text></Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>GFES Can 330ml: <Text style={[styles.metaValue, { color: colors.text }]}>{item.salesGfesCan330 || '-'}</Text></Text>
            <Text style={[styles.metaText, { color: colors.muted }]}>Restock: <Text style={[styles.metaValue, { color: colors.text }]}>{item.productRestock ? 'Yes' : 'No'}</Text></Text>
            {!!item.productRestockDescription && (
              <Text style={[styles.metaText, { color: colors.muted }]}>Restock Desc: <Text style={[styles.metaValue, { color: colors.text }]}>{item.productRestockDescription}</Text></Text>
            )}
          </View>
        )}
          <View style={styles.actionsRow}>
          {userRole === Roles.IrisBA && stateMachine.canTransition('QR', Roles.IrisBA, status || QRStatus.Empty, QRStatus.DoneByBA) && (
            <PrimaryButton title="QR by BA" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
          )}
          {userRole === Roles.IrisTL && stateMachine.canTransition('QR', Roles.IrisTL, status || QRStatus.Empty, QRStatus.DoneByTL) && (
            <PrimaryButton title="QR by TL" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
          )}
            {userRole === Roles.AreaManager && stateMachine.canTransition('QR', Roles.AreaManager, status || QRStatus.Empty, QRStatus.ReviewByAM) && (
            <PrimaryButton title="QR by AM" onPress={() => { setSelectedReport(item); setIsAMReviewModalVisible(true); }} style={styles.actionBtn} />
          )}
          {(userRole === Roles.Admin || userRole === Roles.Superadmin) && (
            <SecondaryButton title="Edit" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
          )}
          {userRole === Roles.Superadmin && (
            <SecondaryButton title="Delete" onPress={() => handleDelete(item.id)} style={[styles.actionBtnDanger, isDark ? { backgroundColor: '#3f1d1d', borderColor: '#7f1d1d' } : {}]} />
          )}
          <View style={styles.iconActions}
          >
            <TouchableOpacity
              onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              style={[styles.iconButton, isDark ? { backgroundColor: '#1f2937' } : undefined]}
              accessibilityLabel={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={20} color={scheme === 'dark' ? '#9CA3AF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setDetailsItem(item); setDetailsVisible(true); }}
              style={[styles.iconButton, isDark ? { backgroundColor: '#1f2937' } : undefined]}
              accessibilityLabel="Open details"
            >
              <Ionicons name="newspaper-outline" size={20} color={scheme === 'dark' ? '#60A5FA' : '#007AFF'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderModal = () => (
    <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
  <View style={[styles.modalContent, isDark ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border } : undefined]}>
          <Text style={[styles.title, { color: colors.text }]}>{modalType === 'add' ? t('add') : t('edit')} {t('sales_report')}</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('personal_info')}</Text>
          <Text style={{ color: colors.text }}>Assigned to BA: {formData.assignedToBA || '-'}</Text>
          <Text style={{ color: colors.text }}>Assigned to TL: {formData.assignedToTL || '-'}</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Outlet / Venue Details</Text>

          <Text style={{ color: colors.text }}>Outlet ID: {formData.outletId || '-'}</Text>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{formData.outletName} - {formData.guardDate ? formData.guardDate : '-'}</Text>
          <Text style={{ color: colors.text }}>Province: {formData.outletProvince || '-'}</Text>
          <Text style={{ color: colors.text }}>City: {formData.outletCity || '-'}</Text>
          <Text style={{ color: colors.text }}>Outlet Tier: {formData.outletTier || '-'}</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Guinness Selling Data</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>KEGS (330ml) glass</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesKegs330} onChangeText={text => setFormData({...formData, salesKegs330: text})} placeholder="KEGS (330ml) glass" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>KEGS (500ml) glass</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesKegs500} onChangeText={text => setFormData({...formData, salesKegs500: text})} placeholder="KEGS (500ml) glass" keyboardType="numeric" />
            </View>
          </View>
          <Text style={[styles.inputLabel, { color: colors.muted }]}>MD (500ml) can</Text>
          <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesMd500} onChangeText={text => setFormData({...formData, salesMd500: text})} placeholder="MD (500ml) can" keyboardType="numeric" />
          <Text style={[styles.inputLabel, { color: colors.muted }]}>GDIC (400ml) can</Text>
          <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGdic400} onChangeText={text => setFormData({...formData, salesGdic400: text})} placeholder="GDIC (400ml) can" keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>SMOOTH PINT 330ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesSmoothPint330} onChangeText={text => setFormData({...formData, salesSmoothPint330: text})} placeholder="SMOOTH PINT 330ml" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>SMOOTH CAN 330ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesSmoothCan330} onChangeText={text => setFormData({...formData, salesSmoothCan330: text})} placeholder="SMOOTH CAN 330ml" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES PINT 330ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGfesPint330} onChangeText={text => setFormData({...formData, salesGfesPint330: text})} placeholder="GFES PINT 330ml" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES QUART 620ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGfesQuart620} onChangeText={text => setFormData({...formData, salesGfesQuart620: text})} placeholder="GFES QUART 620ml" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES CAN 330ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGfesCan330} onChangeText={text => setFormData({...formData, salesGfesCan330: text})} placeholder="GFES CAN 330ml" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES CANBIG 500ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGfesCanbig500} onChangeText={text => setFormData({...formData, salesGfesCanbig500: text})} placeholder="GFES CANBIG 500ml" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES CAN 330ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGfesCan330} onChangeText={text => setFormData({...formData, salesGfesCan330: text})} placeholder="GFES CAN 330ml" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES CANBIG 500ml</Text>
              <TextInput {...inputCommonProps} style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]} value={formData.salesGfesCanbig500} onChangeText={text => setFormData({...formData, salesGfesCanbig500: text})} placeholder="GFES CANBIG 500ml" keyboardType="numeric" />
            </View>
          </View>
          {/* Admin-only: Quick Sales Report Status */}
          {(userRole === 'admin' || userRole === 'superadmin') && modalType === 'edit' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Status (Admin)</Text>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Task Quick Sales Report Status</Text>
              <View style={[styles.input, { padding: 0 }, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border } : undefined]}> 
                <Picker
                  selectedValue={formData.taskSalesReportQuickStatus}
                  onValueChange={(value) => setFormData({ ...formData, taskSalesReportQuickStatus: value as string })}
                  style={{ height: 40 }}
                >
                  {(() => {
                    const current = String(formData.taskSalesReportQuickStatus || '');
                    const role = String(userRole || '');
                    const opts = stateMachine.nextOptionsForRole('QR', role as any, current as any);
                    const all = [QRStatus.Empty, ...opts];
                    return all.map(value => (
                      <Picker.Item key={value} label={value} value={value} />
                    ));
                  })()}
                </Picker>
              </View>
            </>
          )}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Restock Information</Text>
          <View style={styles.switchContainer}><Text style={{ color: colors.text }}>Product Restock?</Text><Switch value={formData.productRestock} onValueChange={val => setFormData({...formData, productRestock: val})} /></View>
          {formData.productRestock && (
            <TextInput
              {...inputCommonProps}
              style={[styles.input, isDark ? { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text } : undefined]}
              value={formData.productRestockDescription}
              onChangeText={text => setFormData({...formData, productRestockDescription: text})}
              placeholder="Restock Description"
            />
          )}
          <View style={styles.buttonContainer}>
            <PrimaryButton title={modalType === 'add' ? t('add') : t('update')} onPress={handleFormSubmit} />
            <SecondaryButton title={t('cancel')} onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

  const renderAMReviewModal = () => (
    <Modal visible={isAMReviewModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsAMReviewModalVisible(false)}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
  <View style={[styles.modalContent, isDark ? { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border } : undefined]}>
          <Text style={[styles.title, { color: colors.text }]}>QR Review by AM</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personnel Information</Text>
          <Text style={{ color: colors.text }}>Assigned to BA: {selectedReport?.assignedToBA || '-'} </Text>
          <Text style={{ color: colors.text }}>Assigned to TL: {selectedReport?.assignedToTL || '-'} </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Outlet / Venue Details</Text>
          <Text style={{ color: colors.text }}>Outlet ID: {selectedReport?.outletId || '-'} </Text>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{selectedReport?.outletName} - {selectedReport?.guardDate?.toDate ? selectedReport.guardDate.toDate().toLocaleDateString() : '-'}</Text>
          <Text style={{ color: colors.text }}>Province: {selectedReport?.outletProvince || '-'} </Text>
          <Text style={{ color: colors.text }}>City: {selectedReport?.outletCity || '-'} </Text>
          <Text style={{ color: colors.text }}>Outlet Tier: {selectedReport?.outletTier || '-'} </Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Guinness Selling Data</Text>
          <Text style={{ color: colors.text }}>KEGS (330ml) glass: {selectedReport?.salesKegs330 || '-'}</Text>
          <Text style={{ color: colors.text }}>KEGS (500ml) glass: {selectedReport?.salesKegs500 || '-'}</Text>
          <Text style={{ color: colors.text }}>MD (500ml) can: {selectedReport?.salesMd500 || '-'}</Text>
          <Text style={{ color: colors.text }}>GDIC (400ml) can: {selectedReport?.salesGdic400 || '-'}</Text>
          <Text style={{ color: colors.text }}>SMOOTH PINT 330ml: {selectedReport?.salesSmoothPint330 || '-'}</Text>
          <Text style={{ color: colors.text }}>SMOOTH CAN 330ml: {selectedReport?.salesSmoothCan330 || '-'}</Text>
          <Text style={{ color: colors.text }}>GFES PINT 330ml: {selectedReport?.salesGfesPint330 || '-'}</Text>
          <Text style={{ color: colors.text }}>GFES CAN 330ml: {selectedReport?.salesGfesCan330 || '-'}</Text>
          <Text style={{ color: colors.text }}>GFES QUART 620ml: {selectedReport?.salesGfesQuart620 || '-'}</Text>
          <Text style={{ color: colors.text }}>GFES CANBIG 500ml: {selectedReport?.salesGfesCanbig500 || '-'}</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Restock Information</Text>
          <Text style={{ color: colors.text }}>Product Restock: {selectedReport?.productRestock ? 'Yes' : 'No'}</Text>
          <Text style={{ color: colors.text }}>Restock Description: {selectedReport?.productRestockDescription || '-'}</Text>
          <View style={{ marginTop: 20 }}>
            <View style={{ marginBottom: 12 }}>
  <PrimaryButton title="Confirm QR Review by AM" onPress={async () => {
                try {
    await updateDoc(doc(db, "sales_report_quick", selectedReport.id), { taskSalesReportQuickStatus: QRStatus.ReviewByAM, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
      fetchReports(true);
                  setIsAMReviewModalVisible(false);
                  Alert.alert('Success', 'Status updated to QR Review by AM.');
                } catch (e) {
                  Alert.alert('Error', 'Failed to update status.');
                }
              }} />
            </View>
            <View style={{ marginBottom: 12 }}>
  <SecondaryButton title="Review back to TL" onPress={async () => {
                try {
    await updateDoc(doc(db, "sales_report_quick", selectedReport.id), { taskSalesReportQuickStatus: QRStatus.ReviewBackToTL, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
      fetchReports(true);
                  setIsAMReviewModalVisible(false);
                  Alert.alert('Success', 'Status updated to Review back to TL.');
                } catch (e) {
                  Alert.alert('Error', 'Failed to update status.');
                }
              }} />
            </View>
            <View>
              <SecondaryButton title={t('cancel')} onPress={() => setIsAMReviewModalVisible(false)} />
            </View>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <View style={[styles.screen, isDark ? { backgroundColor: colors.body } : undefined]}>
      <FilterHeader
        title={t('quick_sales_report')}
        search={search}
        status={statusFilter}
        statusOptions={QR_STATUS_OPTIONS}
        placeholder={t('search_placeholder') || 'Search outlet or ID'}
        storageKey="filters:qr"
  sortAsc={sortAsc}
  onToggleSort={() => setSortAsc(prev => !prev)}
        onApply={({ search: s, status }) => { setSearch(s); setStatusFilter(status); }}
        onClear={() => { setSearch(''); setStatusFilter(''); }}
      />
      {filteredReports.length === 0 ? (
        <EmptyState onReset={() => { setSearch(''); setStatusFilter(''); }} />
      ) : (
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchReports(true);
              setRefreshing(false);
            }}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => fetchReports(false)}
      />)}
      <QuickSalesReportDetailsModal
        visible={detailsVisible}
        item={detailsItem}
  onCopyAll={detailsItem ? async () => { await Clipboard.setStringAsync(buildQuickSalesReportText(detailsItem, 'text')); Alert.alert('Copied to clipboard'); } : undefined}
        onClose={() => setDetailsVisible(false)}
      />
  {renderModal()}
  {renderAMReviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: spacing(5), paddingTop: spacing(10) },
  screenTitle: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
  // Backwards compatibility for existing internal modal text using styles.title / styles.itemTitle
  title: { ...typography.h2, color: palette.text, marginBottom: spacing(5), textAlign: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '700', color: palette.text },
  rowInputs: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: spacing(4) },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing(6), marginBottom: spacing(3), color: palette.text },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(5), ...shadow.card },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(2) },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, flex: 1, marginRight: spacing(3) },
  metaText: { fontSize: 12, color: palette.textMuted, marginBottom: 2 },
  metaValue: { color: palette.text, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing(4) },
  actionBtn: { flexGrow: 1, marginRight: spacing(3), marginBottom: spacing(3) },
  actionBtnDanger: { flexGrow: 1, marginRight: spacing(3), marginBottom: spacing(3), backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', backgroundColor: palette.surface, padding: spacing(6), borderRadius: radius.lg, marginVertical: spacing(10) },
  input: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, padding: spacing(3), marginBottom: spacing(4), backgroundColor: palette.surfaceAlt },
  buttonContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3), marginTop: spacing(5) },
  inputLabel: { fontSize: 11, color: palette.textMuted, marginBottom: 2, marginLeft: 2, fontWeight: '500' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing(4), paddingHorizontal: spacing(2) },
  iconActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginLeft: 8 },
});
