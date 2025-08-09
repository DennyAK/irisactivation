import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SalesReportModal from '../../components/SalesReportModal';
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
  // State for review modal
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  // State for description modal
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [descriptionItem, setDescriptionItem] = useState<any>(null);

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
    visitorsOverall: '', visitorsAlcoholDrinkers: '', visitorsAllBeerDrinkers: '', visitorsAllGuinness: '', visitorsAllGuinnessMixedCompetitor: '',
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

  // Submit handler placeholder (adjust with Firestore logic if needed)
  const handleFormSubmit = async () => {
    // TODO: integrate add/update Firestore logic that existed previously.
    setIsModalVisible(false);
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
      const snapshot = await getDocs(reportsRef);
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



  // Review Modal for Area Manager (read-only)
  const renderReviewModal = () => {
    return (
      <Modal
        visible={isReviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsReviewModalVisible(false)}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text selectable style={styles.title}>Review for Area Manager</Text>
            {selectedReport ? (
              <>
                <Text selectable style={styles.sectionTitle}>Personnel Information</Text>
                <Text selectable>Assigned to BA: {selectedReport.assignedToBA || '-'}</Text>
                <Text selectable>Assigned to TL: {selectedReport.assignedToTL || '-'}</Text>
                <Text selectable>BA Count: {selectedReport.baCount || '-'}</Text>
                <Text selectable>Crew Canvasser Count: {selectedReport.crewCanvasserCount || '-'}</Text>
                <Text selectable>Team Leader Name: {selectedReport.teamLeaderName || '-'}</Text>
                <Text selectable>SPG Name: {selectedReport.spgName || '-'}</Text>
                <Text selectable>Sales Report Detail Status: {selectedReport.salesReportDetailStatus || '-'}</Text>
                <Text selectable>Created At: {selectedReport.createdAt?.toDate ? selectedReport.createdAt.toDate().toLocaleString() : '-'}</Text>
                <Text selectable>Created By: {selectedReport.createdBy || '-'}</Text>
                <Text selectable>Task ID: {selectedReport.tasksId || '-'}</Text>
                <Text selectable>Sales Report Detail Status: {selectedReport.salesReportDetailStatus || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Outlet Information</Text>
                <Text selectable>Outlet ID: {selectedReport.outletId || '-'}</Text>
                <Text selectable>Outlet Name: {selectedReport.outletName || '-'}</Text>
                <Text selectable>Province: {selectedReport.outletProvince || '-'}</Text>
                <Text selectable>City: {selectedReport.outletCity || '-'}</Text>
                <Text selectable>Activity Name: {selectedReport.activityName || '-'}</Text>
                <Text selectable>Outlet Venue Name: {selectedReport.outletVenueName || '-'}</Text>
                <Text selectable>Capacity: {selectedReport.outletCapacity || '-'}</Text>
                <Text selectable>Outlet No. of Table Available: {selectedReport.outletNoOfTableAVailable || '-'}</Text>
                <Text selectable>Outlet Event PIC: {selectedReport.outletEventPic || '-'}</Text>
                                
                <Text selectable style={styles.sectionTitle}>Guinness Selling Data</Text>
                <Text selectable>Sales Kegs 330ml: {selectedReport.salesKegs330 || '-'}</Text>
                <Text selectable>Sales Kegs 500ml: {selectedReport.salesKegs500 || '-'}</Text>
                <Text selectable>Sales MD 500ml: {selectedReport.salesMd500 || '-'}</Text>
                <Text selectable>Sales Gdic 400ml: {selectedReport.salesGdic400 || '-'}</Text>
                <Text selectable>Sales Smooth Pint 330ml: {selectedReport.salesSmoothPint330 || '-'}</Text>
                <Text selectable>Sales Smooth Can 330ml: {selectedReport.salesSmoothCan330 || '-'}</Text>
                <Text selectable>Sales Gfes Pint 330ml: {selectedReport.salesGfesPint330 || '-'}</Text>
                <Text selectable>Sales Gfes Can 330ml: {selectedReport.salesGfesCan330 || '-'}</Text>
                <Text selectable>Sales Gfes Quart 620ml: {selectedReport.salesGfesQuart620 || '-'}</Text>
                <Text selectable>Sales Gfes Can Big 500ml: {selectedReport.salesGfesCanbig500 || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Sampling Data</Text>
                <Text selectable>Sampling available: {selectedReport.samplingAvailable || '-'}</Text>
                <Text selectable>Sampling Smooth Bottle: {selectedReport.samplingSmoothBottle || '-'}</Text>
                <Text selectable>Sampling Smooth On Lips: {selectedReport.samplingSmoothOnLips || '-'}</Text>
                <Text selectable>Sampling Smooth Bottle To Buy: {selectedReport.samplingSmoothBottleToBuy || '-'}</Text>
                <Text selectable>Sampling Gfes Bottle: {selectedReport.samplingGfesBottle || '-'}</Text>
                <Text selectable>Sampling Gfes On Lips: {selectedReport.samplingGfesOnLips || '-'}</Text>
                <Text selectable>Sampling Gfes To Buy: {selectedReport.samplingGfesToBuy || '-'}</Text>
                <Text selectable>Sampling Kegs: {selectedReport.samplingKegs || '-'}</Text>
                <Text selectable>Sampling Kegs On Lips: {selectedReport.samplingKegsOnLips || '-'}</Text>
                <Text selectable>Sampling Kegs To Buy: {selectedReport.samplingKegsToBuy || '-'}</Text>
                <Text selectable>Sampling Md : {selectedReport.samplingMd || '-'}</Text>
                <Text selectable>Sampling Md On Lips: {selectedReport.samplingMdOnLips || '-'}</Text>
                <Text selectable>Sampling Md To Buy: {selectedReport.samplingMdToBuy || '-'}</Text>
                <Text selectable>Sampling Gdic: {selectedReport.samplingGdic || '-'}</Text>
                <Text selectable>Sampling Gdic On Lips: {selectedReport.samplingGdicOnLips || '-'}</Text>
                <Text selectable>Sampling Gdic Bottle To Buy: {selectedReport.samplingGdicBottleToBuy || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Call and Customer Data</Text>
                <Text selectable>Calls Offers: {selectedReport.callsOffers || '-'}</Text>
                <Text selectable>Effective Calls: {selectedReport.effectiveCalls || '-'}</Text>
                <Text selectable>Calls vs Effective Percentage: {selectedReport.callsVsEffectivePercentage || '-'}</Text>
               
                <Text selectable style={styles.sectionTitle}>Guinness Promotional Activities</Text>
                <Text selectable>Guinness Smooth Promotion Available: {selectedReport.guinnessSmoothPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Smooth Description: {selectedReport.promoSmoothDescription || '-'}</Text>
                <Text selectable>Promo Smooth Sold: {selectedReport.promoSmoothSold || '-'}</Text>
                <Text selectable>Promo Smooth Repeat Orders: {selectedReport.promoSmoothRepeatOrders || '-'}</Text>
                <Text selectable>Promo Smooth Description - Type 2: {selectedReport.promoSmoothDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Smooth Sold - Type 2: {selectedReport.promoSmoothSoldType2 || '-'}</Text>
                <Text selectable>Promo Smooth Repeat Orders - Type 2: {selectedReport.promoSmoothRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Gfes Promotion Available: {selectedReport.guinnessGfesPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Gfes Description: {selectedReport.promoGfesDescription || '-'}</Text>
                <Text selectable>Promo Gfes Sold: {selectedReport.promoGfesSold || '-'}</Text>
                <Text selectable>Promo Gfes Repeat Orders: {selectedReport.promoGfesRepeatOrders || '-'}</Text>
                <Text selectable>Promo Gfes Description - Type 2: {selectedReport.promoGfesDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Gfes Sold - Type 2: {selectedReport.promoGfesSoldType2 || '-'}</Text>
                <Text selectable>Promo Gfes Repeat Orders - Type 2: {selectedReport.promoGfesRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Kegs Promotion Available: {selectedReport.guinnessKegsPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Kegs Description: {selectedReport.promoKegsDescription || '-'}</Text>
                <Text selectable>Promo Kegs Sold: {selectedReport.promoKegsSold || '-'}</Text>
                <Text selectable>Promo Kegs Repeat Orders: {selectedReport.promoKegsRepeatOrders || '-'}</Text>
                <Text selectable>Promo Kegs Description - Type 2: {selectedReport.promoKegsDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Kegs Sold - Type 2: {selectedReport.promoKegsSoldType2 || '-'}</Text>
                <Text selectable>Promo Kegs Repeat Orders - Type 2: {selectedReport.promoKegsRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Microdraught Promotion Available: {selectedReport.guinnessMicroDraughtPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Microdraught Description: {selectedReport.promoMicrodraughtDescription || '-'}</Text>
                <Text selectable>Promo Microdraught Sold: {selectedReport.promoMicrodraughtSold || '-'}</Text>
                <Text selectable>Promo Microdraught Repeat Orders: {selectedReport.promoMicrodraughtRepeatOrders || '-'}</Text>
                <Text selectable>Promo Microdraught Description - Type 2: {selectedReport.promoMicrodraughtDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Microdraught Sold - Type 2: {selectedReport.promoMicrodraughtSoldType2 || '-'}</Text>
                <Text selectable>Promo Microdraught Repeat Orders - Type 2: {selectedReport.promoMicrodraughtRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Gdic Promotion Available: {selectedReport.guinnessGdicPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Gdic Description: {selectedReport.promoGdicDescription || '-'}</Text>
                <Text selectable>Promo Gdic Sold: {selectedReport.promoGdicSold || '-'}</Text>
                <Text selectable>Promo Gdic Repeat Orders: {selectedReport.promoGdicRepeatOrders || '-'}</Text>
                <Text selectable>Promo Gdic Description - Type 2: {selectedReport.promoGdicDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Gdic Sold - Type 2: {selectedReport.promoGdicSoldType2 || '-'}</Text>
                <Text selectable>Promo Gdic Repeat Orders - Type 2: {selectedReport.promoGdicRepeatOrdersType2 || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Visitor and Consumer Data</Text>
                <Text selectable>Visitors Overall: {selectedReport.visitorsOverall || '-'}</Text>
                <Text selectable>Visitors Alcohol Drinkers: {selectedReport.visitorsAlcoholDrinkers || '-'}</Text>
                <Text selectable>Visitors All Beer Drinkers: {selectedReport.visitorsAllBeerDrinkers || '-'}</Text>
                <Text selectable>Visitors All Guinness: {selectedReport.visitorsAllGuinness || '-'}</Text>
                <Text selectable>Visitors All Competitor: {selectedReport.visitorsAllCompetitor || '-'}</Text>
                <Text selectable>Visitors All Guinness Mixed Competitor: {selectedReport.visitorsAllGuinnessMixedCompetitor || '-'}</Text>
                <Text selectable>Drinkers Smooth: {selectedReport.drinkersSmooth || '-'}</Text>
                <Text selectable>Drinkers Gfes: {selectedReport.drinkersGfes || '-'}</Text>
                <Text selectable>Drinkers Kegs: {selectedReport.drinkersKegs || '-'}</Text>
                <Text selectable>Drinkers Microdraught: {selectedReport.drinkersMicrodraught || '-'}</Text>
                <Text selectable>Drinkers Gdic: {selectedReport.drinkersGdic || '-'}</Text>
                <Text selectable>Drinkers Mixed: {selectedReport.drinkersMixed || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Tables Data</Text>
                <Text selectable>Tables Overall: {selectedReport.tablesOverall || '-'}</Text>
                <Text selectable>Tables Alcohol Drinkers: {selectedReport.tablesAlcoholDrinkers || '-'}</Text>
                <Text selectable>Tables Non Alcohol Drinkers: {selectedReport.tablesNonAlcoholDrinkers || '-'}</Text>
                <Text selectable>Tables All Beer Drinkers: {selectedReport.tablesAllBeerDrinkers || '-'}</Text>
                <Text selectable>Tables All Guinness: {selectedReport.tablesAllGuinness || '-'}</Text>
                <Text selectable>Tables All Competitor: {selectedReport.tablesAllCompetitor || '-'}</Text>
                <Text selectable>Tables All Guinness Mixed Competitor: {selectedReport.tablesAllGuinnessMixedCompetitor || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Competitor Sales</Text>
                <Text selectable>Competitor Bintang Available: {selectedReport.competitorBintangAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Bintang Glass: {selectedReport.competitorBintangGlass || '-'}</Text>
                <Text selectable>Competitor Bintang Pint: {selectedReport.competitorBintangPint || '-'}</Text>
                <Text selectable>Competitor Bintang Quart: {selectedReport.competitorBintangQuart || '-'}</Text>
                <Text selectable>Competitor Bintang Can Small: {selectedReport.competitorBintangCanSmall || '-'}</Text>
                <Text selectable>Competitor Bintang Can Big: {selectedReport.competitorBintangCanBig || '-'}</Text>
                <Text selectable>Competitor Bintang Promo Description: {selectedReport.competitorBintangPromoDescription || '-'}</Text>
                <Text selectable>Competitor Bintang Promo Sold: {selectedReport.competitorBintangPromoSold || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Available: {selectedReport.competitorBintangCrystalAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Bintang Crystal Glass: {selectedReport.competitorBintangCrystalGlass || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Pint: {selectedReport.competitorBintangCrystalPint || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Quart: {selectedReport.competitorBintangCrystalQuart || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Can Small: {selectedReport.competitorBintangCrystalCanSmall || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Can Big: {selectedReport.competitorBintangCrystalCanBig || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Promo Description: {selectedReport.competitorBintangCrystalPromoDescription || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Promo Sold: {selectedReport.competitorBintangCrystalPromoSold || '-'}</Text>
                <Text selectable>Competitor Heineken Available: {selectedReport.competitorHeinekenAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Heineken Glass: {selectedReport.competitorHeinekenGlass || '-'}</Text>
                <Text selectable>Competitor Heineken Pint: {selectedReport.competitorHeinekenPint || '-'}</Text>
                <Text selectable>Competitor Heineken Quart: {selectedReport.competitorHeinekenQuart || '-'}</Text>
                <Text selectable>Competitor Heineken Can Small: {selectedReport.competitorHeinekenCanSmall || '-'}</Text>
                <Text selectable>Competitor Heineken Can Big: {selectedReport.competitorHeinekenCanBig || '-'}</Text>
                <Text selectable>Competitor Heineken Promo Description: {selectedReport.competitorHeinekenPromoDescription || '-'}</Text>
                <Text selectable>Competitor Heineken Promo Sold: {selectedReport.competitorHeinekenPromoSold || '-'}</Text>
                <Text selectable>Competitor Heineken Import Available: {selectedReport.competitorHeinekenImportAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Heineken Import Glass: {selectedReport.competitorHeinekenImportGlass || '-'}</Text>
                <Text selectable>Competitor Heineken Import Pint: {selectedReport.competitorHeinekenImportPint || '-'}</Text>
                <Text selectable>Competitor Heineken Import Quart: {selectedReport.competitorHeinekenImportQuart || '-'}</Text>
                <Text selectable>Competitor Heineken Import Can Small: {selectedReport.competitorHeinekenImportCanSmall || '-'}</Text>
                <Text selectable>Competitor Heineken Import Can Big: {selectedReport.competitorHeinekenImportCanBig || '-'}</Text>
                <Text selectable>Competitor Heineken Import Promo Description: {selectedReport.competitorHeinekenImportPromoDescription || '-'}</Text>
                <Text selectable>Competitor Heineken Import Promo Sold: {selectedReport.competitorHeinekenImportPromoSold || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Available: {selectedReport.competitorErdingerImportAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Erdinger Import Glass: {selectedReport.competitorErdingerImportGlass || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Pint: {selectedReport.competitorErdingerImportPint || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Quart: {selectedReport.competitorErdingerImportQuart || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Can Small: {selectedReport.competitorErdingerImportCanSmall || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Can Big: {selectedReport.competitorErdingerImportCanBig || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Promo Description: {selectedReport.competitorErdingerImportPromoDescription || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Promo Sold: {selectedReport.competitorErdingerImportPromoSold || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Available: {selectedReport.competitorBudweizerImportAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Budweizer Import Glass: {selectedReport.competitorBudweizerImportGlass || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Pint: {selectedReport.competitorBudweizerImportPint || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Quart: {selectedReport.competitorBudweizerImportQuart || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Can Small: {selectedReport.competitorBudweizerImportCanSmall || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Can Big: {selectedReport.competitorBudweizerImportCanBig || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Promo Description: {selectedReport.competitorBudweizerImportPromoDescription || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Promo Sold: {selectedReport.competitorBudweizerImportPromoSold || '-'}</Text>
                <Text selectable>Competitor Anker Available: {selectedReport.competitorAnkerAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Anker Glass: {selectedReport.competitorAnkerGlass || '-'}</Text>
                <Text selectable>Competitor Anker Pint: {selectedReport.competitorAnkerPint || '-'}</Text>
                <Text selectable>Competitor Anker Quart: {selectedReport.competitorAnkerQuart || '-'}</Text>
                <Text selectable>Competitor Anker Can Small: {selectedReport.competitorAnkerCanSmall || '-'}</Text>
                <Text selectable>Competitor Anker Can Big: {selectedReport.competitorAnkerCanBig || '-'}</Text>
                <Text selectable>Competitor Anker Promo Description: {selectedReport.competitorAnkerPromoDescription || '-'}</Text>
                <Text selectable>Competitor Anker Promo Sold: {selectedReport.competitorAnkerPromoSold || '-'}</Text>
                <Text selectable>Competitor Bali Hai Available: {selectedReport.competitorBalihaiAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Bali Hai Glass: {selectedReport.competitorBalihaiGlass || '-'}</Text>
                <Text selectable>Competitor Bali Hai Pint: {selectedReport.competitorBalihaiPint || '-'}</Text>
                <Text selectable>Competitor Bali Hai Quart: {selectedReport.competitorBalihaiQuart || '-'}</Text>
                <Text selectable>Competitor Bali Hai Can Small: {selectedReport.competitorBalihaiCanSmall || '-'}</Text>
                <Text selectable>Competitor Bali Hai Can Big: {selectedReport.competitorBalihaiCanBig || '-'}</Text>
                <Text selectable>Competitor Bali Hai Promo Description: {selectedReport.competitorBalihaiPromoDescription || '-'}</Text>
                <Text selectable>Competitor Bali Hai Promo Sold: {selectedReport.competitorBalihaiPromoSold || '-'}</Text>
                <Text selectable>Competitor Prost Available: {selectedReport.competitorProstAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Prost Glass: {selectedReport.competitorProstGlass || '-'}</Text>
                <Text selectable>Competitor Prost Pint: {selectedReport.competitorProstPint || '-'}</Text>
                <Text selectable>Competitor Prost Quart: {selectedReport.competitorProstQuart || '-'}</Text>
                <Text selectable>Competitor Prost Can Small: {selectedReport.competitorProstCanSmall || '-'}</Text>
                <Text selectable>Competitor Prost Can Big: {selectedReport.competitorProstCanBig || '-'}</Text>
                <Text selectable>Competitor Prost Promo Description: {selectedReport.competitorProstPromoDescription || '-'}</Text>
                <Text selectable>Competitor Prost Promo Sold: {selectedReport.competitorProstPromoSold || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Available: {selectedReport.competitorSanmiguelAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Sanmiguel Glass: {selectedReport.competitorSanmiguelGlass || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Pint: {selectedReport.competitorSanmiguelPint || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Quart: {selectedReport.competitorSanmiguelQuart || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Can Small: {selectedReport.competitorSanmiguelCanSmall || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Can Big: {selectedReport.competitorSanmiguelCanBig || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Promo Description: {selectedReport.competitorSanmiguelPromoDescription || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Promo Sold: {selectedReport.competitorSanmiguelPromoSold || '-'}</Text>
                <Text selectable>Competitor Singaraja Available: {selectedReport.competitorSingarajaAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Singaraja Glass: {selectedReport.competitorSingarajaGlass || '-'}</Text>
                <Text selectable>Competitor Singaraja Pint: {selectedReport.competitorSingarajaPint || '-'}</Text>
                <Text selectable>Competitor Singaraja Quart: {selectedReport.competitorSingarajaQuart || '-'}</Text>
                <Text selectable>Competitor Singaraja Can Small: {selectedReport.competitorSingarajaCanSmall || '-'}</Text>
                <Text selectable>Competitor Singaraja Can Big: {selectedReport.competitorSingarajaCanBig || '-'}</Text>
                <Text selectable>Competitor Carlsberg Available: {selectedReport.competitorCarlsbergAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Carlsberg Glass: {selectedReport.competitorCarlsbergGlass || '-'}</Text>
                <Text selectable>Competitor Carlsberg Pint: {selectedReport.competitorCarlsbergPint || '-'}</Text>
                <Text selectable>Competitor Carlsberg Quart: {selectedReport.competitorCarlsbergQuart || '-'}</Text>
                <Text selectable>Competitor Carlsberg Can Small: {selectedReport.competitorCarlsbergCanSmall || '-'}</Text>
                <Text selectable>Competitor Carlsberg Can Big: {selectedReport.competitorCarlsbergCanBig || '-'}</Text>
                <Text selectable>Competitor Carlsberg Promo Description: {selectedReport.competitorCarlsbergPromoDescription || '-'}</Text>
                <Text selectable>Competitor Carlsberg Promo Sold: {selectedReport.competitorCarlsbergPromoSold || '-'}</Text>
                <Text selectable>Competitor Draftbeer available: {selectedReport.competitorDraftbeerAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Draftbeer Glass: {selectedReport.competitorDraftbeerGlass || '-'}</Text>
                <Text selectable>Competitor Draftbeer Pint: {selectedReport.competitorDraftbeerPint || '-'}</Text>
                <Text selectable>Competitor Draftbeer Quart: {selectedReport.competitorDraftbeerQuart || '-'}</Text>
                <Text selectable>Competitor Draftbeer Can Small: {selectedReport.competitorDraftbeerCanSmall || '-'}</Text>
                <Text selectable>Competitor Draftbeer Can Big: {selectedReport.competitorDraftbeerCanBig || '-'}</Text>
                <Text selectable>Competitor Draftbeer Promo Description: {selectedReport.competitorDraftbeerPromoDescription || '-'}</Text>
                <Text selectable>Competitor Draftbeer Promo Sold: {selectedReport.competitorDraftbeerPromoSold || '-'}</Text>
                <Text selectable>Competitor kurakura Available: {selectedReport.competitorKurakuraAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor kurakura Glass: {selectedReport.competitorKurakuraGlass || '-'}</Text>
                <Text selectable>Competitor kurakura Pint: {selectedReport.competitorKurakuraPint || '-'}</Text>
                <Text selectable>Competitor kurakura Quart: {selectedReport.competitorKurakuraQuart || '-'}</Text>
                <Text selectable>Competitor kurakura Can Small: {selectedReport.competitorKurakuraCanSmall || '-'}</Text>
                <Text selectable>Competitor kurakura Can Big: {selectedReport.competitorKurakuraCanBig || '-'}</Text>
                <Text selectable>Competitor kurakura Promo Description: {selectedReport.competitorKurakuraPromoDescription || '-'}</Text>
                <Text selectable>Competitor kurakura Promo Sold: {selectedReport.competitorKurakuraPromoSold || '-'}</Text>
                <Text selectable>Competitor Island Brewing Available: {selectedReport.competitorIslandBrewingAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Island Brewing Glass: {selectedReport.competitorIslandBrewingGlass || '-'}</Text>
                <Text selectable>Competitor Island Brewing Pint: {selectedReport.competitorIslandBrewingPint || '-'}</Text>
                <Text selectable>Competitor Island Brewing Quart: {selectedReport.competitorIslandBrewingQuart || '-'}</Text>
                <Text selectable>Competitor Island Brewing Can Small: {selectedReport.competitorIslandBrewingCanSmall || '-'}</Text>
                <Text selectable>Competitor Island Brewing Can Big: {selectedReport.competitorIslandBrewingCanBig || '-'}</Text>
                <Text selectable>Competitor Island Brewing Promo Description: {selectedReport.competitorIslandBrewingPromoDescription || '-'}</Text>
                <Text selectable>Competitor Island Brewing Promo Sold: {selectedReport.competitorIslandBrewingPromoSold || '-'}</Text> 
                <Text selectable>Competitor Others Available: {selectedReport.competitorOthersAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Others Glass: {selectedReport.competitorOthersGlass || '-'}</Text>
                <Text selectable>Competitor Others Pint: {selectedReport.competitorOthersPint || '-'}</Text>
                <Text selectable>Competitor Others Quart: {selectedReport.competitorOthersQuart || '-'}</Text>
                <Text selectable>Competitor Others Can Small: {selectedReport.competitorOthersCanSmall || '-'}</Text>
                <Text selectable>Competitor Others Can Big: {selectedReport.competitorOthersCanBig || '-'}</Text>
                <Text selectable>Competitor Others Promo Description: {selectedReport.competitorOthersPromoDescription || '-'}</Text>
                <Text selectable>Competitor Others Promo Sold: {selectedReport.competitorOthersPromoSold || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Merchandise Data</Text>
                <Text selectable>Merchandise Description 1: {selectedReport.merchandiseDescription1 || '-'}</Text>
                <Text selectable>Merchandise Sold 1: {selectedReport.merchandiseSold1 || '-'}</Text>
                <Text selectable>Merchandise Description 2: {selectedReport.merchandiseDescription2 || '-'}</Text>
                <Text selectable>Merchandise Sold 2: {selectedReport.merchandiseSold2 || '-'}</Text>
                <Text selectable>Merchandise Description 3: {selectedReport.merchandiseDescription3 || '-'}</Text>
                <Text selectable>Merchandise Sold 3: {selectedReport.merchandiseSold3 || '-'}</Text>
                <Text selectable>Merchandise Description 4: {selectedReport.merchandiseDescription4 || '-'}</Text>
                <Text selectable>Merchandise Sold 4: {selectedReport.merchandiseSold4 || '-'}</Text>
                <Text selectable>Merchandise Description 5: {selectedReport.merchandiseDescription5 || '-'}</Text>
                <Text selectable>Merchandise Sold 5: {selectedReport.merchandiseSold5 || '-'}</Text>
                
                <Text selectable>Competitor Activity Description: {selectedReport.competitorActivityDescription || '-'}</Text>
                <Text selectable>Competitor Activity SPG Total: {selectedReport.competitorActivitySpgTotal || '-'}</Text>
                <Text selectable>Competitor Only Drinkers: {selectedReport.drinkerCompetitorOnly || '-'}</Text>
                <Text selectable>Created At: {selectedReport.createdAt?.toDate ? selectedReport.createdAt.toDate().toLocaleString() : '-'}</Text>
                <Text selectable>Created By: {selectedReport.createdBy || '-'}</Text>
                <Text selectable>Task ID: {selectedReport.tasksId || '-'}</Text>
                <Text selectable>Sales Report Detail Status: {selectedReport.salesReportDetailStatus || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Weather Data</Text>
                <Text selectable>Weather Status: {selectedReport.weatherStatus || '-'}</Text> 

                <Text selectable style={styles.sectionTitle}>Sales Report Summary Notes and Learning</Text>
                <Text selectable>Issues/Notes/Requests: {selectedReport.issuesNotesRequests || '-'}</Text>
                <Text selectable>Learning Points: {selectedReport.learningPoints || '-'}</Text>
                

                
                {/* Add more fields as needed */}
              </>
            ) : (
              <Text>No data available.</Text>
            )}
            <Button title="Close" onPress={() => setIsReviewModalVisible(false)} />
          </View>
        </ScrollView>
      </Modal>
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
      <View style={{ flex: 1 }}>
        <View style={styles.itemContainer}>
          <Text>Outlet ID: {item.outletId || '-'}</Text>
          <Text>Outlet Name: {item.outletName || '-'}</Text>
          <Text>Province: {item.outletProvince || '-'}</Text>
          <Text>City: {item.outletCity || '-'}</Text>
          <Text>Activity Name: {item.activityName || '-'}</Text>
          <Text>Channel: {item.channel || '-'}</Text>
          <Text>Tier: {item.tier || '-'}</Text>

          {/* New fields from Tasks */}
          <Text>Assigned to BA: {item.assignedToBA || '-'}</Text>
          <Text>Assigned to TL: {item.assignedToTL || '-'}</Text>
          <Text>Created At: {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}</Text>
          <Text>Created By: {item.createdBy || '-'}</Text>
          <Text>Task ID: {item.tasksId || '-'}</Text>
          <Text>Task Sales Report Detail Status: {item.salesReportDetailStatus || '-'} </Text>

          {/* Sales Detail by BA button */}
          {userRole === 'Iris - BA' && (!item.salesReportDetailStatus || item.salesReportDetailStatus === 'Review back to BA') && (
            <View style={styles.buttonContainer}>
              <Button title="Sales Detail by BA" onPress={() => handleOpenModal('edit', item)} />
            </View>
          )}
          {/* Sales Detail by TL button */}
          {userRole === 'Iris - TL' && (item.salesReportDetailStatus === 'Done By BA' || item.salesReportDetailStatus === 'Review back to TL') && (
            <View style={styles.buttonContainer}>
              <Button title="Sales Detail by TL" onPress={() => handleOpenModal('edit', item)} />
            </View>
          )}
          {/* Area Manager Review button */}
          {userRole === 'area manager' && item.salesReportDetailStatus === 'Done by TL' && (
            <View style={styles.buttonContainer}>
              <Button title="Review for Area Manager" onPress={() => {
                setSelectedReport(item);
                setIsReviewModalVisible(true);
              }} />
            </View>
          )}
          {/* Edit button for admin/superadmin only */}
          {(userRole === 'admin' || userRole === 'superadmin') && (
            <View style={styles.buttonContainer}>
              <Button title="Edit" onPress={() => handleOpenModal('edit', item)} />
            </View>
          )}
          {/* Delete button for superadmin only */}
          {userRole === 'superadmin' && (
            <View style={styles.buttonContainer}>
              <Button title="Delete" onPress={() => handleDelete(item.id)} />
            </View>
          )}
          {/* Detail icon button inside the item container */}
          <View style={{ position: 'absolute', right: 24, top: 24, zIndex: 100 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                borderRadius: 28,
                padding: 8,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
              }}
              onPress={() => {
                setDescriptionItem(item);
                setIsDescriptionModalVisible(true);
              }}
              accessibilityLabel="Detail"
            >
              <Ionicons name="newspaper-outline" size={32} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // (Inlined legacy modal content removed; now handled via SalesReportModal component)
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor Erdinger Import Available</Text>
            <Switch value={formData.competitorErdingerImportAvailable} onValueChange={value => setFormData({...formData, competitorErdingerImportAvailable: value})} />
          </View>
          {formData.competitorErdingerImportAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor Erdinger Import</Text>
                  <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                      <View style={{ flex: 1 }}>
                        <TextInput style={styles.input} value={formData.competitorErdingerImportGlass} onChangeText={text => setFormData({...formData, competitorErdingerImportGlass: text})} placeholder="Glass" keyboardType='numeric'/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInput style={styles.input} value={formData.competitorErdingerImportPint} onChangeText={text => setFormData({...formData, competitorErdingerImportPint: text})} placeholder="Pint" keyboardType='numeric'/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInput style={styles.input} value={formData.competitorErdingerImportQuart} onChangeText={text => setFormData({...formData, competitorErdingerImportQuart: text})} placeholder="Quart" keyboardType='numeric'/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInput style={styles.input} value={formData.competitorErdingerImportCanSmall} onChangeText={text => setFormData({...formData, competitorErdingerImportCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInput style={styles.input} value={formData.competitorErdingerImportCanBig} onChangeText={text => setFormData({...formData, competitorErdingerImportCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
                      </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                    <View style={{ flex: 2 }}>
                      <TextInput style={styles.input} value={formData.competitorErdingerImportPromoDescription} onChangeText={text => setFormData({...formData, competitorErdingerImportPromoDescription: text})} placeholder="Promo Description"/>
                    </View>
                    <View style={{ flex: 1 }}>    
                      <TextInput style={styles.input} value={formData.competitorErdingerImportPromoSold} onChangeText={text => setFormData({...formData, competitorErdingerImportPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
                    </View>
                  </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor Budweizer Available</Text>
          <Switch value={formData.competitorBudweizerImportAvailable} onValueChange={value => setFormData({...formData, competitorBudweizerImportAvailable: value})} />
          </View>
          {formData.competitorBudweizerImportAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor Budweizer Import</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBudweizerImportGlass} onChangeText={text => setFormData({...formData, competitorBudweizerImportGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
            <TextInput style={styles.input} value={formData.competitorBudweizerImportPint} onChangeText={text => setFormData({...formData, competitorBudweizerImportPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBudweizerImportQuart} onChangeText={text => setFormData({...formData, competitorBudweizerImportQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBudweizerImportCanSmall} onChangeText={text => setFormData({...formData, competitorBudweizerImportCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBudweizerImportCanBig} onChangeText={text => setFormData({...formData, competitorBudweizerImportCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorBudweizerImportPromoDescription} onChangeText={text => setFormData({...formData, competitorBudweizerImportPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBudweizerImportPromoSold} onChangeText={text => setFormData({...formData, competitorBudweizerImportPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor Anker Available</Text>
            <Switch value={formData.competitorAnkerAvailable} onValueChange={value => setFormData({...formData, competitorAnkerAvailable: value})} />
          </View>
          {formData.competitorAnkerAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor Brand anker</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerGlass} onChangeText={text => setFormData({...formData, competitorAnkerGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerPint} onChangeText={text => setFormData({...formData, competitorAnkerPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerQuart} onChangeText={text => setFormData({...formData, competitorAnkerQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerCanSmall} onChangeText={text => setFormData({...formData, competitorAnkerCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerCanBig} onChangeText={text => setFormData({...formData, competitorAnkerCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerPromoDescription} onChangeText={text => setFormData({...formData, competitorAnkerPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorAnkerPromoSold} onChangeText={text => setFormData({...formData, competitorAnkerPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor balihai Available</Text>
            <Switch value={formData.competitorBalihaiAvailable} onValueChange={value => setFormData({...formData, competitorBalihaiAvailable: value})} />
          </View>
          {formData.competitorBalihaiAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor balihai</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiGlass} onChangeText={text => setFormData({...formData, competitorBalihaiGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiPint} onChangeText={text => setFormData({...formData, competitorBalihaiPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiQuart} onChangeText={text => setFormData({...formData, competitorBalihaiQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiCanSmall} onChangeText={text => setFormData({...formData, competitorBalihaiCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiCanBig} onChangeText={text => setFormData({...formData, competitorBalihaiCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiPromoDescription} onChangeText={text => setFormData({...formData, competitorBalihaiPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorBalihaiPromoSold} onChangeText={text => setFormData({...formData, competitorBalihaiPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor prost Available</Text>
            <Switch value={formData.competitorProstAvailable} onValueChange={value => setFormData({...formData, competitorProstAvailable: value})} />
          </View>
          {formData.competitorProstAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor prost</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorProstGlass} onChangeText={text => setFormData({...formData, competitorProstGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorProstPint} onChangeText={text => setFormData({...formData, competitorProstPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorProstQuart} onChangeText={text => setFormData({...formData, competitorProstQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorProstCanSmall} onChangeText={text => setFormData({...formData, competitorProstCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorProstCanBig} onChangeText={text => setFormData({...formData, competitorProstCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorProstPromoDescription} onChangeText={text => setFormData({...formData, competitorProstPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorProstPromoSold} onChangeText={text => setFormData({...formData, competitorProstPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor sanmiguel Available</Text>
            <Switch value={formData.competitorSanMiguelAvailable} onValueChange={value => setFormData({...formData, competitorSanMiguelAvailable: value})} />
          </View>

          {formData.competitorSanMiguelAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor sanmiguel</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelGlass} onChangeText={text => setFormData({...formData, competitorSanMiguelGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelPint} onChangeText={text => setFormData({...formData, competitorSanMiguelPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelQuart} onChangeText={text => setFormData({...formData, competitorSanMiguelQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelCanSmall} onChangeText={text => setFormData({...formData, competitorSanMiguelCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelCanBig} onChangeText={text => setFormData({...formData, competitorSanMiguelCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelPromoDescription} onChangeText={text => setFormData({...formData, competitorSanMiguelPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSanMiguelPromoSold} onChangeText={text => setFormData({...formData, competitorSanMiguelPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor singaraja Available</Text>
            <Switch value={formData.competitorSingarajaAvailable} onValueChange={value => setFormData({...formData, competitorSingarajaAvailable: value})} />
          </View>

          {formData.competitorSingarajaAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor singaraja</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaGlass} onChangeText={text => setFormData({...formData, competitorSingarajaGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaPint} onChangeText={text => setFormData({...formData, competitorSingarajaPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaQuart} onChangeText={text => setFormData({...formData, competitorSingarajaQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaCanSmall} onChangeText={text => setFormData({...formData, competitorSingarajaCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaCanBig} onChangeText={text => setFormData({...formData, competitorSingarajaCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaPromoDescription} onChangeText={text => setFormData({...formData, competitorSingarajaPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorSingarajaPromoSold} onChangeText={text => setFormData({...formData, competitorSingarajaPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor carlsberg Available</Text>
            <Switch value={formData.competitorCarlsbergAvailable} onValueChange={value => setFormData({...formData, competitorCarlsbergAvailable: value})} />
          </View>

          {formData.competitorCarlsbergAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor carlsberg</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergGlass} onChangeText={text => setFormData({...formData, competitorCarlsbergGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergPint} onChangeText={text => setFormData({...formData, competitorCarlsbergPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergQuart} onChangeText={text => setFormData({...formData, competitorCarlsbergQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergCanSmall} onChangeText={text => setFormData({...formData, competitorCarlsbergCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergCanBig} onChangeText={text => setFormData({...formData, competitorCarlsbergCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergPromoDescription} onChangeText={text => setFormData({...formData, competitorCarlsbergPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorCarlsbergPromoSold} onChangeText={text => setFormData({...formData, competitorCarlsbergPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor draftbeer Available</Text>
            <Switch value={formData.competitorDraftBeerAvailable} onValueChange={value => setFormData({...formData, competitorDraftBeerAvailable: value})} />
          </View>

          {formData.competitorDraftBeerAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor draftbeer</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerGlass} onChangeText={text => setFormData({...formData, competitorDraftBeerGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerPint} onChangeText={text => setFormData({...formData, competitorDraftBeerPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerQuart} onChangeText={text => setFormData({...formData, competitorDraftBeerQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerCanSmall} onChangeText={text => setFormData({...formData, competitorDraftBeerCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerCanBig} onChangeText={text => setFormData({...formData, competitorDraftBeerCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerPromoDescription} onChangeText={text => setFormData({...formData, competitorDraftBeerPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorDraftBeerPromoSold} onChangeText={text => setFormData({...formData, competitorDraftBeerPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
// Removed trailing inline modal fragments (now handled by SalesReportModal)
const getDescriptionText = (item: any) => {
  if (!item) return '';
  return `
Personnel Information
Assigned to BA: ${item.assignedToBA || '-'}
Assigned to TL: ${item.assignedToTL || '-'}
BA Count: ${item.baCount || '-'}
Crew Canvasser Count: ${item.crewCanvasserCount || '-'}
Team Leader Name: ${item.teamLeaderName || '-'}
SPG Name: ${item.spgName || '-'}
Sales Report Detail Status: ${item.salesReportDetailStatus || '-'}
Created At: ${item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : '-'}
Created By: ${item.createdBy || '-'}
Task ID: ${item.tasksId || '-'}
Outlet Information
Outlet ID: ${item.outletId || '-'}
Outlet Name: ${item.outletName || '-'}
Province: ${item.outletProvince || '-'}
City: ${item.outletCity || '-'}
Activity Name: ${item.activityName || '-'}
Outlet Venue Name: ${item.outletVenueName || '-'}
Capacity: ${item.capacity || '-'}
Outlet Event PIC: ${item.outletEventPic || '-'}
Outlet Capacity: ${item.outletCapacity || '-'}
Outlet No. of Tables Available: ${item.outletNoOfTableAVailable || '-'}
Guinness Selling Data
Sales Kegs 330ml: ${item.salesKegs330 || '-'}
Sales Kegs 500ml: ${item.salesKegs500 || '-'}
Sales MD 500ml: ${item.salesMd500 || '-'}
Sales Gdic 400ml: ${item.salesGdic400 || '-'}
Sales Smooth Pint 330ml: ${item.salesSmoothPint330 || '-'}
Sales Smooth Can 330ml: ${item.salesSmoothCan330 || '-'}
Sales Gfes Pint 330ml: ${item.salesGfesPint330 || '-'}
Sales Gfes Can 330ml: ${item.salesGfesCan330 || '-'}
Sales Gfes Quart 620ml: ${item.salesGfesQuart620 || '-'}
Sales Gfes Can Big 500ml: ${item.salesGfesCanbig500 || '-'}
Call and Customer Data
Call Reach: ${item.callsOffers || '-'}
Effective Calls: ${item.effectiveCalls || '-'}
Calls vs Effective Percentage: ${item.callsVsEffectivePercentage || '-'}
Sampling Data
Sampling available: ${item.samplingAvailable || '-'}
Sampling Smooth Bottle: ${item.samplingSmoothBottle || '-'}
Sampling Smooth On Lips: ${item.samplingSmoothOnLips || '-'}
Sampling Smooth Bottle To Buy: ${item.samplingSmoothBottleToBuy || '-'}
Sampling Gfes Bottle: ${item.samplingGfesBottle || '-'}
Sampling Gfes On Lips: ${item.samplingGfesOnLips || '-'}
Sampling Gfes To Buy: ${item.samplingGfesToBuy || '-'}
Sampling Kegs: ${item.samplingKegs || '-'}
Sampling Kegs On Lips: ${item.samplingKegsOnLips || '-'}
Sampling Kegs To Buy: ${item.samplingKegsToBuy || '-'}
Sampling Md: ${item.samplingMd || '-'}
Sampling Md On Lips: ${item.samplingMdOnLips || '-'}
Sampling Md To Buy: ${item.samplingMdToBuy || '-'}
Sampling Gdic: ${item.samplingGdic || '-'}
Guinness Promotional Activity Data

Guinness Promo Available: ${item.guinessPromoAvailable ? 'Yes' : 'No'}
Guinness Promo Description: ${item.guinessPromoDescription || '-'}
Guinness Promo Sold: ${item.guinessPromoSold || '-'}

Guinness Smooth Promo Available: ${item.guinessSmoothPromoAvailable ? 'Yes' : 'No'}
Guinness Smooth Promo Description: ${item.guinessSmoothPromoDescription || '-'}
Guinness Smooth Promo Sold: ${item.guinessSmoothPromoSold || '-'}
Guinness Smooth Promo Repeat Order: ${item.guinessSmoothPromoRepeatOrder || '-'}
Guinness smooth promo Description - Type 2: ${item.guinessSmoothPromoDescriptionType2 || '-'}
Guinness smooth promo Sold - Type 2: ${item.guinessSmoothPromoSoldType2 || '-'}
Guinness smooth promo repeat order - type 2: ${item.guinessSmoothPromoRepeatOrderType2 || '-'}
Guinness Gfes Promo Available: ${item.guinessGfesPromoAvailable ? 'Yes' : 'No'}
Guinness Gfes Promo Description: ${item.guinessGfesPromoDescription || '-'}
Guinness Gfes Promo Sold: ${item.guinessGfesPromoSold || '-'}
Guinness Gfes Promo Repeat Order: ${item.guinessGfesPromoRepeatOrder || '-'}
Guinness Gfes Promo Description - Type 2: ${item.guinessGfesPromoDescriptionType2 || '-'}
Guinness Gfes Promo Sold - Type 2: ${item.guinessGfesPromoSoldType2 || '-'}
Guinness Gfes Promo Repeat Order - Type 2: ${item.guinessGfesPromoRepeatOrderType2 || '-'}
Guinness Kegs Promo Available: ${item.guinessKegsPromoAvailable ? 'Yes' : 'No'}
Guinness Kegs Promo Description: ${item.guinessKegsPromoDescription || '-'}
Guinness Kegs Promo Sold: ${item.guinessKegsPromoSold || '-'}
Guinness Kegs Promo Repeat Order: ${item.guinessKegsPromoRepeatOrder || '-'}
Guinness Kegs Promo Description - Type 2: ${item.guinessKegsPromoDescriptionType2 || '-'}
Guinness Kegs Promo Sold - Type 2: ${item.guinessKegsPromoSoldType2 || '-'}
Guinness Kegs Promo Repeat Order - Type 2: ${item.guinessKegsPromoRepeatOrderType2 || '-'}
Guinness Md Promo Available: ${item.guinessMdPromoAvailable ? 'Yes' : 'No'}
Guinness Md Promo Description: ${item.guinessMdPromoDescription || '-'}
Guinness Md Promo Sold: ${item.guinessMdPromoSold || '-'}
Guinness Md Promo Repeat Order: ${item.guinessMdPromoRepeatOrder || '-'}
Guinness Md Promo Description - Type 2: ${item.guinessMdPromoDescriptionType2 || '-'}
Guinness Md Promo Sold - Type 2: ${item.guinessMdPromoSoldType2 || '-'}
Guinness Md Promo Repeat Order - Type 2: ${item.guinessMdPromoRepeatOrderType2 || '-'}
Guinness Gdic Promo Available: ${item.guinessGdicPromoAvailable ? 'Yes' : 'No'}
Guinness Gdic Promo Description: ${item.guinessGdicPromoDescription || '-'}
Guinness Gdic Promo Sold: ${item.guinessGdicPromoSold || '-'}
Guinness Gdic Promo Repeat Order: ${item.guinessGdicPromoRepeatOrder || '-'}
Guinness Gdic Promo Description - Type 2: ${item.guinessGdicPromoDescriptionType2 || '-'}
Guinness Gdic Promo Sold - Type 2: ${item.guinessGdicPromoSoldType2 || '-'}
Guinness Gdic Promo Repeat Order - Type 2: ${item.guinessGdicPromoRepeatOrderType2 || '-'}

Competitor Data
Competitor bintang Available: ${item.competitorBintangAvailable ? 'Yes' : 'No'}
Competitor Bintang Glass: ${item.competitorBintangGlass || '-'}
Competitor Bintang Pint: ${item.competitorBintangPint || '-'}
Competitor Bintang Quart: ${item.competitorBintangQuart || '-'}
Competitor Bintang Can Small: ${item.competitorBintangCanSmall || '-'}
Competitor Bintang Can Big: ${item.competitorBintangCanBig || '-'}
Competitor Bintang Promo Description: ${item.competitorBintangPromoDescription || '-'}
Competitor Bintang Promo Sold: ${item.competitorBintangPromoSold || '-'}
Competitor Bintang Crystal Available: ${item.competitorBintangCrystalAvailable ? 'Yes' : 'No'}
Competitor Bintang Crystal Glass: ${item.competitorBintangCrystalGlass || '-'}
Competitor Bintang Crystal Pint: ${item.competitorBintangCrystalPint || '-'}
Competitor Bintang Crystal Quart: ${item.competitorBintangCrystalQuart || '-'}
Competitor Bintang Crystal Can Small: ${item.competitorBintangCrystalCanSmall || '-'}
Competitor Bintang Crystal Can Big: ${item.competitorBintangCrystalCanBig || '-'}
Competitor Bintang Crystal Promo Description: ${item.competitorBintangCrystalPromoDescription || '-'}
Competitor Bintang Crystal Promo Sold: ${item.competitorBintangCrystalPromoSold || '-'}
Competitor Heineken Available: ${item.competitorHeinekenAvailable ? 'Yes' : 'No'}
Competitor Heineken Glass: ${item.competitorHeinekenGlass || '-'}
Competitor Heineken Pint: ${item.competitorHeinekenPint || '-'}
Competitor Heineken Quart: ${item.competitorHeinekenQuart || '-'}
Competitor Heineken Can Small: ${item.competitorHeinekenCanSmall || '-'}
Competitor Heineken Can Big: ${item.competitorHeinekenCanBig || '-'}
Competitor Heineken Promo Description: ${item.competitorHeinekenPromoDescription || '-'}
Competitor Heineken Promo Sold: ${item.competitorHeinekenPromoSold || '-'}
Competitor Heineken import Available: ${item.competitorHeinekenImportAvailable ? 'Yes' : 'No'}
Competitor Heineken Import Glass: ${item.competitorHeinekenImportGlass || '-'}
Competitor Heineken Import Pint: ${item.competitorHeinekenImportPint || '-'}
Competitor Heineken Import Quart: ${item.competitorHeinekenImportQuart || '-'}
Competitor Heineken Import Can Small: ${item.competitorHeinekenImportCanSmall || '-'}
Competitor Heineken Import Can Big: ${item.competitorHeinekenImportCanBig || '-'}
Competitor Heineken Import Promo Description: ${item.competitorHeinekenImportPromoDescription || '-'}
Competitor Heineken Import Promo Sold: ${item.competitorHeinekenImportPromoSold || '-'}
Competitor Erdinger Available: ${item.competitorErdingerAvailable ? 'Yes' : 'No'}
Competitor Erdinger Glass: ${item.competitorErdingerGlass || '-'}
Competitor Erdinger Pint: ${item.competitorErdingerPint || '-'} 
Competitor Erdinger Quart: ${item.competitorErdingerQuart || '-'}
Competitor Erdinger Can Small: ${item.competitorErdingerCanSmall || '-'}
Competitor Erdinger Can Big: ${item.competitorErdingerCanBig || '-'}
Competitor Erdinger Promo Description: ${item.competitorErdingerPromoDescription || '-'}
Competitor Erdinger Promo Sold: ${item.competitorErdingerPromoSold || '-'}
Competitor Budweiser Available: ${item.competitorBudweiserAvailable ? 'Yes' : 'No'}
Competitor Budweiser Glass: ${item.competitorBudweiserGlass || '-'}
Competitor Budweiser Pint: ${item.competitorBudweiserPint || '-'}
Competitor Budweiser Quart: ${item.competitorBudweiserQuart || '-'}
Competitor Budweiser Can Small: ${item.competitorBudweiserCanSmall || '-'}
Competitor Budweiser Can Big: ${item.competitorBudweiserCanBig || '-'}
Competitor Budweiser Promo Description: ${item.competitorBudweiserPromoDescription || '-'}
Competitor Budweiser Promo Sold: ${item.competitorBudweiserPromoSold || '-'}
Competitor Anker Available: ${item.competitorAnchorAvailable ? 'Yes' : 'No'}
Competitor Anker Glass: ${item.competitorAnchorGlass || '-'}
Competitor Anker Pint: ${item.competitorAnchorPint || '-'}
Competitor Anker Quart: ${item.competitorAnchorQuart || '-'}
Competitor Anker Can Small: ${item.competitorAnchorCanSmall || '-'}
Competitor Anker Can Big: ${item.competitorAnchorCanBig || '-'}
Competitor Anker Promo Description: ${item.competitorAnchorPromoDescription || '-'}
Competitor Anker Promo Sold: ${item.competitorAnchorPromoSold || '-'}
Competitor Bali Hai Available: ${item.competitorBaliHaiAvailable ? 'Yes' : 'No'}
Competitor Bali Hai Glass: ${item.competitorBaliHaiGlass || '-'}
Competitor Bali Hai Pint: ${item.competitorBaliHaiPint || '-'}
Competitor Bali Hai Quart: ${item.competitorBaliHaiQuart || '-'}
Competitor Bali Hai Can Small: ${item.competitorBaliHaiCanSmall || '-'}
Competitor Bali Hai Can Big: ${item.competitorBaliHaiCanBig || '-'}
Competitor Bali Hai Promo Description: ${item.competitorBaliHaiPromoDescription || '-'}
Competitor Bali Hai Promo Sold: ${item.competitorBaliHaiPromoSold || '-'}
Competitor Prost Available: ${item.competitorProstAvailable ? 'Yes' : 'No'}
Competitor Prost Glass: ${item.competitorProstGlass || '-'}
Competitor Prost Pint: ${item.competitorProstPint || '-'}
Competitor Prost Quart: ${item.competitorProstQuart || '-'}
Competitor Prost Can Small: ${item.competitorProstCanSmall || '-'}
Competitor Prost Can Big: ${item.competitorProstCanBig || '-'}
Competitor Prost Promo Description: ${item.competitorProstPromoDescription || '-'}
Competitor Prost Promo Sold: ${item.competitorProstPromoSold || '-'}
Competitor San Miguel Available: ${item.competitorSanMiguelAvailable ? 'Yes' : 'No'}
Competitor San Miguel Glass: ${item.competitorSanMiguelGlass || '-'}
Competitor San Miguel Pint: ${item.competitorSanMiguelPint || '-'}
Competitor San Miguel Quart: ${item.competitorSanMiguelQuart || '-'}
Competitor San Miguel Can Small: ${item.competitorSanMiguelCanSmall || '-'}
Competitor San Miguel Can Big: ${item.competitorSanMiguelCanBig || '-'}
Competitor San Miguel Promo Description: ${item.competitorSanMiguelPromoDescription || '-'}
Competitor San Miguel Promo Sold: ${item.competitorSanMiguelPromoSold || '-'}
Competitor Singaraja Available: ${item.competitorSingarajaAvailable ? 'Yes' : 'No'}
Competitor Singaraja Glass: ${item.competitorSingarajaGlass || '-'}
Competitor Singaraja Pint: ${item.competitorSingarajaPint || '-'}
Competitor Singaraja Quart: ${item.competitorSingarajaQuart || '-'}
Competitor Singaraja Can Small: ${item.competitorSingarajaCanSmall || '-'}
Competitor Singaraja Can Big: ${item.competitorSingarajaCanBig || '-'}
Competitor Singaraja Promo Description: ${item.competitorSingarajaPromoDescription || '-'}
Competitor Singaraja Promo Sold: ${item.competitorSingarajaPromoSold || '-'}
Competitor Carlsberg Available: ${item.competitorCarlsbergAvailable ? 'Yes' : 'No'}
Competitor Carlsberg Glass: ${item.competitorCarlsbergGlass || '-'}
Competitor Carlsberg Pint: ${item.competitorCarlsbergPint || '-'}
Competitor Carlsberg Quart: ${item.competitorCarlsbergQuart || '-'}
Competitor Carlsberg Can Small: ${item.competitorCarlsbergCanSmall || '-'}
Competitor Carlsberg Can Big: ${item.competitorCarlsbergCanBig || '-'}
Competitor Carlsberg Promo Description: ${item.competitorCarlsbergPromoDescription || '-'}
Competitor Carlsberg Promo Sold: ${item.competitorCarlsbergPromoSold || '-'}
Competitor Draftbeer Available: ${item.competitorDraftbeerAvailable ? 'Yes' : 'No'}
Competitor Draftbeer Glass: ${item.competitorDraftbeerGlass || '-'}
Competitor Draftbeer Pint: ${item.competitorDraftbeerPint || '-'}
Competitor Draftbeer Quart: ${item.competitorDraftbeerQuart || '-'}
Competitor Draftbeer Can Small: ${item.competitorDraftbeerCanSmall || '-'}
Competitor Draftbeer Can Big: ${item.competitorDraftbeerCanBig || '-'} 
Competitor Draftbeer Promo Description: ${item.competitorDraftbeerPromoDescription || '-'}
Competitor Draftbeer Promo Sold: ${item.competitorDraftbeerPromoSold || '-'}
Competitor Kura Kura Available: ${item.competitorKuraKuraAvailable ? 'Yes' : 'No'}
Competitor Kura Kura Glass: ${item.competitorKuraKuraGlass || '-'}
Competitor Kura Kura Pint: ${item.competitorKuraKuraPint || '-'}
Competitor Kura Kura Quart: ${item.competitorKuraKuraQuart || '-'}
Competitor Kura Kura Can Small: ${item.competitorKuraKuraCanSmall || '-'}
Competitor Kura Kura Can Big: ${item.competitorKuraKuraCanBig || '-'}
Competitor Kura Kura Promo Description: ${item.competitorKuraKuraPromoDescription || '-'}
Competitor Kura Kura Promo Sold: ${item.competitorKuraKuraPromoSold || '-'} 
Competitor island brewing Available: ${item.competitorIslandBrewingAvailable ? 'Yes' : 'No'}
Competitor Island Brewing Glass: ${item.competitorIslandBrewingGlass || '-'}
Competitor Island Brewing Pint: ${item.competitorIslandBrewingPint || '-'}
Competitor Island Brewing Quart: ${item.competitorIslandBrewingQuart || '-'}
Competitor Island Brewing Can Small: ${item.competitorIslandBrewingCanSmall || '-'}
Competitor Island Brewing Can Big: ${item.competitorIslandBrewingCanBig || '-'}
Competitor Island Brewing Promo Description: ${item.competitorIslandBrewingPromoDescription || '-'}
Competitor Island Brewing Promo Sold: ${item.competitorIslandBrewingPromoSold || '-'}
Competitor Others Available: ${item.competitorOthersAvailable ? 'Yes' : 'No'}
Competitor Others Glass: ${item.competitorOthersGlass || '-'}
Competitor Others Pint: ${item.competitorOthersPint || '-'}
Competitor Others Quart: ${item.competitorOthersQuart || '-'}
Competitor Others Can Small: ${item.competitorOthersCanSmall || '-'}
Competitor Others Can Big: ${item.competitorOthersCanBig || '-'}
Competitor Others Promo Description: ${item.competitorOthersPromoDescription || '-'}
Competitor Others Promo Sold: ${item.competitorOthersPromoSold || '-'}
Merchandise Data
Merchandise Available: ${item.merchandiseAvailable ? 'Yes' : 'No'}
Merchandise Type 1: ${item.merchandiseDescription1 || '-'}
Merchandise Out Sold 1: ${item.merchandiseSold1 || '-'}
Merchandise Type 2: ${item.merchandiseDescription2 || '-'}
Merchandise Out Sold 2: ${item.merchandiseSold2 || '-'}
Merchandise Type 3: ${item.merchandiseDescription3 || '-'}
Merchandise Out Sold 3: ${item.merchandiseSold3 || '-'}
Merchandise Type 4: ${item.merchandiseDescription4 || '-'}
Merchandise Out Sold 4: ${item.merchandiseSold4 || '-'}
Merchandise Type 5: ${item.merchandiseDescription5 || '-'}
Merchandise Out Sold 5: ${item.merchandiseSold5 || '-'}
Weather Data
Weather Status: ${item.weatherStatus || '-'}
Sales Report Summary Notes and Learning
Issues/Notes/Requests: ${item.issuesNotesRequests || '-'}
Learning Points: ${item.learningPoints || '-'}
...`; // Add more fields as needed
};

  const renderDescriptionModal = () => (
    <Modal
      visible={isDescriptionModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsDescriptionModalVisible(false)}
    >
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Description</Text>
          {descriptionItem ? (
            <>
              <Text selectable style={styles.sectionTitle}>Personnel Information</Text>
                <Text selectable>Assigned to BA: {descriptionItem.assignedToBA || '-'}</Text>
                <Text selectable>Assigned to TL: {descriptionItem.assignedToTL || '-'}</Text>
                <Text selectable>BA Count: {descriptionItem.baCount || '-'}</Text>
                <Text selectable>Crew Canvasser Count: {descriptionItem.crewCanvasserCount || '-'}</Text>
                <Text selectable>Team Leader Name: {descriptionItem.teamLeaderName || '-'}</Text>
                <Text selectable>SPG Name: {descriptionItem.spgName || '-'}</Text>
                <Text selectable>Sales Report Detail Status: {descriptionItem.salesReportDetailStatus || '-'}</Text>
                <Text selectable>Created At: {descriptionItem.createdAt?.toDate ? descriptionItem.createdAt.toDate().toLocaleString() : '-'}</Text>
                <Text selectable>Created By: {descriptionItem.createdBy || '-'}</Text>
                <Text selectable>Task ID: {descriptionItem.tasksId || '-'}</Text>
                <Text selectable>Sales Report Detail Status: {descriptionItem.salesReportDetailStatus || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Outlet Information</Text>
                <Text selectable>Outlet ID: {descriptionItem.outletId || '-'}</Text>
                <Text selectable>Outlet Name: {descriptionItem.outletName || '-'}</Text>
                <Text selectable>Province: {descriptionItem.outletProvince || '-'}</Text>
                <Text selectable>City: {descriptionItem.outletCity || '-'}</Text>
                <Text selectable>Activity Name: {descriptionItem.activityName || '-'}</Text>
                <Text selectable>Outlet Venue Name: {descriptionItem.outletVenueName || '-'}</Text>
                <Text selectable>Outlet Event PIC: {descriptionItem.outletEventPic || '-'}</Text>
                <Text selectable>Outlet Capacity: {descriptionItem.outletCapacity || '-'}</Text>
                <Text selectable>Outlet No. of Tables Available: {descriptionItem.outletNoOfTableAVailable || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Guinness Selling Data</Text>
                <Text selectable>Sales Kegs 330ml: {descriptionItem.salesKegs330 || '-'}</Text>
                <Text selectable>Sales Kegs 500ml: {descriptionItem.salesKegs500 || '-'}</Text>
                <Text selectable>Sales MD 500ml: {descriptionItem.salesMd500 || '-'}</Text>
                <Text selectable>Sales Gdic 400ml: {descriptionItem.salesGdic400 || '-'}</Text>
                <Text selectable>Sales Smooth Pint 330ml: {descriptionItem.salesSmoothPint330 || '-'}</Text>
                <Text selectable>Sales Smooth Can 330ml: {descriptionItem.salesSmoothCan330 || '-'}</Text>
                <Text selectable>Sales Gfes Pint 330ml: {descriptionItem.salesGfesPint330 || '-'}</Text>
                <Text selectable>Sales Gfes Can 330ml: {descriptionItem.salesGfesCan330 || '-'}</Text>
                <Text selectable>Sales Gfes Quart 620ml: {descriptionItem.salesGfesQuart620 || '-'}</Text>
                <Text selectable>Sales Gfes Can Big 500ml: {descriptionItem.salesGfesCanbig500 || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Sampling Data</Text>
                <Text selectable>Sampling available: {descriptionItem.samplingAvailable || '-'}</Text>
                <Text selectable>Sampling Smooth Bottle: {descriptionItem.samplingSmoothBottle || '-'}</Text>
                <Text selectable>Sampling Smooth On Lips: {descriptionItem.samplingSmoothOnLips || '-'}</Text>
                <Text selectable>Sampling Smooth Bottle To Buy: {descriptionItem.samplingSmoothBottleToBuy || '-'}</Text>
                <Text selectable>Sampling Gfes Bottle: {descriptionItem.samplingGfesBottle || '-'}</Text>
                <Text selectable>Sampling Gfes On Lips: {descriptionItem.samplingGfesOnLips || '-'}</Text>
                <Text selectable>Sampling Gfes To Buy: {descriptionItem.samplingGfesToBuy || '-'}</Text>
                <Text selectable>Sampling Kegs: {descriptionItem.samplingKegs || '-'}</Text>
                <Text selectable>Sampling Kegs On Lips: {descriptionItem.samplingKegsOnLips || '-'}</Text>
                <Text selectable>Sampling Kegs To Buy: {descriptionItem.samplingKegsToBuy || '-'}</Text>
                <Text selectable>Sampling Md : {descriptionItem.samplingMd || '-'}</Text>
                <Text selectable>Sampling Md On Lips: {descriptionItem.samplingMdOnLips || '-'}</Text>
                <Text selectable>Sampling Md To Buy: {descriptionItem.samplingMdToBuy || '-'}</Text>
                <Text selectable>Sampling Gdic: {descriptionItem.samplingGdic || '-'}</Text>
                <Text selectable>Sampling Gdic On Lips: {descriptionItem.samplingGdicOnLips || '-'}</Text>
                <Text selectable>Sampling Gdic Bottle To Buy: {descriptionItem.samplingGdicBottleToBuy || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Call and Customer Data</Text>
                <Text selectable>Calls Offers: {descriptionItem.callsOffers || '-'}</Text>
                <Text selectable>Effective Calls: {descriptionItem.effectiveCalls || '-'}</Text>
                <Text selectable>Calls vs Effective Percentage: {descriptionItem.callsVsEffectivePercentage || '-'}</Text>
               
                <Text selectable style={styles.sectionTitle}>Guinness Promotional Activities</Text>
                <Text selectable>Guinness Smooth Promotion Available: {descriptionItem.guinnessSmoothPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Smooth Description: {descriptionItem.promoSmoothDescription || '-'}</Text>
                <Text selectable>Promo Smooth Sold: {descriptionItem.promoSmoothSold || '-'}</Text>
                <Text selectable>Promo Smooth Repeat Orders: {descriptionItem.promoSmoothRepeatOrders || '-'}</Text>
                <Text selectable>Promo Smooth Description - Type 2: {descriptionItem.promoSmoothDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Smooth Sold - Type 2: {descriptionItem.promoSmoothSoldType2 || '-'}</Text>
                <Text selectable>Promo Smooth Repeat Orders - Type 2: {descriptionItem.promoSmoothRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Gfes Promotion Available: {descriptionItem.guinnessGfesPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Gfes Description: {descriptionItem.promoGfesDescription || '-'}</Text>
                <Text selectable>Promo Gfes Sold: {descriptionItem.promoGfesSold || '-'}</Text>
                <Text selectable>Promo Gfes Repeat Orders: {descriptionItem.promoGfesRepeatOrders || '-'}</Text>
                <Text selectable>Promo Gfes Description - Type 2: {descriptionItem.promoGfesDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Gfes Sold - Type 2: {descriptionItem.promoGfesSoldType2 || '-'}</Text>
                <Text selectable>Promo Gfes Repeat Orders - Type 2: {descriptionItem.promoGfesRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Kegs Promotion Available: {descriptionItem.guinnessKegsPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Kegs Description: {descriptionItem.promoKegsDescription || '-'}</Text>
                <Text selectable>Promo Kegs Sold: {descriptionItem.promoKegsSold || '-'}</Text>
                <Text selectable>Promo Kegs Repeat Orders: {descriptionItem.promoKegsRepeatOrders || '-'}</Text>
                <Text selectable>Promo Kegs Description - Type 2: {descriptionItem.promoKegsDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Kegs Sold - Type 2: {descriptionItem.promoKegsSoldType2 || '-'}</Text>
                <Text selectable>Promo Kegs Repeat Orders - Type 2: {descriptionItem.promoKegsRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Microdraught Promotion Available: {descriptionItem.guinnessMicroDraughtPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Microdraught Description: {descriptionItem.promoMicrodraughtDescription || '-'}</Text>
                <Text selectable>Promo Microdraught Sold: {descriptionItem.promoMicrodraughtSold || '-'}</Text>
                <Text selectable>Promo Microdraught Repeat Orders: {descriptionItem.promoMicrodraughtRepeatOrders || '-'}</Text>
                <Text selectable>Promo Microdraught Description - Type 2: {descriptionItem.promoMicrodraughtDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Microdraught Sold - Type 2: {descriptionItem.promoMicrodraughtSoldType2 || '-'}</Text>
                <Text selectable>Promo Microdraught Repeat Orders - Type 2: {descriptionItem.promoMicrodraughtRepeatOrdersType2 || '-'}</Text>
                <Text selectable>Guinness Gdic Promotion Available: {descriptionItem.guinnessGdicPromotionAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Promo Gdic Description: {descriptionItem.promoGdicDescription || '-'}</Text>
                <Text selectable>Promo Gdic Sold: {descriptionItem.promoGdicSold || '-'}</Text>
                <Text selectable>Promo Gdic Repeat Orders: {descriptionItem.promoGdicRepeatOrders || '-'}</Text>
                <Text selectable>Promo Gdic Description - Type 2: {descriptionItem.promoGdicDescriptionType2 || '-'}</Text>
                <Text selectable>Promo Gdic Sold - Type 2: {descriptionItem.promoGdicSoldType2 || '-'}</Text>
                <Text selectable>Promo Gdic Repeat Orders - Type 2: {descriptionItem.promoGdicRepeatOrdersType2 || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Visitor and Consumer Data</Text>
                <Text selectable>Visitors Overall: {descriptionItem.visitorsOverall || '-'}</Text>
                <Text selectable>Visitors Alcohol Drinkers: {descriptionItem.visitorsAlcoholDrinkers || '-'}</Text>
                <Text selectable>Visitors All Beer Drinkers: {descriptionItem.visitorsAllBeerDrinkers || '-'}</Text>
                <Text selectable>Visitors All Guinness: {descriptionItem.visitorsAllGuinness || '-'}</Text>
                <Text selectable>Visitors All Competitor: {descriptionItem.visitorsAllCompetitor || '-'}</Text>
                <Text selectable>Visitors All Guinness Mixed Competitor: {descriptionItem.visitorsAllGuinnessMixedCompetitor || '-'}</Text>
                <Text selectable>Drinkers Smooth: {descriptionItem.drinkersSmooth || '-'}</Text>
                <Text selectable>Drinkers Gfes: {descriptionItem.drinkersGfes || '-'}</Text>
                <Text selectable>Drinkers Kegs: {descriptionItem.drinkersKegs || '-'}</Text>
                <Text selectable>Drinkers Microdraught: {descriptionItem.drinkersMicrodraught || '-'}</Text>
                <Text selectable>Drinkers Gdic: {descriptionItem.drinkersGdic || '-'}</Text>
                <Text selectable>Drinkers Mixed: {descriptionItem.drinkersMixed || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Tables Data</Text>
                <Text selectable>Tables Overall: {descriptionItem.tablesOverall || '-'}</Text>
                <Text selectable>Tables Alcohol Drinkers: {descriptionItem.tablesAlcoholDrinkers || '-'}</Text>
                <Text selectable>Tables Non Alcohol Drinkers: {descriptionItem.tablesNonAlcoholDrinkers || '-'}</Text>
                <Text selectable>Tables All Beer Drinkers: {descriptionItem.tablesAllBeerDrinkers || '-'}</Text>
                <Text selectable>Tables All Guinness: {descriptionItem.tablesAllGuinness || '-'}</Text>
                <Text selectable>Tables All Competitor: {descriptionItem.tablesAllCompetitor || '-'}</Text>
                <Text selectable>Tables All Guinness Mixed Competitor: {descriptionItem.tablesAllGuinnessMixedCompetitor || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Competitor Sales</Text>
                <Text selectable>Competitor Bintang Available: {descriptionItem.competitorBintangAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Bintang Glass: {descriptionItem.competitorBintangGlass || '-'}</Text>
                <Text selectable>Competitor Bintang Pint: {descriptionItem.competitorBintangPint || '-'}</Text>
                <Text selectable>Competitor Bintang Quart: {descriptionItem.competitorBintangQuart || '-'}</Text>
                <Text selectable>Competitor Bintang Can Small: {descriptionItem.competitorBintangCanSmall || '-'}</Text>
                <Text selectable>Competitor Bintang Can Big: {descriptionItem.competitorBintangCanBig || '-'}</Text>
                <Text selectable>Competitor Bintang Promo Description: {descriptionItem.competitorBintangPromoDescription || '-'}</Text>
                <Text selectable>Competitor Bintang Promo Sold: {descriptionItem.competitorBintangPromoSold || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Available: {descriptionItem.competitorBintangCrystalAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Bintang Crystal Glass: {descriptionItem.competitorBintangCrystalGlass || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Pint: {descriptionItem.competitorBintangCrystalPint || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Quart: {descriptionItem.competitorBintangCrystalQuart || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Can Small: {descriptionItem.competitorBintangCrystalCanSmall || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Can Big: {descriptionItem.competitorBintangCrystalCanBig || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Promo Description: {descriptionItem.competitorBintangCrystalPromoDescription || '-'}</Text>
                <Text selectable>Competitor Bintang Crystal Promo Sold: {descriptionItem.competitorBintangCrystalPromoSold || '-'}</Text>
                <Text selectable>Competitor Heineken Available: {descriptionItem.competitorHeinekenAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Heineken Glass: {descriptionItem.competitorHeinekenGlass || '-'}</Text>
                <Text selectable>Competitor Heineken Pint: {descriptionItem.competitorHeinekenPint || '-'}</Text>
                <Text selectable>Competitor Heineken Quart: {descriptionItem.competitorHeinekenQuart || '-'}</Text>
                <Text selectable>Competitor Heineken Can Small: {descriptionItem.competitorHeinekenCanSmall || '-'}</Text>
                <Text selectable>Competitor Heineken Can Big: {descriptionItem.competitorHeinekenCanBig || '-'}</Text>
                <Text selectable>Competitor Heineken Promo Description: {descriptionItem.competitorHeinekenPromoDescription || '-'}</Text>
                <Text selectable>Competitor Heineken Promo Sold: {descriptionItem.competitorHeinekenPromoSold || '-'}</Text>
                <Text selectable>Competitor Heineken Import Available: {descriptionItem.competitorHeinekenImportAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Heineken Import Glass: {descriptionItem.competitorHeinekenImportGlass || '-'}</Text>
                <Text selectable>Competitor Heineken Import Pint: {descriptionItem.competitorHeinekenImportPint || '-'}</Text>
                <Text selectable>Competitor Heineken Import Quart: {descriptionItem.competitorHeinekenImportQuart || '-'}</Text>
                <Text selectable>Competitor Heineken Import Can Small: {descriptionItem.competitorHeinekenImportCanSmall || '-'}</Text>
                <Text selectable>Competitor Heineken Import Can Big: {descriptionItem.competitorHeinekenImportCanBig || '-'}</Text>
                <Text selectable>Competitor Heineken Import Promo Description: {descriptionItem.competitorHeinekenImportPromoDescription || '-'}</Text>
                <Text selectable>Competitor Heineken Import Promo Sold: {descriptionItem.competitorHeinekenImportPromoSold || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Available: {descriptionItem.competitorErdingerImportAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Erdinger Import Glass: {descriptionItem.competitorErdingerImportGlass || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Pint: {descriptionItem.competitorErdingerImportPint || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Quart: {descriptionItem.competitorErdingerImportQuart || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Can Small: {descriptionItem.competitorErdingerImportCanSmall || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Can Big: {descriptionItem.competitorErdingerImportCanBig || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Promo Description: {descriptionItem.competitorErdingerImportPromoDescription || '-'}</Text>
                <Text selectable>Competitor Erdinger Import Promo Sold: {descriptionItem.competitorErdingerImportPromoSold || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Available: {descriptionItem.competitorBudweizerImportAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Budweizer Import Glass: {descriptionItem.competitorBudweizerImportGlass || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Pint: {descriptionItem.competitorBudweizerImportPint || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Quart: {descriptionItem.competitorBudweizerImportQuart || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Can Small: {descriptionItem.competitorBudweizerImportCanSmall || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Can Big: {descriptionItem.competitorBudweizerImportCanBig || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Promo Description: {descriptionItem.competitorBudweizerImportPromoDescription || '-'}</Text>
                <Text selectable>Competitor Budweizer Import Promo Sold: {descriptionItem.competitorBudweizerImportPromoSold || '-'}</Text>
                <Text selectable>Competitor Anker Available: {descriptionItem.competitorAnkerAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Anker Glass: {descriptionItem.competitorAnkerGlass || '-'}</Text>
                <Text selectable>Competitor Anker Pint: {descriptionItem.competitorAnkerPint || '-'}</Text>
                <Text selectable>Competitor Anker Quart: {descriptionItem.competitorAnkerQuart || '-'}</Text>
                <Text selectable>Competitor Anker Can Small: {descriptionItem.competitorAnkerCanSmall || '-'}</Text>
                <Text selectable>Competitor Anker Can Big: {descriptionItem.competitorAnkerCanBig || '-'}</Text>
                <Text selectable>Competitor Anker Promo Description: {descriptionItem.competitorAnkerPromoDescription || '-'}</Text>
                <Text selectable>Competitor Anker Promo Sold: {descriptionItem.competitorAnkerPromoSold || '-'}</Text>
                <Text selectable>Competitor Bali Hai Available: {descriptionItem.competitorBalihaiAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Bali Hai Glass: {descriptionItem.competitorBalihaiGlass || '-'}</Text>
                <Text selectable>Competitor Bali Hai Pint: {descriptionItem.competitorBalihaiPint || '-'}</Text>
                <Text selectable>Competitor Bali Hai Quart: {descriptionItem.competitorBalihaiQuart || '-'}</Text>
                <Text selectable>Competitor Bali Hai Can Small: {descriptionItem.competitorBalihaiCanSmall || '-'}</Text>
                <Text selectable>Competitor Bali Hai Can Big: {descriptionItem.competitorBalihaiCanBig || '-'}</Text>
                <Text selectable>Competitor Bali Hai Promo Description: {descriptionItem.competitorBalihaiPromoDescription || '-'}</Text>
                <Text selectable>Competitor Bali Hai Promo Sold: {descriptionItem.competitorBalihaiPromoSold || '-'}</Text>
                <Text selectable>Competitor Prost Available: {descriptionItem.competitorProstAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Prost Glass: {descriptionItem.competitorProstGlass || '-'}</Text>
                <Text selectable>Competitor Prost Pint: {descriptionItem.competitorProstPint || '-'}</Text>
                <Text selectable>Competitor Prost Quart: {descriptionItem.competitorProstQuart || '-'}</Text>
                <Text selectable>Competitor Prost Can Small: {descriptionItem.competitorProstCanSmall || '-'}</Text>
                <Text selectable>Competitor Prost Can Big: {descriptionItem.competitorProstCanBig || '-'}</Text>
                <Text selectable>Competitor Prost Promo Description: {descriptionItem.competitorProstPromoDescription || '-'}</Text>
                <Text selectable>Competitor Prost Promo Sold: {descriptionItem.competitorProstPromoSold || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Available: {descriptionItem.competitorSanmiguelAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Sanmiguel Glass: {descriptionItem.competitorSanmiguelGlass || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Pint: {descriptionItem.competitorSanmiguelPint || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Quart: {descriptionItem.competitorSanmiguelQuart || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Can Small: {descriptionItem.competitorSanmiguelCanSmall || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Can Big: {descriptionItem.competitorSanmiguelCanBig || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Promo Description: {descriptionItem.competitorSanmiguelPromoDescription || '-'}</Text>
                <Text selectable>Competitor Sanmiguel Promo Sold: {descriptionItem.competitorSanmiguelPromoSold || '-'}</Text>
                <Text selectable>Competitor Singaraja Available: {descriptionItem.competitorSingarajaAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Singaraja Glass: {descriptionItem.competitorSingarajaGlass || '-'}</Text>
                <Text selectable>Competitor Singaraja Pint: {descriptionItem.competitorSingarajaPint || '-'}</Text>
                <Text selectable>Competitor Singaraja Quart: {descriptionItem.competitorSingarajaQuart || '-'}</Text>
                <Text selectable>Competitor Singaraja Can Small: {descriptionItem.competitorSingarajaCanSmall || '-'}</Text>
                <Text selectable>Competitor Singaraja Can Big: {descriptionItem.competitorSingarajaCanBig || '-'}</Text>
                <Text selectable>Competitor Carlsberg Available: {descriptionItem.competitorCarlsbergAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Carlsberg Glass: {descriptionItem.competitorCarlsbergGlass || '-'}</Text>
                <Text selectable>Competitor Carlsberg Pint: {descriptionItem.competitorCarlsbergPint || '-'}</Text>
                <Text selectable>Competitor Carlsberg Quart: {descriptionItem.competitorCarlsbergQuart || '-'}</Text>
                <Text selectable>Competitor Carlsberg Can Small: {descriptionItem.competitorCarlsbergCanSmall || '-'}</Text>
                <Text selectable>Competitor Carlsberg Can Big: {descriptionItem.competitorCarlsbergCanBig || '-'}</Text>
                <Text selectable>Competitor Carlsberg Promo Description: {descriptionItem.competitorCarlsbergPromoDescription || '-'}</Text>
                <Text selectable>Competitor Carlsberg Promo Sold: {descriptionItem.competitorCarlsbergPromoSold || '-'}</Text>
                <Text selectable>Competitor Draftbeer available: {descriptionItem.competitorDraftbeerAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Draftbeer Glass: {descriptionItem.competitorDraftbeerGlass || '-'}</Text>
                <Text selectable>Competitor Draftbeer Pint: {descriptionItem.competitorDraftbeerPint || '-'}</Text>
                <Text selectable>Competitor Draftbeer Quart: {descriptionItem.competitorDraftbeerQuart || '-'}</Text>
                <Text selectable>Competitor Draftbeer Can Small: {descriptionItem.competitorDraftbeerCanSmall || '-'}</Text>
                <Text selectable>Competitor Draftbeer Can Big: {descriptionItem.competitorDraftbeerCanBig || '-'}</Text>
                <Text selectable>Competitor Draftbeer Promo Description: {descriptionItem.competitorDraftbeerPromoDescription || '-'}</Text>
                <Text selectable>Competitor Draftbeer Promo Sold: {descriptionItem.competitorDraftbeerPromoSold || '-'}</Text>
                <Text selectable>Competitor kurakura Available: {descriptionItem.competitorKurakuraAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor kurakura Glass: {descriptionItem.competitorKurakuraGlass || '-'}</Text>
                <Text selectable>Competitor kurakura Pint: {descriptionItem.competitorKurakuraPint || '-'}</Text>
                <Text selectable>Competitor kurakura Quart: {descriptionItem.competitorKurakuraQuart || '-'}</Text>
                <Text selectable>Competitor kurakura Can Small: {descriptionItem.competitorKurakuraCanSmall || '-'}</Text>
                <Text selectable>Competitor kurakura Can Big: {descriptionItem.competitorKurakuraCanBig || '-'}</Text>
                <Text selectable>Competitor kurakura Promo Description: {descriptionItem.competitorKurakuraPromoDescription || '-'}</Text>
                <Text selectable>Competitor kurakura Promo Sold: {descriptionItem.competitorKurakuraPromoSold || '-'}</Text>
                <Text selectable>Competitor Island Brewing Available: {descriptionItem.competitorIslandBrewingAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Island Brewing Glass: {descriptionItem.competitorIslandBrewingGlass || '-'}</Text>
                <Text selectable>Competitor Island Brewing Pint: {descriptionItem.competitorIslandBrewingPint || '-'}</Text>
                <Text selectable>Competitor Island Brewing Quart: {descriptionItem.competitorIslandBrewingQuart || '-'}</Text>
                <Text selectable>Competitor Island Brewing Can Small: {descriptionItem.competitorIslandBrewingCanSmall || '-'}</Text>
                <Text selectable>Competitor Island Brewing Can Big: {descriptionItem.competitorIslandBrewingCanBig || '-'}</Text>
                <Text selectable>Competitor Island Brewing Promo Description: {descriptionItem.competitorIslandBrewingPromoDescription || '-'}</Text>
                <Text selectable>Competitor Island Brewing Promo Sold: {descriptionItem.competitorIslandBrewingPromoSold || '-'}</Text>
                <Text selectable>Competitor Others Available: {descriptionItem.competitorOthersAvailable ? 'Yes' : 'No'}</Text>
                <Text selectable>Competitor Others Glass: {descriptionItem.competitorOthersGlass || '-'}</Text>
                <Text selectable>Competitor Others Pint: {descriptionItem.competitorOthersPint || '-'}</Text>
                <Text selectable>Competitor Others Quart: {descriptionItem.competitorOthersQuart || '-'}</Text>
                <Text selectable>Competitor Others Can Small: {descriptionItem.competitorOthersCanSmall || '-'}</Text>
                <Text selectable>Competitor Others Can Big: {descriptionItem.competitorOthersCanBig || '-'}</Text>
                <Text selectable>Competitor Others Promo Description: {descriptionItem.competitorOthersPromoDescription || '-'}</Text>
                <Text selectable>Competitor Others Promo Sold: {descriptionItem.competitorOthersPromoSold || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Merchandise Data</Text>
                <Text selectable>Merchandise Description 1: {descriptionItem.merchandiseDescription1 || '-'}</Text>
                <Text selectable>Merchandise Sold 1: {descriptionItem.merchandiseSold1 || '-'}</Text>
                <Text selectable>Merchandise Description 2: {descriptionItem.merchandiseDescription2 || '-'}</Text>
                <Text selectable>Merchandise Sold 2: {descriptionItem.merchandiseSold2 || '-'}</Text>
                <Text selectable>Merchandise Description 3: {descriptionItem.merchandiseDescription3 || '-'}</Text>
                <Text selectable>Merchandise Sold 3: {descriptionItem.merchandiseSold3 || '-'}</Text>
                <Text selectable>Merchandise Description 4: {descriptionItem.merchandiseDescription4 || '-'}</Text>
                <Text selectable>Merchandise Sold 4: {descriptionItem.merchandiseSold4 || '-'}</Text>
                <Text selectable>Merchandise Description 5: {descriptionItem.merchandiseDescription5 || '-'}</Text>
                <Text selectable>Merchandise Sold 5: {descriptionItem.merchandiseSold5 || '-'}</Text>

                <Text selectable>Competitor Activity Description: {descriptionItem.competitorActivityDescription || '-'}</Text>
                <Text selectable>Competitor Activity SPG Total: {descriptionItem.competitorActivitySpgTotal || '-'}</Text>
                <Text selectable>Competitor Only Drinkers: {descriptionItem.drinkerCompetitorOnly || '-'}</Text>
                
                <Text selectable style={styles.sectionTitle}>Weather Data</Text>
                <Text selectable>Weather Status: {descriptionItem.weatherStatus || '-'}</Text>

                <Text selectable style={styles.sectionTitle}>Sales Report Summary Notes and Learning</Text>
                <Text selectable>Issues/Notes/Requests: {descriptionItem.issuesNotesRequests || '-'}</Text>
                <Text selectable>Learning Points: {descriptionItem.learningPoints || '-'}</Text>


                
                {/* Add more fields as needed */}
            </>
          ) : (
            <Text>No data available.</Text>
          )}
          <Button
                  title="Copy All"
                  onPress={() => Clipboard.setStringAsync(getDescriptionText(descriptionItem))}
                />
          <Button title="Close" onPress={() => setIsDescriptionModalVisible(false)} />
        </View>
      </ScrollView>
    </Modal>
  );

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
      {renderReviewModal()}
      {renderDescriptionModal()}
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
});
