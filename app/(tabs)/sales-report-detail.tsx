import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';


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
    outletName: '', outletProvince: '', outletCity: '',
    // Assigned
    assignedToBA: '', assignedToTL: '',
    // Guinness Selling Data
    salesKegs330: '', salesKegs500: '', salesMd500: '', salesGdic400: '', salesSmoothPint330: '', salesSmoothCan330: '', salesGfesPint330: '', salesGfesCan330: '', salesGfesQuart620: '', salesGfesCanbig500: '',
    // Personnel Information
    outletEventPic: '', baCount: '', crewCanvasserCount: '', teamLeaderName: '', spgName: '',
    // Sampling Data
    samplingSmoothBottle: '', samplingSmoothOnLips: '', samplingGfesBottle: '', samplingGfesOnLips: '', samplingTargetAchievement: '',
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
    // Merchandise and Programs
    merchandiseAvailable: false, merchandiseDistributed: '', stoutieProgramParticipation: false, loyaltyProgramDetails: '',
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
  };

  const [formData, setFormData] = useState(initialFormData);
  // State for early_task_assessment merchandiseAvailable
  const [assessmentMerchandiseAvailable, setAssessmentMerchandiseAvailable] = useState<boolean | null>(null);

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
    setLoading(true);
    try {
      const collectionRef = collection(db, 'sales_report_detail');
      const snapshot = await getDocs(collectionRef);
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        assignedToBA: doc.data().assignedToBA,
        assignedToTL: doc.data().assignedToTL,
        outletId: doc.data().outletId || '',
        outletName: doc.data().outletName || '',
        ...doc.data()
      }));
      // Filter for BA role: only show records assigned to current user
      if (userRole === 'Iris - BA' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
      if (userRole === 'Iris - TL' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }

      // Fetch all outlets and build a map
      const outletsSnapshot = await getDocs(collection(db, 'outlets'));
      const outletMap: Record<string, any> = {};
      outletsSnapshot.forEach(doc => {
        outletMap[doc.id] = doc.data();
      });

      // Merge outlet name into each report
      list = list.map(report => {
        const outlet = outletMap[report.outletId] || {};
        return {
          ...report,
          outletName: outlet.outletName || report.outletName || '-',
        };
      });

      setReports(list);
    } catch (error) {
      console.error("Error fetching reports: ", error);
      Alert.alert("Error", "Failed to fetch sales reports.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: 'add' | 'edit' | 'review', item?: any) => {
    setModalType(type);
    if (type === 'edit' && item) {
      setSelectedReport(item);
      let newFormData: any = {
        ...initialFormData,
        ...item,
        date: item.date?.toDate().toISOString().split('T')[0] || '',
      };
      // Fetch sales_report_quick for this outletId
      if (item.outletId) {
        const quickRef = collection(db, 'sales_report_quick');
        getDocs(query(quickRef, where('outletId', '==', item.outletId))).then(snapshot => {
          if (!snapshot.empty) {
            const quickData = snapshot.docs[0].data() as any;
            newFormData = {
              ...newFormData,
              salesKegs330: quickData.salesKegs330 || '',
              salesKegs500: quickData.salesKegs500 || '',
              salesMd500: quickData.salesMd500 || '',
              salesGdic400: quickData.salesGdic400 || '',
              salesSmoothPint330: quickData.salesSmoothPint330 || '',
              salesSmoothCan330: quickData.salesSmoothCan330 || '',
              salesGfesPint330: quickData.salesGfesPint330 || '',
              salesGfesCan330: quickData.salesGfesCan330 || '',
              salesGfesQuart620: quickData.salesGfesQuart620 || '',
              salesGfesCanbig500: quickData.salesGfesCanbig500 || '',
            };
            setFormData(newFormData);
          } else {
            setFormData(newFormData);
          }
        });
        // Fetch early_task_assessment for this outletId
        const assessmentRef = collection(db, 'task_early_assessment');
        getDocs(query(assessmentRef, where('outletId', '==', item.outletId))).then(snapshot => {
          if (!snapshot.empty) {
            const assessmentData = snapshot.docs[0].data() as any;
            setAssessmentMerchandiseAvailable(
              typeof assessmentData.merchandiseAvailable === 'boolean' ? assessmentData.merchandiseAvailable : null
            );
          } else {
            setAssessmentMerchandiseAvailable(null);
          }
        });
      } else {
        setFormData(newFormData);
        setAssessmentMerchandiseAvailable(null);
      }
    } else {
      setSelectedReport(null);
      setFormData(initialFormData);
      setAssessmentMerchandiseAvailable(null);
    }
    setIsModalVisible(true);
  };

  const handleFormSubmit = () => {
    // Calculate competitorOnlyDrinkers before submit
    const beerDrinkers = parseInt(formData.visitorsAllBeerDrinkers);
    const guinnessDrinkers = parseInt(formData.visitorsAllGuinness);
    let competitorOnlyDrinkers = '';
    if (formData.visitorsAllBeerDrinkers !== '' && formData.visitorsAllGuinness !== '') {
      if (!isNaN(beerDrinkers) && !isNaN(guinnessDrinkers)) {
        const diff = beerDrinkers - guinnessDrinkers;
        competitorOnlyDrinkers = diff >= 0 ? diff.toString() : '';
      }
    }

    // Prepare quick report data
    const quickFields = [
      'salesKegs330','salesKegs500','salesMd500','salesGdic400','salesSmoothPint330','salesSmoothCan330',
      'salesGfesPint330','salesGfesCan330','salesGfesQuart620','salesGfesCanbig500'
    ];
    const quickData: any = {};
    quickFields.forEach(f => { quickData[f] = (formData as any)[f]; });

    // If Iris BA or TL role and update, show confirmation and set status
    if ((userRole === 'Iris - BA' || userRole === 'Iris - TL') && modalType === 'edit') {
      let statusLabel = userRole === 'Iris - BA' ? 'Done By BA' : 'Done by TL';
      Alert.alert('Are you sure?', `Do you want to submit as ${statusLabel}?`, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => {
            const dataToSubmit: any = {
              ...formData,
              salesReportDetailStatus: statusLabel,
              drinkerCompetitorOnly: competitorOnlyDrinkers,
              date: formData.date ? new Date(formData.date) : null,
              entryTimestamp: serverTimestamp(),
            };
            updateDoc(doc(db, "sales_report_detail", selectedReport.id), dataToSubmit)
              .then(async () => {
                if (formData.outletId) {
                  const quickRef = collection(db, 'sales_report_quick');
                  const snapshot = await getDocs(query(quickRef, where('outletId', '==', formData.outletId)));
                  if (!snapshot.empty) {
                    await updateDoc(doc(db, 'sales_report_quick', snapshot.docs[0].id), quickData);
                  } else {
                    await addDoc(collection(db, 'sales_report_quick'), {
                      outletId: formData.outletId,
                      ...quickData
                    });
                  }
                }
                fetchReports();
                setIsModalVisible(false);
              }).catch(error => Alert.alert("Update Failed", error.message));
          }
        }
      ]);
      return;
    }

    const dataToSubmit: any = {
      ...formData,
      drinkerCompetitorOnly: competitorOnlyDrinkers,
      date: formData.date ? new Date(formData.date) : null,
      entryTimestamp: serverTimestamp(),
    };

    if (modalType === 'add') {
      addDoc(collection(db, "sales_report_detail"), dataToSubmit)
        .then(() => {
          if (formData.outletId) {
            addDoc(collection(db, "sales_report_quick"), {
              outletId: formData.outletId,
              ...quickData
            });
          }
          fetchReports();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Add Failed", error.message));
    } else if (selectedReport) {
      updateDoc(doc(db, "sales_report_detail", selectedReport.id), dataToSubmit)
        .then(async () => {
          if (formData.outletId) {
            const quickRef = collection(db, 'sales_report_quick');
            const snapshot = await getDocs(query(quickRef, where('outletId', '==', formData.outletId)));
            if (!snapshot.empty) {
              await updateDoc(doc(db, 'sales_report_quick', snapshot.docs[0].id), quickData);
            } else {
              await addDoc(collection(db, 'sales_report_quick'), {
                outletId: formData.outletId,
                ...quickData
              });
            }
          }
          fetchReports();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Update Failed", error.message));
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
            <Text style={styles.title}>Review for Area Manager</Text>
            {selectedReport ? (
              <>
                <Text>Assigned to BA: {selectedReport.assignedToBA || '-'}</Text>
                <Text>Assigned to TL: {selectedReport.assignedToTL || '-'}</Text>
                <Text>Outlet Name: {selectedReport.outletName || '-'}</Text>
                <Text>Province: {selectedReport.outletProvince || '-'}</Text>
                <Text>City: {selectedReport.outletCity || '-'}</Text>
                <Text>Activity Name: {selectedReport.activityName || '-'}</Text>
                <Text>Total Guinness Sales: {selectedReport.totalGuinnessSales || '-'}</Text>
                <Text>Issues/Notes/Requests: {selectedReport.issuesNotesRequests || '-'}</Text>
                <Text>Learning Points: {selectedReport.learningPoints || '-'}</Text>
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
          <View style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 100 }}>
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
                  const item = descriptionItem || (reports.length > 0 ? reports[0] : null);
                  if (item) {
                    setDescriptionItem(item);
                    setIsDescriptionModalVisible(true);
                  }
                }}
                accessibilityLabel="Detail"
              >
                <Ionicons name="information-circle-outline" size={32} color="#007AFF" />
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </View>
  );

  const renderModal = () => (
    <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsModalVisible(false)}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{modalType === 'add' ? 'Add' : 'Edit'} Report</Text>
          <Text style={styles.sectionTitle}>Personnel Information</Text>
          <Text>Assigned to BA: {formData.assignedToBA || '-'}</Text>
          <Text>Assigned to TL: {formData.assignedToTL || '-'}</Text>
          <Text style={styles.inputLabel}>no of BA / SPG Guinness in charge (for selling program)</Text>
          <TextInput style={styles.input} value={formData.baCount} onChangeText={text => setFormData({...formData, baCount: text})} placeholder="# of BA" keyboardType="numeric" />
          <Text style={styles.inputLabel}>no of crew or canvasser in charge (for event or canvasser program)</Text>
          <TextInput style={styles.input} value={formData.crewCanvasserCount} onChangeText={text => setFormData({...formData, crewCanvasserCount: text})} placeholder="# of Crew/Canvasser" keyboardType="numeric" />
          
          <Text style={styles.sectionTitle}>Outlet Information</Text>
          <Text>Outlet ID: {formData.outletId || '-'}</Text>
          <Text>Outlet Name: {formData.outletName || '-'}</Text>
          <Text>Province: {formData.outletProvince || '-'}</Text>
          <Text>City: {formData.outletCity || '-'}</Text>
          <Text>Activity Name: {formData.activityName || '-'}</Text>
          <Text>Channel: {formData.channel || '-'}</Text>
          <Text>Tier: {formData.tier || '-'}</Text>

          <Text style={styles.inputLabel}>Capacity</Text>
          <TextInput style={styles.input} value={formData.capacity} onChangeText={text => setFormData({...formData, capacity: text})} placeholder="Capacity" keyboardType="numeric" />
          
          <Text style={styles.sectionTitle}>Sampling Data</Text>
          <Text style={styles.inputLabel}>Smooth Bottle Sampling</Text>
          <TextInput style={styles.input} value={formData.samplingSmoothBottle} onChangeText={text => setFormData({...formData, samplingSmoothBottle: text})} placeholder="Smooth Bottle Sampling" />
          <Text style={styles.inputLabel}>Smooth On-Lips Sampling</Text>
          <TextInput style={styles.input} value={formData.samplingSmoothOnLips} onChangeText={text => setFormData({...formData, samplingSmoothOnLips: text})} placeholder="Smooth On-Lips Sampling" />
          <Text style={styles.inputLabel}>GFES Bottle Sampling</Text>
          <TextInput style={styles.input} value={formData.samplingGfesBottle} onChangeText={text => setFormData({...formData, samplingGfesBottle: text})} placeholder="GFES Bottle Sampling" />
          <Text style={styles.inputLabel}>GFES On-Lips Sampling</Text>
          <TextInput style={styles.input} value={formData.samplingGfesOnLips} onChangeText={text => setFormData({...formData, samplingGfesOnLips: text})} placeholder="GFES On-Lips Sampling" />
          <Text style={styles.inputLabel}>Target Achievement</Text>
          <TextInput style={styles.input} value={formData.samplingTargetAchievement} onChangeText={text => setFormData({...formData, samplingTargetAchievement: text})} placeholder="Target Achievement" />

          <Text style={styles.sectionTitle}>Guinness Selling Data</Text>
          <Text style={styles.inputLabel}>(Fields below refer to the Quick Sales Report Collection)</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
            <Text style={styles.inputLabel}>KEGS (330ml) glass</Text>
            <TextInput style={styles.input} value={formData.salesKegs330} onChangeText={text => setFormData({...formData, salesKegs330: text})} placeholder="KEGS (330ml) glass" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
            <Text style={styles.inputLabel}>KEGS (500ml) glass</Text>
            <TextInput style={styles.input} value={formData.salesKegs500} onChangeText={text => setFormData({...formData, salesKegs500: text})} placeholder="KEGS (500ml) glass" keyboardType="numeric" />
            </View>
          </View>
          <Text style={styles.inputLabel}>MD (500ml) can</Text>
          <TextInput style={styles.input} value={formData.salesMd500} onChangeText={text => setFormData({...formData, salesMd500: text})} placeholder="MD (500ml) can" keyboardType="numeric" />
          <Text style={styles.inputLabel}>GDIC (400ml) can</Text>
          <TextInput style={styles.input} value={formData.salesGdic400} onChangeText={text => setFormData({...formData, salesGdic400: text})} placeholder="GDIC (400ml) can" keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>SMOOTH PINT 330ml</Text>
              <TextInput style={styles.input} value={formData.salesSmoothPint330} onChangeText={text => setFormData({...formData, salesSmoothPint330: text})} placeholder="SMOOTH PINT 330ml" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>SMOOTH CAN 330ml</Text>
              <TextInput style={styles.input} value={formData.salesSmoothCan330} onChangeText={text => setFormData({...formData, salesSmoothCan330: text})} placeholder="SMOOTH CAN 330ml" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>GFES PINT 330ml</Text>
              <TextInput style={styles.input} value={formData.salesGfesPint330} onChangeText={text => setFormData({...formData, salesGfesPint330: text})} placeholder="GFES PINT 330ml" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>GFES QUART 620ml</Text>
              <TextInput style={styles.input} value={formData.salesGfesQuart620} onChangeText={text => setFormData({...formData, salesGfesQuart620: text})} placeholder="GFES QUART 620ml" keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>GFES CAN 330ml</Text>
                <TextInput style={styles.input} value={formData.salesGfesCan330} onChangeText={text => setFormData({...formData, salesGfesCan330: text})} placeholder="GFES CAN 330ml" keyboardType="numeric" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>GFES CANBIG 500ml</Text>
                <TextInput style={styles.input} value={formData.salesGfesCanbig500} onChangeText={text => setFormData({...formData, salesGfesCanbig500: text})} placeholder="GFES CANBIG 500ml" keyboardType="numeric" />
              </View>
            </View>
          <Text style={styles.inputLabel}>Total Guinness Sales</Text>
          <Text style={styles.inputLabel}>Total Guinness Sales</Text>
          <TextInput style={styles.input} value={formData.totalGuinnessSales} onChangeText={text => setFormData({...formData, totalGuinnessSales: text})} placeholder="Total Guinness Sales" />
          
          <Text style={styles.sectionTitle}>Call and Customer Data</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Call/Jumlah Warung/Jumlah Penawaran</Text>
              <TextInput style={styles.input} value={formData.callsOffers} onChangeText={text => setFormData({...formData, callsOffers: text})} placeholder="No of calls/offers" keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Effective Call/Jumlah Pembeli/Jumlah Warung Beli</Text>
              <TextInput style={styles.input} value={formData.effectiveCalls} onChangeText={text => setFormData({...formData, effectiveCalls: text})} placeholder="Effective calls/buyers/shops" keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.inputLabel}>% calls vs. effective calls</Text>
              <TextInput
                style={styles.input}
                value={(() => {
                  const calls = parseFloat(formData.callsOffers);
                  const effective = parseFloat(formData.effectiveCalls);
                  // If either field is empty, show blank
                  if (formData.callsOffers === '' || formData.effectiveCalls === '') return '';
                  // If callsOffers is zero, show blank (avoid division by zero)
                  if (!isNaN(calls) && calls === 0) return '';
                  // If effectiveCalls is zero, show 0%
                  if (!isNaN(calls) && calls > 0 && !isNaN(effective) && effective === 0) return '0%';
                  // If both are valid and calls > 0, calculate
                  if (!isNaN(calls) && calls > 0 && !isNaN(effective) && effective >= 0) {
                    const percent = (effective / calls) * 100;
                    if (!isFinite(percent) || percent < 0) return '';
                    return percent.toFixed(2) + '%';
                  }
                  return '';
                })()}
                editable={false}
                placeholder="% calls vs. effective calls"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Promotional Activities</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness SMOOTH Promotion Available</Text>
            <Switch value={formData.guinnessSmoothPromotionAvailable} onValueChange={value => setFormData({...formData, guinnessSmoothPromotionAvailable: value})} />
          </View>
          {formData.guinnessSmoothPromotionAvailable && (
            <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo Smooth Description</Text>
                <TextInput style={styles.input} value={formData.promoSmoothDescription} onChangeText={text => setFormData({...formData, promoSmoothDescription: text})} placeholder="Guinness SMOOTH Promotion" />
              </View>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo Smooth Sold</Text>
                <TextInput style={styles.input} value={formData.promoSmoothSold} onChangeText={text => setFormData({...formData, promoSmoothSold: text})} placeholder="Promo Smooth Sold" keyboardType="numeric"/>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Promo Smooth Repeat Order</Text>
                <TextInput style={styles.input} value={formData.promoSmoothRepeatOrder} onChangeText={text => setFormData({...formData, promoSmoothRepeatOrder: text})} placeholder="Promo Smooth Repeat Order" keyboardType="numeric"/>
              </View>
            </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness GFES Promotion Available</Text>
            <Switch value={formData.guinnessGfesPromotionAvailable} onValueChange={val => setFormData({...formData, guinnessGfesPromotionAvailable: val})} />
          </View>
          {formData.guinnessGfesPromotionAvailable && (
            <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo GFES Description</Text>
                <TextInput style={styles.input} value={formData.promoGfesDescription} onChangeText={text => setFormData({...formData, promoGfesDescription: text})} placeholder="Guinness GFES Promotion" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Promo GFES Sold</Text>
                <TextInput style={styles.input} value={formData.promoGfesSold} onChangeText={text => setFormData({...formData, promoGfesSold: text})} placeholder="Promo GFES Sold" keyboardType="numeric"/>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Promo GFES Repeat Order</Text>
                <TextInput style={styles.input} value={formData.promoGfesRepeatOrder} onChangeText={text => setFormData({...formData, promoGfesRepeatOrder: text})} placeholder="Promo GFES Repeat Order" keyboardType="numeric"/>
              </View>
            </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness KEGS Promotion Available</Text>
            <Switch value={formData.guinnessKegsPromotionAvailable} onValueChange={val => setFormData({...formData, guinnessKegsPromotionAvailable: val})} />
          </View>
          {formData.guinnessKegsPromotionAvailable && (
            <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo KEGS Description</Text>
                <TextInput style={styles.input} value={formData.promoKegsDescription} onChangeText={text => setFormData({...formData, promoKegsDescription: text})} placeholder="Guinness KEGS Promotion" />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Promo KEGS Sold</Text>
                <TextInput style={styles.input} value={formData.promoKegsSold} onChangeText={text => setFormData({...formData, promoKegsSold: text})} placeholder="Promo KEGS Sold" keyboardType="numeric"/>
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.inputLabel}>Promo KEGS Repeat Order</Text>
                <TextInput style={styles.input} value={formData.promoKegsRepeatOrder} onChangeText={text => setFormData({...formData, promoKegsRepeatOrder: text})} placeholder="Promo KEGS Repeat Order" keyboardType="numeric"/>
              </View>
            </View>
          )}
          <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Guinness MICRODRAUGHT Promotion Available</Text>
              <Switch value={formData.guinnessMicroDraughtPromotionAvailable} onValueChange={val => setFormData({...formData, guinnessMicroDraughtPromotionAvailable: val})} />
            </View>
          {formData.guinnessMicroDraughtPromotionAvailable && (
            <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo MICRODRAUGHT Description</Text>
                <TextInput style={styles.input} value={formData.promoMicrodraughtDescription} onChangeText={text => setFormData({...formData, promoMicrodraughtDescription: text})} placeholder="Guinness MICRODRAUGHT Promotion" />
              </View>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo MicroDraught Sold</Text>
                <TextInput style={styles.input} value={formData.promoMicrodraughtSold} onChangeText={text => setFormData({...formData, promoMicrodraughtSold: text})} placeholder="Promo MicroDraught Sold" keyboardType="numeric"/>
              </View>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo MicroDraught Repeat Order</Text>
                <TextInput style={styles.input} value={formData.promoMicrodraughtRepeatOrder} onChangeText={text => setFormData({...formData, promoMicrodraughtRepeatOrder: text})} placeholder="Promo MicroDraught Repeat Order" keyboardType="numeric"/>
              </View>
            </View>
          )}
        

          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness GDIC promotion Available</Text>
            <Switch value={formData.guinnessGdicPromotionAvailable} onValueChange={val => setFormData({...formData, guinnessGdicPromotionAvailable: val})} />
          </View>
          {formData.guinnessGdicPromotionAvailable && (
            <View style={styles.rowInputs}>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo GDIC Description</Text>
                <TextInput style={styles.input} value={formData.promoGdicDescription} onChangeText={text => setFormData({...formData, promoGdicDescription: text})} placeholder="Guinness GDIC Promotion" />
              </View>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo GDIC Sold</Text>
                <TextInput style={styles.input} value={formData.promoGdicSold} onChangeText={text => setFormData({...formData, promoGdicSold: text})} placeholder="Promo GDIC Sold" keyboardType="numeric"/>
              </View>
              <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Promo GDIC Repeat Order</Text>
                <TextInput style={styles.input} value={formData.promoGdicRepeatOrder} onChangeText={text => setFormData({...formData, promoGdicRepeatOrder: text})} placeholder="Promo GDIC Repeat Order" keyboardType="numeric"/>
              </View>
            </View>
          )}
          
          <Text style={styles.sectionTitle}>Visitor and Consumer Data</Text>
          <Text style={styles.inputLabel}>Overall Visitors</Text>
          <TextInput style={styles.input} value={formData.visitorsOverall} onChangeText={text => setFormData({...formData, visitorsOverall: text})} placeholder="Overall Visitors" keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Alcohol Drinkers</Text>
              <TextInput
                style={styles.input}
                value={formData.visitorsAlcoholDrinkers}
                onChangeText={text => setFormData({...formData, visitorsAlcoholDrinkers: text})}
                placeholder="Alcohol Drinkers"
                keyboardType="numeric"
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.inputLabel}>Non-Alcohol Drinkers</Text>
              <TextInput
                style={styles.input}
                value={(() => {
                  const overall = parseInt(formData.visitorsOverall);
                  const alcohol = parseInt(formData.visitorsAlcoholDrinkers);
                  if (formData.visitorsOverall === '' || formData.visitorsAlcoholDrinkers === '') return '';
                  if (!isNaN(overall) && !isNaN(alcohol)) {
                    const nonAlcohol = overall - alcohol;
                    return nonAlcohol >= 0 ? nonAlcohol.toString() : '';
                  }
                  return '';
                })()}
                editable={false}
                placeholder="Non-Alcohol Drinkers"
                keyboardType="numeric"
              />
            </View>
          </View>
          <Text style={styles.inputLabel}>All Beer Drinkers</Text>
          <TextInput style={styles.input} value={formData.visitorsAllBeerDrinkers} onChangeText={text => setFormData({...formData, visitorsAllBeerDrinkers: text})} placeholder="All Beer Drinkers" keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>All Guinness Drinkers</Text>
              <TextInput
                style={styles.input}
                value={formData.visitorsAllGuinness}
                onChangeText={text => setFormData({...formData, visitorsAllGuinness: text})}
                placeholder="All Guinness Drinkers"
                keyboardType="numeric"
              />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>All Guinness Mixed Competitor Drinkers</Text>
              <TextInput
                style={styles.input}
                value={formData.visitorsAllGuinnessMixedCompetitor}
                onChangeText={text => setFormData({...formData, visitorsAllGuinnessMixedCompetitor: text})}
                placeholder="All Guinness Mixed Competitor Drinkers"
                keyboardType="numeric"
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.inputLabel}>Competitor Only Drinkers</Text>
              {(() => {
                const beerDrinkers = parseInt(formData.visitorsAllBeerDrinkers);
                const guinnessDrinkers = parseInt(formData.visitorsAllGuinness);
                const mixed = parseInt(formData.visitorsAllGuinnessMixedCompetitor);
                let competitorOnly = '';
                if (
                  formData.visitorsAllBeerDrinkers !== '' &&
                  formData.visitorsAllGuinness !== '' &&
                  formData.visitorsAllGuinnessMixedCompetitor !== ''
                ) {
                  if (!isNaN(beerDrinkers) && !isNaN(guinnessDrinkers) && !isNaN(mixed)) {
                    const diff = beerDrinkers - guinnessDrinkers - mixed;
                    competitorOnly = diff >= 0 ? diff.toString() : '';
                  }
                }
                return (
                  <TextInput
                    style={styles.input}
                    value={competitorOnly}
                    editable={false}
                    placeholder="Competitor Only Drinkers"
                    keyboardType="numeric"
                  />
                );
              })()}
            </View>
          </View>
          <Text style={styles.inputLabel}>Guinness Smooth Drinkers</Text>
          <TextInput style={styles.input} value={formData.drinkersSmooth} onChangeText={text => setFormData({...formData, drinkersSmooth: text})} placeholder="Guinness Smooth Drinkers" keyboardType="numeric" />
          <Text style={styles.inputLabel}>Guinness GFES Drinkers</Text>
          <TextInput style={styles.input} value={formData.drinkersGfes} onChangeText={text => setFormData({...formData, drinkersGfes: text})} placeholder="Guinness GFES Drinkers" keyboardType="numeric" />
          <Text style={styles.inputLabel}>Guinness KEGS Drinkers</Text>
          <TextInput style={styles.input} value={formData.drinkersKegs} onChangeText={text => setFormData({...formData, drinkersKegs: text})} placeholder="Guinness KEGS Drinkers" keyboardType="numeric" />
          <Text style={styles.inputLabel}>Guinness Microdraught Drinkers</Text>
          <TextInput style={styles.input} value={formData.drinkersMicrodraught} onChangeText={text => setFormData({...formData, drinkersMicrodraught: text})} placeholder="Guinness Microdraught Drinkers" keyboardType="numeric" />
          <Text style={styles.inputLabel}>Guinness GDIC Drinkers</Text>
          <TextInput style={styles.input} value={formData.drinkersGdic} onChangeText={text => setFormData({...formData, drinkersGdic: text})} placeholder="Guinness GDIC Drinkers" keyboardType="numeric" />
          <Text style={styles.inputLabel}>Guinness Mixed Category Drinkers</Text>
          <TextInput style={styles.input} value={formData.drinkersMixed} onChangeText={text => setFormData({...formData, drinkersMixed: text})} placeholder="Guinness Mixed Category Drinkers" keyboardType="numeric" />
          
          <Text style={styles.inputLabel}>Overall Tables In+1Out-0</Text>
          <TextInput style={styles.input} value={formData.tablesOverall} onChangeText={text => setFormData({...formData, tablesOverall: text})} placeholder="Overall Tables In+1Out-0" keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Tables of Alcohol Drinkers In+1Out-0</Text>
              <TextInput style={styles.input} value={formData.tablesAlcoholDrinkers} onChangeText={text => setFormData({...formData, tablesAlcoholDrinkers: text})} placeholder="Tables of Alcohol Drinkers In+1Out-0" keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.inputLabel}>Tables of Non-Alcohol Drinkers In+1Out-0</Text>
              <TextInput
                style={styles.input}
                value={(() => {
                  const overall = parseInt(formData.tablesOverall);
                  const alcohol = parseInt(formData.tablesAlcoholDrinkers);
                  if (formData.tablesOverall === '' || formData.tablesAlcoholDrinkers === '') return '';
                  if (!isNaN(overall) && !isNaN(alcohol)) {
                    const nonAlcohol = overall - alcohol;
                    return nonAlcohol >= 0 ? nonAlcohol.toString() : '';
                  }
                  return '';
                })()}
                editable={false}
                placeholder="Tables of Non-Alcohol Drinkers In+1Out-0"
                keyboardType="numeric"
              />
            </View>
          </View>
          <Text style={styles.inputLabel}>Tables of All Beer Drinkers In+1Out-0</Text>
          <TextInput style={styles.input} value={formData.tablesAllBeerDrinkers} onChangeText={text => setFormData({...formData, tablesAllBeerDrinkers: text})} placeholder="Tables of All Beer Drinkers In+1Out-0" keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Tables of All Guinness Drinkers</Text>
              <TextInput
                style={styles.input}
                value={formData.tablesAllGuinness}
                onChangeText={text => setFormData({...formData, tablesAllGuinness: text})}
                placeholder="Tables of All Guinness Drinkers In+1Out-0"
                keyboardType="numeric"
              />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Tables of All Guinness Mixed Competitor Drinkers</Text>
              <TextInput
                style={styles.input}
                value={formData.tablesAllGuinnessMixedCompetitor}
                onChangeText={text => setFormData({...formData, tablesAllGuinnessMixedCompetitor: text})}
                placeholder="Tables of All Guinness mixed Competitor Drinkers In+1Out-0"
                keyboardType="numeric"
              />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.inputLabel}>Tables of All Competitor Only Drinkers</Text>
              <TextInput
                style={styles.input}
                value={(() => {
                  const beer = parseInt(formData.tablesAllBeerDrinkers);
                  const guinness = parseInt(formData.tablesAllGuinness);
                  const mixed = parseInt(formData.tablesAllGuinnessMixedCompetitor);
                  if (
                    formData.tablesAllBeerDrinkers === '' ||
                    formData.tablesAllGuinness === '' ||
                    formData.tablesAllGuinnessMixedCompetitor === ''
                  ) return '';
                  if (!isNaN(beer) && !isNaN(guinness) && !isNaN(mixed)) {
                    const competitor = beer - guinness - mixed;
                    return competitor >= 0 ? competitor.toString() : '';
                  }
                  return '';
                })()}
                editable={false}
                placeholder="Tables of All Competitor only Drinkers In+1Out-0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Competitor Sales and Promotion</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor bintang Available</Text>
            <Switch value={formData.competitorBintangAvailable} onValueChange={value => setFormData({...formData, competitorBintangAvailable: value})} />
          </View>
          {formData.competitorBintangAvailable && (
            <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
              <Text style={styles.inputLabel}>Competitor bintang</Text>
              {/* 5 sales fields in one row */}
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangGlass} onChangeText={text => setFormData({...formData, competitorBintangGlass: text})} placeholder="Glass" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangPint} onChangeText={text => setFormData({...formData, competitorBintangPint: text})} placeholder="Pint" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangQuart} onChangeText={text => setFormData({...formData, competitorBintangQuart: text})} placeholder="Quart" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCanSmall} onChangeText={text => setFormData({...formData, competitorBintangCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCanBig} onChangeText={text => setFormData({...formData, competitorBintangCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
                </View>
              </View>
              {/* 2 promo fields in a separate row */}
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                <View style={{ flex: 2 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangPromoDescription} onChangeText={text => setFormData({...formData, competitorBintangPromoDescription: text})} placeholder="Promo Description" />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangPromoSold} onChangeText={text => setFormData({...formData, competitorBintangPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
                </View>
              </View>
            </View>
          )}
                    
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor bintang crystal Available</Text>
            <Switch value={formData.competitorBintangCrystalAvailable} onValueChange={value => setFormData({...formData, competitorBintangCrystalAvailable: value})} />
          </View>
          {formData.competitorBintangCrystalAvailable && (
            <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
              <Text style={styles.inputLabel}>Competitor bintang crystal</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalGlass} onChangeText={text => setFormData({...formData, competitorBintangCrystalGlass: text})} placeholder="Glass" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalPint} onChangeText={text => setFormData({...formData, competitorBintangCrystalPint: text})} placeholder="Pint" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalQuart} onChangeText={text => setFormData({...formData, competitorBintangCrystalQuart: text})} placeholder="Quart" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalCanSmall} onChangeText={text => setFormData({...formData, competitorBintangCrystalCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalCanBig} onChangeText={text => setFormData({...formData, competitorBintangCrystalCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                <View style={{ flex: 2 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalPromoDescription} onChangeText={text => setFormData({...formData, competitorBintangCrystalPromoDescription: text})} placeholder="Promo Description"/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorBintangCrystalPromoSold} onChangeText={text => setFormData({...formData, competitorBintangCrystalPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
                </View>
              </View>
            </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor heineken Available</Text>
            <Switch value={formData.competitorHeinekenAvailable} onValueChange={value => setFormData({...formData, competitorHeinekenAvailable: value})} />
          </View>
          {formData.competitorHeinekenAvailable && (
            <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor Heineken</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenGlass} onChangeText={text => setFormData({...formData, competitorHeinekenGlass: text})} placeholder="Glass" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenPint} onChangeText={text => setFormData({...formData, competitorHeinekenPint: text})} placeholder="Pint" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenQuart} onChangeText={text => setFormData({...formData, competitorHeinekenQuart: text})} placeholder="Quart" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenCanSmall} onChangeText={text => setFormData({...formData, competitorHeinekenCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenCanBig} onChangeText={text => setFormData({...formData, competitorHeinekenCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
                </View>
              </View>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                  <View style={{ flex: 2 }}>
                    <TextInput style={styles.input} value={formData.competitorHeinekenPromoDescription} onChangeText={text => setFormData({...formData, competitorHeinekenPromoDescription: text})} placeholder="Promo Description"/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput style={styles.input} value={formData.competitorHeinekenPromoSold} onChangeText={text => setFormData({...formData, competitorHeinekenPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
                  </View>
                </View>
            </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor heineken import Available</Text>
            <Switch value={formData.competitorHeinekenImportAvailable} onValueChange={value => setFormData({...formData, competitorHeinekenImportAvailable: value})} />
          </View>
          {formData.competitorHeinekenImportAvailable && (
            <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
              <Text style={styles.inputLabel}>Competitor Heineken Import</Text>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenImportGlass} onChangeText={text => setFormData({...formData, competitorHeinekenImportGlass: text})} placeholder="Glass" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenImportPint} onChangeText={text => setFormData({...formData, competitorHeinekenImportPint: text})} placeholder="Pint" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenImportQuart} onChangeText={text => setFormData({...formData, competitorHeinekenImportQuart: text})} placeholder="Quart" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenImportCanSmall} onChangeText={text => setFormData({...formData, competitorHeinekenImportCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={formData.competitorHeinekenImportCanBig} onChangeText={text => setFormData({...formData, competitorHeinekenImportCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                  <View style={{ flex: 2 }}>
                    <TextInput style={styles.input} value={formData.competitorHeinekenImportPromoDescription} onChangeText={text => setFormData({...formData, competitorHeinekenImportPromoDescription: text})} placeholder="Promo Description"/>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput style={styles.input} value={formData.competitorHeinekenImportPromoSold} onChangeText={text => setFormData({...formData, competitorHeinekenImportPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
                  </View>
              </View>
            </View>
          )}
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
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor kura kura Available</Text>
            <Switch value={formData.competitorKuraKuraAvailable} onValueChange={value => setFormData({...formData, competitorKuraKuraAvailable: value})} />
          </View>

          {formData.competitorKuraKuraAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor kura kura</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraGlass} onChangeText={text => setFormData({...formData, competitorKuraKuraGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraPint} onChangeText={text => setFormData({...formData, competitorKuraKuraPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraQuart} onChangeText={text => setFormData({...formData, competitorKuraKuraQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraCanSmall} onChangeText={text => setFormData({...formData, competitorKuraKuraCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraCanBig} onChangeText={text => setFormData({...formData, competitorKuraKuraCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraPromoDescription} onChangeText={text => setFormData({...formData, competitorKuraKuraPromoDescription: text})} placeholder="Promo Description"/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorKuraKuraPromoSold} onChangeText={text => setFormData({...formData, competitorKuraKuraPromoSold: text})} placeholder="Promo Sold" keyboardType='numeric'/>
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor island brewing Available</Text>
            <Switch value={formData.competitorIslandBrewingAvailable} onValueChange={value => setFormData({...formData, competitorIslandBrewingAvailable: value})} />
          </View>

          {formData.competitorIslandBrewingAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor island brewing</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingGlass} onChangeText={text => setFormData({...formData, competitorIslandBrewingGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingPint} onChangeText={text => setFormData({...formData, competitorIslandBrewingPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingQuart} onChangeText={text => setFormData({...formData, competitorIslandBrewingQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingCanSmall} onChangeText={text => setFormData({...formData, competitorIslandBrewingCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingCanBig} onChangeText={text => setFormData({...formData, competitorIslandBrewingCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingPromoDescription} onChangeText={text => setFormData({...formData, competitorIslandBrewingPromoDescription: text})} placeholder="Promo Description" />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorIslandBrewingPromoSold} onChangeText={text => setFormData({...formData, competitorIslandBrewingPromoSold: text})} placeholder="Promo Sold" keyboardType="numeric" />
            </View>
          </View>
          </View>
          )}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Competitor Others Available</Text>
            <Switch value={formData.competitorOthersAvailable} onValueChange={value => setFormData({...formData, competitorOthersAvailable: value})} />
          </View>

          {formData.competitorOthersAvailable && (
          <View style={{ flexDirection: 'column', width: '100%', marginTop: 8 }}>
          <Text style={styles.inputLabel}>Competitor Others</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersGlass} onChangeText={text => setFormData({...formData, competitorOthersGlass: text})} placeholder="Glass" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersPint} onChangeText={text => setFormData({...formData, competitorOthersPint: text})} placeholder="Pint" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersQuart} onChangeText={text => setFormData({...formData, competitorOthersQuart: text})} placeholder="Quart" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersCanSmall} onChangeText={text => setFormData({...formData, competitorOthersCanSmall: text})} placeholder="Can Small" keyboardType='numeric'/>
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersCanBig} onChangeText={text => setFormData({...formData, competitorOthersCanBig: text})} placeholder="Can Big" keyboardType='numeric'/>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersGlass} onChangeText={text => setFormData({...formData, competitorOthersGlass: text})} placeholder="Glass" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersPint} onChangeText={text => setFormData({...formData, competitorOthersPint: text})} placeholder="Pint" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersQuart} onChangeText={text => setFormData({...formData, competitorOthersQuart: text})} placeholder="Quart" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersCanSmall} onChangeText={text => setFormData({...formData, competitorOthersCanSmall: text})} placeholder="Can Small" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersCanBig} onChangeText={text => setFormData({...formData, competitorOthersCanBig: text})} placeholder="Can Big" keyboardType="numeric" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
            <View style={{ flex: 2 }}>
              <TextInput style={styles.input} value={formData.competitorOthersPromoDescription} onChangeText={text => setFormData({...formData, competitorOthersPromoDescription: text})} placeholder="Promo Description" />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput style={styles.input} value={formData.competitorOthersPromoSold} onChangeText={text => setFormData({...formData, competitorOthersPromoSold: text})} placeholder="Promo Sold" keyboardType="numeric" />
            </View>
          </View>
          </View>
          )}
          <Text style={styles.inputLabel}>Beer Market Size</Text>
          <TextInput style={styles.input} value={formData.beerMarketSize} onChangeText={text => setFormData({...formData, beerMarketSize: text})} placeholder="Beer Market Size" />
          
          <Text style={styles.sectionTitle}>Merchandise and Programs</Text>
          {/* Merchandise Available now uses early_task_assessment's merchandiseAvailable */}
          <View style={styles.switchContainer}>
            <Text>Merchandise Available</Text>
            <Switch
              value={assessmentMerchandiseAvailable !== null ? assessmentMerchandiseAvailable : formData.merchandiseAvailable}
              onValueChange={val => {
                if (assessmentMerchandiseAvailable !== null) {
                  // Optionally, update assessmentMerchandiseAvailable in Firestore here if needed
                  setAssessmentMerchandiseAvailable(val);
                } else {
                  setFormData({...formData, merchandiseAvailable: val});
                }
              }}
            />
          </View>
          {/* Show merchandise description/sold rows only if Merchandise Available is ON */}
          {(assessmentMerchandiseAvailable !== null ? assessmentMerchandiseAvailable : formData.merchandiseAvailable) && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Merchandise Type 1</Text>
                  <TextInput style={styles.input} value={formData.merchandiseDescription1} onChangeText={text => setFormData({...formData, merchandiseDescription1: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Merchandise Out Sold 1</Text>
                  <TextInput style={styles.input} value={formData.merchandiseSold1} onChangeText={text => setFormData({...formData, merchandiseSold1: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                <Text style={styles.inputLabel}>Merchandise Type 2</Text>
                  <TextInput style={styles.input} value={formData.merchandiseDescription2} onChangeText={text => setFormData({...formData, merchandiseDescription2: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Merchandise Out Sold 2</Text>
                  <TextInput style={styles.input} value={formData.merchandiseSold2} onChangeText={text => setFormData({...formData, merchandiseSold2: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Merchandise Type 3</Text>
                  <TextInput style={styles.input} value={formData.merchandiseDescription3} onChangeText={text => setFormData({...formData, merchandiseDescription3: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Merchandise Out Sold 3</Text>
                  <TextInput style={styles.input} value={formData.merchandiseSold3} onChangeText={text => setFormData({...formData, merchandiseSold3: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Merchandise Type 4</Text>
                  <TextInput style={styles.input} value={formData.merchandiseDescription4} onChangeText={text => setFormData({...formData, merchandiseDescription4: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Merchandise Out Sold 4</Text>
                  <TextInput style={styles.input} value={formData.merchandiseSold4} onChangeText={text => setFormData({...formData, merchandiseSold4: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Merchandise Type 5</Text>
                  <TextInput style={styles.input} value={formData.merchandiseDescription5} onChangeText={text => setFormData({...formData, merchandiseDescription5: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Merchandise Out Sold 5</Text>
                  <TextInput style={styles.input} value={formData.merchandiseSold5} onChangeText={text => setFormData({...formData, merchandiseSold5: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
            </>
          )}
          
          
          
          <View style={styles.switchContainer}><Text>Stoutie Program Participation</Text><Switch value={formData.stoutieProgramParticipation} onValueChange={val => setFormData({...formData, stoutieProgramParticipation: val})} /></View>
          <Text style={styles.inputLabel}>Loyalty Program Details</Text>
          <TextInput style={styles.input} value={formData.loyaltyProgramDetails} onChangeText={text => setFormData({...formData, loyaltyProgramDetails: text})} placeholder="Loyalty Program Details" />

          <Text style={styles.sectionTitle}>Notes and Performance</Text>
          <Text style={styles.inputLabel}>Issues/Notes/Requests</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={formData.issuesNotesRequests}
              onChangeText={text => setFormData({ ...formData, issuesNotesRequests: text })}
              placeholder="Issues/Notes/Requests"
              multiline
              numberOfLines={4}
            />          
          <Text style={styles.inputLabel}>Learning Points</Text>
          <TextInput 
              style={[styles.input, { height: 80 }]} 
              value={formData.learningPoints} 
              onChangeText={text => setFormData({...formData, learningPoints: text})} 
              placeholder="Learning Points" 
              multiline
              numberOfLines={4}
          />
          
          <Text style={styles.inputLabel}>Achievement Percentage</Text>
          <TextInput style={styles.input} value={formData.achievementPercentage} onChangeText={text => setFormData({...formData, achievementPercentage: text})} placeholder="Achievement Percentage" />

          {/* Only show status picker for admin during edit/update modal */}
          {/* Refactored: status options as a constant array */}
          {userRole === 'admin' && modalType === 'edit' && (
            <>
              <Text style={styles.inputLabel}>Task Sales Report Detail Status</Text>
              <View style={[styles.input, { padding: 0 }]}> 
                <Picker
                  selectedValue={formData.salesReportDetailStatus}
                  onValueChange={value => setFormData({ ...formData, salesReportDetailStatus: value })}
                  style={{ height: 40 }}
                >
                  {[
                    { label: '', value: '' },
                    { label: 'Done By BA', value: 'Done By BA' },
                    { label: 'Review back to BA', value: 'Review back to BA' },
                    { label: 'Done by TL', value: 'Done by TL' },
                    { label: 'Review back to TL', value: 'Review back to TL' },
                    { label: 'Done by AM', value: 'Done by AM' },
                  ].map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Bali Specific Data</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Bali Specific Visitor Data</Text>
            <Switch
              value={formData.baliSpecificVisitorData}
              onValueChange={val => setFormData({...formData, baliSpecificVisitorData: val})}
            />
          </View>
          {formData.baliSpecificVisitorData && (
            <View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Bali Local Visitors</Text>
                  <TextInput style={styles.input} value={formData.baliLocalVisitors} onChangeText={text => setFormData({...formData, baliLocalVisitors: text})} placeholder="Bali Local Visitors" keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Bali Foreign Visitors</Text>
                  <TextInput style={styles.input} value={formData.baliForeignVisitors} onChangeText={text => setFormData({...formData, baliForeignVisitors: text})} placeholder="Bali Foreign Visitors" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Bali Local Guinness Buyers</Text>
                  <TextInput style={styles.input} value={formData.baliLocalGuinnessBuyers} onChangeText={text => setFormData({...formData, baliLocalGuinnessBuyers: text})} placeholder="Bali Local Guinness Buyers" keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Bali Foreign Guinness Buyers</Text>
                  <TextInput style={styles.input} value={formData.baliForeignGuinnessBuyers} onChangeText={text => setFormData({...formData, baliForeignGuinnessBuyers: text})} placeholder="Bali Foreign Guinness Buyers" keyboardType="numeric" />
                </View>
              </View>
            </View>
          )}

          
          <View style={styles.buttonContainer}>
            <Button title={modalType === 'add' ? 'Add' : 'Update'} onPress={handleFormSubmit} />
            <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );

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
              <Text>Outlet Name: {descriptionItem.outletName || '-'}</Text>
              <Text>Province: {descriptionItem.outletProvince || '-'}</Text>
              <Text>City: {descriptionItem.outletCity || '-'}</Text>
              <Text>Activity Name: {descriptionItem.activityName || '-'}</Text>
              <Text>Channel: {descriptionItem.channel || '-'}</Text>
              <Text>Tier: {descriptionItem.tier || '-'}</Text>
              <Text>Assigned to BA: {descriptionItem.assignedToBA || '-'}</Text>
              <Text>Assigned to TL: {descriptionItem.assignedToTL || '-'}</Text>
              <Text>Created At: {descriptionItem.createdAt?.toDate ? descriptionItem.createdAt.toDate().toLocaleString() : '-'}</Text>
              <Text>Created By: {descriptionItem.createdBy || '-'}</Text>
              <Text>Task ID: {descriptionItem.tasksId || '-'}</Text>
              <Text>Task Sales Report Detail Status: {descriptionItem.salesReportDetailStatus || '-'}</Text>
              <Text>Issues/Notes/Requests: {descriptionItem.issuesNotesRequests || '-'}</Text>
              <Text>Learning Points: {descriptionItem.learningPoints || '-'}</Text>
              {/* Add more fields as needed */}
            </>
          ) : (
            <Text>No data available.</Text>
          )}
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
      {renderModal()}
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
