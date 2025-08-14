import { useI18n } from '@/components/I18n';
import { useEffectiveScheme } from '@/components/ThemePreference';
import { useState, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SalesReportModal from '../../components/SalesReportModal';
import SalesReportDetailsModal, { buildSalesReportText } from '../../components/SalesReportDetailsModal';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where, orderBy, startAfter, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { StatusPill } from '../../components/ui/StatusPill';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SRDStatus, getToneForSRDStatus, nextStatusOnSubmitSRD, SRD_STATUS_OPTIONS } from '../../constants/status';
import stateMachine from '../../constants/stateMachine';
import FilterHeader from '../../components/ui/FilterHeader';
import useDebouncedValue from '../../components/hooks/useDebouncedValue';
import EmptyState from '../../components/ui/EmptyState';
import { Roles, isAdminRole, isBAish, isTLish } from '../../constants/roles';
import { useAppSettings } from '@/components/AppSettings';


export default function SalesReportDetailScreen() {
  const params = useLocalSearchParams<{ detailId?: string }>();
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    body: isDark ? '#0b1220' : '#f1f5f9',
    surface: isDark ? '#111827' : '#FFFFFF',
    surfaceAlt: isDark ? '#0f172a' : '#f8fafc',
    border: isDark ? '#1f2937' : '#E5E7EB',
    text: isDark ? '#e5e7eb' : '#111827',
    muted: isDark ? '#94a3b8' : '#6B7280',
  };
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
  // Resolver caches
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [outlets, setOutlets] = useState<Array<{ id: string; outletName?: string }>>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'review'>('add');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [descriptionItem, setDescriptionItem] = useState<any>(null);
  // Unified details modal
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsMode, setDetailsMode] = useState<'review' | 'description'>('description');
  const navigation: any = useNavigation();
  // Track expanded items in the list (to show full details like old UI)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // Sort toggle (default newest first)
  const [sortAsc, setSortAsc] = useState(false);
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { debugHeaderEnabled } = useAppSettings();
  const filteredReports = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return reports.filter(r => {
      const matchesSearch = !q || (String(r.outletName || '').toLowerCase().includes(q)) || (String(r.outletId || '').toLowerCase().includes(q));
      const matchesStatus = !statusFilter || (String(r.salesReportDetailStatus || '') === statusFilter);
      return matchesSearch && matchesStatus;
    });
  }, [reports, debouncedSearch, statusFilter]);

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
        // Advance status based on role and previous status (centralized)
        const prevStatus = (selectedReport.salesReportDetailStatus || '') as any;
        const adminChosen = formData.salesReportDetailStatus as any; // admins/superadmins can set directly via picker
        const computed = nextStatusOnSubmitSRD((userRole as any) || '', prevStatus);
        const nextStatus = adminChosen || computed;

        const ref = doc(db, 'sales_report_detail', selectedReport.id);
        await updateDoc(ref, {
          ...formData,
          salesReportDetailStatus: nextStatus,
          updatedAt: now,
          updatedBy: auth.currentUser?.uid || 'unknown',
        });
      } else {
        const ref = collection(db, 'sales_report_detail');
        await addDoc(ref, {
          ...formData,
          createdAt: now,
          createdBy: auth.currentUser?.uid || 'unknown',
        });
      }
      await fetchReports();
      setIsModalVisible(false);
    } catch (e) {
      console.error('handleFormSubmit error', e);
  Alert.alert(t('error') || 'Error', t('failed_to_save_report') || 'Failed to save report');
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
      fetchReports(true);
    }
  }, [userRole, isFocused, sortAsc]);

  // Temporary DBG header label (toggleable)
  useEffect(() => {
    if (!debugHeaderEnabled) {
      navigation.setOptions?.({ headerTitle: undefined });
      return;
    }
    const uid = auth.currentUser?.uid || '';
    const shortUid = uid ? `${uid.slice(0,4)}…${uid.slice(-4)}` : '—';
    const resolveUser = (u?: string) => (u ? (userNames[u] || u) : '—');
    const ba = detailsVisible && (selectedReport || descriptionItem) ? resolveUser((selectedReport || descriptionItem)?.assignedToBA) : undefined;
    const tl = detailsVisible && (selectedReport || descriptionItem) ? resolveUser((selectedReport || descriptionItem)?.assignedToTL) : undefined;
    const label = `role:${userRole || '—'} | uid:${shortUid}` + (ba || tl ? ` | BA:${ba || '—'} | TL:${tl || '—'}` : '');
    navigation.setOptions?.({
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Text style={{ color: '#ef4444', fontSize: 10 }} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      ),
    });
  }, [userRole, auth.currentUser?.uid, detailsVisible, selectedReport, descriptionItem, userNames, debugHeaderEnabled]);

  // Auto-open details when navigated with a detailId (AM review)
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    const shouldOpen = !!params?.detailId && !!userRole && isFocused && !autoOpened;
    if (!shouldOpen) return;
    (async () => {
      try {
        const id = String(params.detailId);
        const snap = await getDoc(doc(db, 'sales_report_detail', id));
        if (snap.exists()) {
          setSelectedReport({ id: snap.id, ...snap.data() });
          setDetailsMode('review');
          setDetailsVisible(true);
        }
      } catch {}
      setAutoOpened(true);
    })();
  }, [params?.detailId, userRole, isFocused, autoOpened]);

  // Pagination state
  const PAGE_SIZE = 20;
  const [lastDoc, setLastDoc] = useState<any | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [endReached, setEndReached] = useState(false);

  const fetchReports = async (reset: boolean = true) => {
    try {
      if (reset) {
        setLoading(true);
        setEndReached(false);
        setLastDoc(null);
      } else {
        if (loadingMore || endReached) return;
        setLoadingMore(true);
      }
      const reportsRef = collection(db, 'sales_report_detail');
      const uid = auth.currentUser?.uid || '';
      let qRef: any;
  if (isBAish(userRole as any) && uid) {
        qRef = query(reportsRef, where('assignedToBA', '==', uid));
  } else if (isTLish(userRole as any) && uid) {
        qRef = query(reportsRef, where('assignedToTL', '==', uid));
      } else {
        qRef = query(reportsRef);
      }
      // Order and paginate by createdAt desc
      const dir: 'asc' | 'desc' = sortAsc ? 'asc' : 'desc';
      const pageable = lastDoc
        ? query(qRef, orderBy('createdAt', dir), startAfter(lastDoc), limit(PAGE_SIZE))
        : query(qRef, orderBy('createdAt', dir), limit(PAGE_SIZE));

      const snapshot = await getDocs(pageable);
      if (snapshot.empty) {
        if (reset) setReports([]);
        setEndReached(true);
      }
  const newItems: ReportItem[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      // Enrich with outlets like in Quick Sales Report
      let items: ReportItem[] = newItems;
      try {
        const outletsSnapshot = await getDocs(collection(db, 'outlets'));
        const outletMap: Record<string, any> = {};
        const outletList: Array<{ id: string; outletName?: string }> = [];
        outletsSnapshot.forEach(doc => { outletMap[doc.id] = doc.data(); outletList.push({ id: doc.id, outletName: (doc.data() as any)?.outletName }); });
        setOutlets(outletList);
        items = items.map((report: any) => {
          const outlet = outletMap[report.outletId || ''] || {};
          return {
            ...report,
            outletName: outlet.outletName || report.outletName || '-',
            outletProvince: outlet.outletProvince || outlet.province || report.outletProvince || '-',
            outletCity: outlet.outletCity || outlet.city || report.outletCity || '-',
            outletTier: outlet.outletTier || outlet.tier || report.outletTier || '-',
          } as ReportItem;
        });
      } catch {}
      if (reset) {
        setReports(items);
      } else {
        setReports(prev => [...prev, ...items]);
      }
      // Preload BA/TL display names
      try {
        const uids: string[] = Array.from(new Set(items.flatMap((it: any) => [it.assignedToBA, it.assignedToTL]).filter(Boolean)));
        const missing = uids.filter(uid => !!uid && !userNames[uid]);
        if (missing.length) {
          const entries: Record<string, string> = {};
          for (const uid of missing) {
            try {
              const uSnap = await getDoc(doc(db, 'users', uid));
              if (uSnap.exists()) {
                const u = uSnap.data() as any;
                const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || u?.email || u?.phone || uid;
                entries[uid] = name;
              } else {
                entries[uid] = uid;
              }
            } catch {
              entries[uid] = uid;
            }
          }
          setUserNames(prev => ({ ...prev, ...entries }));
        }
      } catch {}
      const last = snapshot.docs[snapshot.docs.length - 1] || null;
      setLastDoc(last);
    } catch (err) {
      console.error('fetchReports error', err);
      Alert.alert(t('error') || 'Error', t('failed_to_fetch_reports') || 'Failed to fetch reports');
    } finally {
      if (reset) setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('delete_report') || 'Delete Report', t('are_you_sure') || 'Are you sure?', [
      { text: t('cancel') || 'Cancel' },
      { text: t('ok') || 'OK', onPress: () => {
        deleteDoc(doc(db, "sales_report_detail", id)).then(() => fetchReports());
      }}
    ]);
  };

  if (loading) return <ActivityIndicator />;

  const canDelete = userRole === Roles.Admin || userRole === Roles.Superadmin || userRole === Roles.AreaManager;
  const canUpdate = canDelete || userRole === Roles.IrisBA || userRole === Roles.IrisTL;


  // Helper: map status to StatusPill tone via centralized helper
  const getStatusTone = (status: string) => getToneForSRDStatus(status);

  

  const renderItem = ({ item }: { item: any }) => {
  const canEditBA = userRole === Roles.IrisBA && stateMachine.canTransition('SRD', Roles.IrisBA, item.salesReportDetailStatus || SRDStatus.Empty, SRDStatus.DoneByBA);
  const canEditTL = userRole === Roles.IrisTL && stateMachine.canTransition('SRD', Roles.IrisTL, item.salesReportDetailStatus || SRDStatus.Empty, SRDStatus.DoneByTL);
  const canEditAdmin = isAdminRole(userRole as any);
  const canReview = userRole === Roles.AreaManager && item.salesReportDetailStatus === SRDStatus.DoneByTL;
  const canRemove = userRole === Roles.Superadmin;

    const status: string = item.salesReportDetailStatus || '';
    const statusTone = getStatusTone(status);

    const isExpanded = !!expanded[item.id];
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? { shadowOpacity: 0 } : undefined]}>
        <TouchableOpacity onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {item.outletName || '-'}
            </Text>
            <StatusPill label={status || '—'} tone={statusTone as any} />
          </View>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]} numberOfLines={1}>
            {(item.outletCity || '-') + (item.outletProvince ? `, ${item.outletProvince}` : '')} • {item.channel || '-'} • {item.tier || '-'}
          </Text>
          <Text style={[styles.metaText, { color: colors.muted }]}>
            {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '-'}
          </Text>
          {isExpanded && (
            <View style={styles.detailsContainer}>
              <Text style={{ color: colors.text }}>Outlet: {item.outletName || '-'}</Text>
              <Text style={{ color: colors.text }}>Province: {item.outletProvince || '-'}</Text>
              <Text style={{ color: colors.text }}>City: {item.outletCity || '-'}</Text>
              <Text style={{ color: colors.text }}>Activity Name: {item.activityName || '-'}</Text>
              <Text style={{ color: colors.text }}>Channel: {item.channel || '-'}</Text>
              <Text style={{ color: colors.text }}>Tier: {item.tier || '-'}</Text>
              <Text style={{ color: colors.text }}>Assigned to BA: {userNames[item.assignedToBA] || item.assignedToBA || '-'}</Text>
              <Text style={{ color: colors.text }}>Assigned to TL: {userNames[item.assignedToTL] || item.assignedToTL || '-'}</Text>
              <Text style={{ color: colors.text }}>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
              <Text style={{ color: colors.text }}>Created By: {item.createdBy || '-'}</Text>
              <Text style={{ color: colors.text }}>Task ID: {item.tasksId || '-'}</Text>
              <Text style={{ color: colors.text }}>Task Sales Report Detail Status: {item.salesReportDetailStatus || '-'}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.actionsRow}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', flex: 1 }}>
            {canEditBA && (
              <PrimaryButton title="SRD by BA" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
            )}
            {canEditTL && (
              <PrimaryButton title="SRD by TL" onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
            )}
            {userRole === Roles.IrisTL && stateMachine.canTransition('SRD', Roles.IrisTL, item.salesReportDetailStatus || SRDStatus.Empty, SRDStatus.ReviewBackToBA) && (
              <SecondaryButton title={t('edit')} onPress={async () => {
                try {
                  const ref = doc(db, 'sales_report_detail', item.id);
  await updateDoc(ref, { salesReportDetailStatus: SRDStatus.ReviewBackToBA, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
                  await fetchReports();
                } catch (e) {
                  Alert.alert(t('update_failed') || 'Update Failed', t('failed_to_update_status') || 'Failed to update status');
                }
              }} style={styles.actionBtn} />
            )}
            {canReview && stateMachine.canTransition('SRD', Roles.AreaManager, item.salesReportDetailStatus || SRDStatus.Empty, SRDStatus.DoneByAM) && (
              <PrimaryButton title="SRD by AM" onPress={() => { setSelectedReport(item); setDetailsMode('review'); setDetailsVisible(true); }} style={styles.actionBtn} />
            )}
            {canEditAdmin && (
              <SecondaryButton title={t('edit') || 'Edit'} onPress={() => handleOpenModal('edit', item)} style={styles.actionBtn} />
            )}
            {canRemove && (
              <SecondaryButton title={t('delete') || 'Delete'} onPress={() => handleDelete(item.id)} style={[styles.actionBtnDanger, isDark ? { backgroundColor: '#3f1d1d', borderColor: '#7f1d1d' } : {}]} />
            )}
          </View>
          <View style={styles.iconActions}>
              <TouchableOpacity
              onPress={() => setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              style={[styles.iconButton, isDark ? { backgroundColor: '#1f2937' } : {}]}
              accessibilityLabel={isExpanded ? 'Collapse row' : 'Expand row'}
            >
              <Ionicons name={isExpanded ? 'chevron-down-outline' : 'chevron-forward-outline'} size={20} color={isDark ? '#9CA3AF' : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setDescriptionItem(item); setDetailsMode('description'); setDetailsVisible(true); }}
              style={[styles.iconButton, isDark ? { backgroundColor: '#1f2937' } : {}]}
              accessibilityLabel="Open details"
            >
              <Ionicons name="newspaper-outline" size={20} color={isDark ? '#60A5FA' : '#007AFF'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // (Inlined legacy modal content removed; now handled via SalesReportModal component)
  const getDescriptionText = (item: any) => buildSalesReportText(item, 'text', { userNames, outlets });

  

  return (
    <View style={[styles.container, isDark ? { backgroundColor: colors.body } : {}]}>
  <FilterHeader
  title={t('sales_detail')}
        search={search}
        status={statusFilter}
        statusOptions={SRD_STATUS_OPTIONS}
    placeholder={t('search_outlet_or_id') || 'Search outlet or ID'}
        storageKey="filters:srd"
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
      <SalesReportModal
        visible={isModalVisible}
        modalType={modalType}
        formData={formData}
        setFormData={setFormData}
        userRole={userRole}
  userNames={userNames}
  outlets={outlets}
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
  userNames={userNames}
  outlets={outlets}
    onCopyAll={detailsMode === 'description' && descriptionItem ? async () => { await Clipboard.setStringAsync(getDescriptionText(descriptionItem)); Alert.alert(t('copied_to_clipboard') || 'Copied to clipboard'); } : undefined}
    onDoneByAM={detailsMode === 'review' && userRole === 'area manager' && selectedReport?.id ? async () => {
          try {
            const ref = doc(db, 'sales_report_detail', selectedReport.id);
  await updateDoc(ref, { salesReportDetailStatus: SRDStatus.DoneByAM, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
            await fetchReports();
            setDetailsVisible(false);
          } catch (e) {
            console.error('Done by AM failed', e);
      Alert.alert(t('update_failed') || 'Update Failed', t('failed_to_update_status') || 'Failed to update status');
          }
        } : undefined}
    onReviewBackToTL={detailsMode === 'review' && userRole === 'area manager' && selectedReport?.id ? async () => {
          try {
            const ref = doc(db, 'sales_report_detail', selectedReport.id);
  await updateDoc(ref, { salesReportDetailStatus: SRDStatus.ReviewBackToTL, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || 'unknown' });
            await fetchReports();
            setDetailsVisible(false);
          } catch (e) {
            console.error('Review back to TL failed', e);
      Alert.alert(t('update_failed') || 'Update Failed', t('failed_to_update_status') || 'Failed to update status');
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
  // Card styles to match other task screens
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8 },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  metaText: { fontSize: 11, color: '#6B7280', marginTop: 6 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  actionBtn: { marginRight: 8, marginBottom: 8 },
  actionBtnDanger: { marginRight: 8, marginBottom: 8, opacity: 0.9 },
  iconActions: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
  iconButton: { padding: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginLeft: 8 },
  detailsContainer: { marginTop: 8 },
});
