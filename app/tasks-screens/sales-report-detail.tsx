import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import SalesReportModal from '../../components/SalesReportModal';
import SalesReportDetailsModal, { buildSalesReportText } from '../../components/SalesReportDetailsModal';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';


export default function SalesReportDetailScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  type ReportItem = {
    id: string;
    assignedToBA?: string;
    assignedToTL?: string;
    outletId?: string;
    outletName?: string;
    outletProvince?: string;
    outletCity?: string;
    salesKegs330?: string;
    salesKegs500?: string;
    salesMd500?: string;
    salesGdic400?: string;
    salesSmoothPint330?: string;
    salesSmoothCan330?: string;
    salesGfesPint330?: string;
    salesGfesCan330?: string;
    salesGfesQuart620?: string;
    salesGfesCanbig500?: string;
    merchandiseDescription1?: string;
    merchandiseSold1?: string;
    merchandiseDescription2?: string;
    merchandiseSold2?: string;
    merchandiseDescription3?: string;
    merchandiseSold3?: string;
    merchandiseDescription4?: string;
    merchandiseSold4?: string;
    merchandiseDescription5?: string;
    merchandiseSold5?: string;
    tablesAllCompetitor?: string;
    tablesAllGuinnessMixedCompetitor?: string;
    salesReportDetailStatus?: string;
    [key: string]: any;
  };
  type Outlet = {
  outletName?: string;
  outletProvince?: string;
  outletCity?: string;
  outletCapacity?: string;
  outletNoOfTableAVailable?: string;
  // ...other properties
  };
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'review'>('add');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [descriptionItem, setDescriptionItem] = useState<any>(null);
  // Unified details modal
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsMode, setDetailsMode] = useState<'review' | 'description'>('description');
  // Track expanded items in the list (to show full details like old UI)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const initialFormData = {
    // Activity Information
    week: '', channel: '', activityName: '', tier: '', date: '', city: '', area: '', outletVenueName: '', capacity: '', outletId: '',
    // Outlet Info
    outletName: '', outletProvince: '', outletCity: '', outletCapacity: '', outletNoOfTableAVailable: '',
    // Assigned
    assignedToBA: '', assignedToTL: '',
    // Guinness Selling Data
    salesKegs330: '', salesKegs500: '', salesMd500: '', salesGdic400: '', salesSmoothPint330: '', salesSmoothCan330: '', salesGfesPint330: '', salesGfesCan330: '', salesGfesQuart620: '', salesGfesCanbig500: '',
    // Personnel Information
    outletEventPic: '', baCount: '', crewCanvasserCount: '', teamLeaderName: '', spgName: '',
    // Sampling Data
    samplingSmoothBottle: '', samplingSmoothOnLips: '', samplingGfesBottle: '', samplingGfesOnLips: '', samplingTargetAchievement: '',
    // Added missing properties for sampling
    samplingKegsOnLips: '', samplingMdOnLips: '', samplingSmoothBottleToBuy: '', samplingGfesBottleToBuy: '', samplingKegsToBuy: '', samplingMdToBuy: '', samplingGdicToBuy: '',
    samplingSmoothToBuy: '', samplingGfesToBuy: '', 
    samplingGdicOnLips: '', samplingGdicBottle: '', samplingGdicBottleToBuy: '',
    samplingMd: '', samplingSmoothOnLipsToBuy: '', samplingGfesOnLipsToBuy: '', samplingKegsOnLipsToBuy: '', samplingMdOnLipsToBuy: '', samplingGdicOnLipsToBuy: '',
    samplingGdic: '', samplingKegs: '',
    // Default value for samplingDataAvailable
    samplingDataAvailable: false,
    // Selling Data
    salesSmoothCan: '', salesSmoothBotol: '', salesGfesCan: '', salesGfesCanBig: '', salesGfesBotol: '', salesGfesQuart: '', salesKegs: '', salesMd: '', salesGdic: '',
    // Call and Customer Data
    callsOffers: '', effectiveCalls: '', callsVsEffectivePercentage: '',
    // Promotional Activities
    guinnessSmoothPromotionAvailable: false, promoSmoothDescription: '', guinnessGfesPromotionAvailable: false, promoGfesDescription: '',
    guinnessKegsPromotionAvailable: false, promoKegsDescription: '',
    guinnessMicroDraughtPromotionAvailable: false, promoMicrodraughtDescription: '',
    guinnessGdicPromotionAvailable: false, promoGdicDescription: '', packagesSold: '', repeatOrders: '',
    promoSmoothRepeatOrder: '', promoSmoothSold: '', promoGfesRepeatOrder: '', promoGfesSold: '', promoKegsRepeatOrder: '', promoKegsSold: '', promoMicrodraughtRepeatOrder: '', promoMicrodraughtSold: '', promoGdicRepeatOrder: '', promoGdicSold: '',
    //Type 2
    promoSmoothDescriptionType2: '', promoSmoothRepeatOrderType2: '', promoSmoothSoldType2: '',
    promoGfesDescriptionType2: '', promoGfesRepeatOrderType2: '', promoGfesSoldType2: '',
    promoKegsDescriptionType2: '', promoKegsRepeatOrderType2: '', promoKegsSoldType2: '',
    promoMicrodraughtDescriptionType2: '', promoMicrodraughtRepeatOrderType2: '', promoMicrodraughtSoldType2: '',
    promoGdicDescriptionType2: '', promoGdicRepeatOrderType2: '', promoGdicSoldType2: '',
    // Visitor and Consumer Data
  visitorsOverall: '', visitorsAlcoholDrinkers: '', visitorsAllBeerDrinkers: '', visitorsAllGuinness: '', visitorsAllCompetitor: '', visitorsAllGuinnessMixedCompetitor: '',
    drinkersSmooth: '', drinkersGfes: '', drinkersKegs: '', drinkersMicrodraught: '', drinkersGdic: '', drinkersMixed: '',
    tablesOverall: '', tablesAlcoholDrinkers: '', tablesNonAlcoholDrinkers: '', tablesAllBeerDrinkers: '', tablesAllGuinness: '', tablesAllCompetitor: '', tablesAllGuinnessMixedCompetitor: '',
    // Competitor Sales
    competitorBintangAvailable: false, competitorBintangGlass: '', competitorBintangPint: '', competitorBintangQuart: '', competitorBintangCanSmall: '', competitorBintangCanBig: '', competitorBintangPromoDescription: '', competitorBintangPromoSold: '',
    competitorBintangCrystalAvailable: false, competitorBintangCrystalGlass: '', competitorBintangCrystalPint: '', competitorBintangCrystalQuart: '', competitorBintangCrystalCanSmall: '', competitorBintangCrystalCanBig: '', competitorBintangCrystalPromoDescription: '', competitorBintangCrystalPromoSold: '',
    competitorHeinekenAvailable: false, competitorHeinekenGlass: '', competitorHeinekenPint: '', competitorHeinekenQuart: '', competitorHeinekenCanSmall: '', competitorHeinekenCanBig: '', competitorHeinekenPromoDescription: '', competitorHeinekenPromoSold: '',
    competitorHeinekenImportAvailable: false, competitorHeinekenImportGlass: '', competitorHeinekenImportPint: '', competitorHeinekenImportQuart: '', competitorHeinekenImportCanSmall: '', competitorHeinekenImportCanBig: '', competitorHeinekenImportPromoDescription: '', competitorHeinekenImportPromoSold: '',
    competitorErdingerImportAvailable: false, competitorErdingerImportGlass: '', competitorErdingerImportPint: '', competitorErdingerImportQuart: '', competitorErdingerImportCanSmall: '', competitorErdingerImportCanBig: '', competitorErdingerImportPromoDescription: '', competitorErdingerImportPromoSold: '',
    competitorBudweizerImportAvailable: false, competitorBudweizerImportGlass: '', competitorBudweizerImportPint: '', competitorBudweizerImportQuart: '', competitorBudweizerImportCanSmall: '', competitorBudweizerImportCanBig: '', competitorBudweizerImportPromoDescription: '', competitorBudweizerImportPromoSold: '',
    competitorAnkerAvailable: false, competitorAnkerGlass: '', competitorAnkerPint: '', competitorAnkerQuart: '', competitorAnkerCanSmall: '', competitorAnkerCanBig: '', competitorAnkerPromoDescription: '', competitorAnkerPromoSold: '',
    competitorBalihaiAvailable: false, competitorBalihaiGlass: '', competitorBalihaiPint: '', competitorBalihaiQuart: '', competitorBalihaiCanSmall: '', competitorBalihaiCanBig: '', competitorBalihaiPromoDescription: '', competitorBalihaiPromoSold: '',
    competitorProstAvailable: false, competitorProstGlass: '', competitorProstPint: '', competitorProstQuart: '', competitorProstCanSmall: '', competitorProstCanBig: '', competitorProstPromoDescription: '', competitorProstPromoSold: '',
    competitorSanMiguelAvailable: false, competitorSanMiguelGlass: '', competitorSanMiguelPint: '', competitorSanMiguelQuart: '', competitorSanMiguelCanSmall: '', competitorSanMiguelCanBig: '', competitorSanMiguelPromoDescription: '', competitorSanMiguelPromoSold: '',
    competitorSingarajaAvailable: false, competitorSingarajaGlass: '', competitorSingarajaPint: '', competitorSingarajaQuart: '', competitorSingarajaCanSmall: '', competitorSingarajaCanBig: '', competitorSingarajaPromoDescription: '', competitorSingarajaPromoSold: '',
    competitorCarlsbergAvailable: false, competitorCarlsbergGlass: '', competitorCarlsbergPint: '', competitorCarlsbergQuart: '', competitorCarlsbergCanSmall: '', competitorCarlsbergCanBig: '', competitorCarlsbergPromoDescription: '', competitorCarlsbergPromoSold: '',
    competitorDraftBeerAvailable: false, competitorDraftBeerGlass: '', competitorDraftBeerPint: '', competitorDraftBeerQuart: '', competitorDraftBeerCanSmall: '', competitorDraftBeerCanBig: '', competitorDraftBeerPromoDescription: '', competitorDraftBeerPromoSold: '',
    competitorKuraKuraAvailable: false, competitorKuraKuraGlass: '', competitorKuraKuraPint: '', competitorKuraKuraQuart: '', competitorKuraKuraCanSmall: '', competitorKuraKuraCanBig: '', competitorKuraKuraPromoDescription: '', competitorKuraKuraPromoSold: '',
    competitorIslandBrewingAvailable: false, competitorIslandBrewingGlass: '', competitorIslandBrewingPint: '', competitorIslandBrewingQuart: '', competitorIslandBrewingCanSmall: '', competitorIslandBrewingCanBig: '', competitorIslandBrewingPromoDescription: '', competitorIslandBrewingPromoSold: '',
    competitorOthersAvailable: false, competitorOthersGlass: '', competitorOthersPint: '', competitorOthersQuart: '', competitorOthersCanSmall: '', competitorOthersCanBig: '', competitorOthersPromoDescription: '', competitorOthersPromoSold: '',
    competitorActivityDescription: '', competitorActivitySpgTotal: '',
    // Merchandise
    merchandiseAvailable: false, merchandiseDistributed: '', stoutieProgramParticipation: false, loyaltyProgramDetails: '',
    // Programs and Digital Activity
    stoutieprogramParticipation: false, stoutieProgramDescription: '', stoutieProgramCallReach: '', stoutieProgramPacketSold: '', stoutieProgramEngagePeople: '',
    loyaltyProgramParticipation: false, loyaltyProgramDescription: '', loyaltyProgramCallReach: '', loyaltyProgramPacketSold: '', loyaltyProgramEngagePeople: '',
    brightballParticipation: false, brightballDescription: '', brightballCallReach: '', brightballPacketSold: '', brightballEngagePeople: '',
    sovProgramParticipation: false, sovProgramDescription: '', sovProgramCallReach: '', sovProgramPacketSold: '', sovProgramEngagePeople: '',
    // Notes and Performance
    issuesNotesRequests: '', learningPoints: '', beerMarketSize: '', totalGuinnessSales: '', achievementPercentage: '',
    merchandiseDescription1: '', merchandiseSold1: '',
    merchandiseDescription2: '', merchandiseSold2: '',
    merchandiseDescription3: '', merchandiseSold3: '',
    merchandiseDescription4: '', merchandiseSold4: '',
    merchandiseDescription5: '', merchandiseSold5: '',
    // Bali Specific Data
    baliSpecificVisitorData: false,
    baliLocalVisitors: '', baliForeignVisitors: '', baliLocalGuinnessBuyers: '', baliForeignGuinnessBuyers: '',
    // AMS Data
    amsGfes: '', amsSmooth: '', amsMicrodraught: '', amsKegs: '', amsTotal: '',
    salesReportDetailStatus: '',
    weatherStatus: '', // Added missing property
  };

  const [formData, setFormData] = useState(initialFormData);
  // State for early_task_assessment merchandiseAvailable
  const [assessmentMerchandiseAvailable, setAssessmentMerchandiseAvailable] = useState<boolean | null>(null);

  // Open modal for add or edit
  const handleOpenModal = (type: 'add' | 'edit', item?: any) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setFormData(prev => ({ ...prev, ...item }));
      setSelectedReport(item);
    } else {
      setSelectedReport(null);
      setFormData(initialFormData);
    }
    setIsModalVisible(true);
  };

  // Submit handler to add/update Firestore
  const handleFormSubmit = async () => {
    try {
      const now = serverTimestamp();
      if (modalType === 'edit' && selectedReport?.id) {
        const ref = doc(db, 'sales_report_detail', selectedReport.id);
        await updateDoc(ref, {
          ...formData,
          updatedAt: now,
          updatedBy: auth.currentUser?.email || auth.currentUser?.uid || 'unknown',
        });
      } else {
        const ref = collection(db, 'sales_report_detail');
        await addDoc(ref, {
          ...formData,
          createdAt: now,
          createdBy: auth.currentUser?.email || auth.currentUser?.uid || 'unknown',
        });
      }
      await fetchReports();
      setIsModalVisible(false);
    } catch (e) {
      console.error('handleFormSubmit error', e);
      Alert.alert('Error', 'Failed to save report');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then((docSnap: DocumentSnapshot) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
            console.log('User role:', docSnap.data().role);
          }
        });
      } else {
        setUserRole(null);
        console.log('User role: null');
      }
    });
    return () => unsubscribe();
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (userRole && isFocused) {
      fetchReports();
    }
  }, [userRole, isFocused]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const reportsRef = collection(db, 'sales_report_detail');
      const uid = auth.currentUser?.uid || '';
      const email = auth.currentUser?.email || '';
      let snapshot;
      if (userRole === 'Iris - BA' && (uid || email)) {
        try {
          snapshot = await getDocs(query(reportsRef, where('assignedToBA', '==', uid)));
        } catch {}
        if (!snapshot || snapshot.empty) {
          snapshot = await getDocs(query(reportsRef, where('assignedToBA', '==', email)));
        }
      } else if (userRole === 'Iris - TL' && (uid || email)) {
        try {
          snapshot = await getDocs(query(reportsRef, where('assignedToTL', '==', uid)));
        } catch {}
        if (!snapshot || snapshot.empty) {
          snapshot = await getDocs(query(reportsRef, where('assignedToTL', '==', email)));
        }
      } else {
        snapshot = await getDocs(reportsRef);
      }
      const items: ReportItem[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setReports(items);
    } catch (err) {
      console.error('fetchReports error', err);
      Alert.alert('Error', 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Report", "Are you sure?", [
      { text: "Cancel" },
      { text: "OK", onPress: () => {
        deleteDoc(doc(db, "sales_report_detail", id)).then(() => fetchReports());
      }}
    ]);
  };

  if (loading) return <ActivityIndicator />;

  const canDelete = userRole === 'admin' || userRole === 'superadmin' || userRole === 'area manager';
  const canUpdate = canDelete || userRole === 'Iris - BA' || userRole === 'Iris - TL';


  // Helper: map status to badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done By BA':
        return { bg: '#E6F0FF', fg: '#1E66F5' };
      case 'Review back to BA':
        return { bg: '#FFF4E5', fg: '#B54708' };
      case 'Done by TL':
        return { bg: '#F0E6FF', fg: '#6941C6' };
      case 'Review back to TL':
        return { bg: '#FFF4E5', fg: '#B54708' };
      case 'Done by AM':
        return { bg: '#E7F5EC', fg: '#2E7D32' };
      default:
        return { bg: '#EEEEEE', fg: '#555555' };
    }
  };

  

  const renderItem = ({ item }: { item: any }) => {
    const canEditBA = userRole === 'Iris - BA' && (!item.salesReportDetailStatus || item.salesReportDetailStatus === 'Review back to BA');
    const canEditTL = userRole === 'Iris - TL' && (item.salesReportDetailStatus === 'Done By BA' || item.salesReportDetailStatus === 'Review back to TL');
    const canEditAdmin = userRole === 'admin' || userRole === 'superadmin';
    const canReview = userRole === 'area manager' && item.salesReportDetailStatus === 'Done by TL';
    const canRemove = userRole === 'superadmin';

    const status: string = item.salesReportDetailStatus || '-';
    const badgeColor = getStatusColor(status);

    const isExpanded = !!expanded[item.id];
    return (
      <View style={styles.pill}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
          <Text style={styles.pillTitle} numberOfLines={1}>
            {item.outletName || '-'}
          </Text>
          <Text style={styles.pillSubtitle} numberOfLines={1}>
            {(item.outletCity || '-') + (item.outletProvince ? `, ${item.outletProvince}` : '')} • {item.channel || '-'} • {item.tier || '-'}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[styles.statusBadgeText, { color: badgeColor.fg }]} numberOfLines={1}>{status}</Text>
            </View>
            <Text style={styles.metaText}>
              {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '-'}
            </Text>
          </View>
          {isExpanded && (
            <View style={styles.detailsContainer}>
              <Text>Outlet ID: {item.outletId || '-'}</Text>
              <Text>Outlet Name: {item.outletName || '-'}</Text>
              <Text>Province: {item.outletProvince || '-'}</Text>
              <Text>City: {item.outletCity || '-'}</Text>
              <Text>Activity Name: {item.activityName || '-'}</Text>
              <Text>Channel: {item.channel || '-'}</Text>
              <Text>Tier: {item.tier || '-'}</Text>
              <Text>Assigned to BA: {item.assignedToBA || '-'}</Text>
              <Text>Assigned to TL: {item.assignedToTL || '-'}</Text>
              <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
              <Text>Created By: {item.createdBy || '-'}</Text>
              <Text>Task ID: {item.tasksId || '-'}</Text>
              <Text>Task Sales Report Detail Status: {item.salesReportDetailStatus || '-'}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.iconActions}>
          <TouchableOpacity
            onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
            style={styles.iconButton}
            accessibilityLabel="Expand"
          >
            <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { setDescriptionItem(item); setDetailsMode('description'); setDetailsVisible(true); }}
            style={styles.iconButton}
            accessibilityLabel="Detail"
          >
            <Ionicons name="newspaper-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          {(canEditBA || canEditTL || canEditAdmin) && (
            <TouchableOpacity
              onPress={() => handleOpenModal('edit', item)}
              style={styles.iconButton}
              accessibilityLabel="Edit"
            >
              <Ionicons name="create-outline" size={20} color="#333" />
            </TouchableOpacity>
          )}
          {canReview && (
            <TouchableOpacity
              onPress={() => { setSelectedReport(item); setDetailsMode('review'); setDetailsVisible(true); }}
              style={styles.iconButton}
              accessibilityLabel="Review"
            >
              <Ionicons name="checkbox-outline" size={20} color="#28a745" />
            </TouchableOpacity>
          )}
          {canRemove && (
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.iconButton}
              accessibilityLabel="Delete"
            >
              <Ionicons name="trash-outline" size={20} color="#dc3545" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // (Inlined legacy modal content removed; now handled via SalesReportModal component)
  const getDescriptionText = (item: any) => buildSalesReportText(item, 'text');

  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Report Detail</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchReports();
              setRefreshing(false);
            }}
          />
        }
      />
      <SalesReportModal
        visible={isModalVisible}
        modalType={modalType}
        formData={formData}
        setFormData={setFormData}
        userRole={userRole}
        assessmentMerchandiseAvailable={assessmentMerchandiseAvailable}
        setAssessmentMerchandiseAvailable={setAssessmentMerchandiseAvailable}
        handleFormSubmit={handleFormSubmit}
        onClose={() => setIsModalVisible(false)}
      />
      <SalesReportDetailsModal
        visible={detailsVisible}
        mode={detailsMode}
        item={detailsMode === 'review' ? selectedReport : descriptionItem}
        userRole={userRole}
        onCopyAll={detailsMode === 'description' && descriptionItem ? async () => { await Clipboard.setStringAsync(getDescriptionText(descriptionItem)); Alert.alert('Copied to clipboard'); } : undefined}
        onDoneByAM={detailsMode === 'review' && userRole === 'area manager' && selectedReport?.id ? async () => {
          try {
            const ref = doc(db, 'sales_report_detail', selectedReport.id);
            await updateDoc(ref, { salesReportDetailStatus: 'Done by AM', updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || auth.currentUser?.email || 'unknown' });
            await fetchReports();
            setDetailsVisible(false);
          } catch (e) {
            console.error('Done by AM failed', e);
            Alert.alert('Error', 'Failed to update status');
          }
        } : undefined}
        onClose={() => setDetailsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rowInputs: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 10 },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  inputLabel: { fontSize: 10, color: '#888', marginBottom: 2, marginLeft: 2 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
    marginLeft: 8,
  },
  // New pill list styles
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  pillSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 11, color: '#6B7280', marginLeft: 8 },
  iconActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  detailsContainer: {
    marginTop: 8,
  },
});
