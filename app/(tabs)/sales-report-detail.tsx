import { useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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
    [key: string]: any;
  };
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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
    competitorBrandA: '', competitorBrandB: '', competitorPackages: '',
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
  };

  const [formData, setFormData] = useState(initialFormData);
  // State for early_task_assessment merchandiseAvailable
  const [assessmentMerchandiseAvailable, setAssessmentMerchandiseAvailable] = useState<boolean | null>(null);

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

  const handleOpenModal = (type: 'add' | 'edit', item?: any) => {
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
    const dataToSubmit: any = {
      ...formData,
      drinkerCompetitorOnly: competitorOnlyDrinkers,
      date: formData.date ? new Date(formData.date) : null,
      entryTimestamp: serverTimestamp(),
    };

    // Prepare quick report data
    const quickFields = [
      'salesKegs330','salesKegs500','salesMd500','salesGdic400','salesSmoothPint330','salesSmoothCan330',
      'salesGfesPint330','salesGfesCan330','salesGfesQuart620','salesGfesCanbig500'
    ];
    const quickData: any = {};
    quickFields.forEach(f => { quickData[f] = (formData as any)[f]; });

    if (modalType === 'add') {
      addDoc(collection(db, "sales_report_detail"), dataToSubmit)
        .then(() => {
          // Also add quick report if outletId exists
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
          // Also update quick report if outletId exists
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

  const renderItem = ({ item }: { item: any }) => (
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
      {canUpdate && (
        <View style={styles.buttonContainer}>
          <Button title="Edit" onPress={() => handleOpenModal('edit', item)} />
          {canDelete && <Button title="Delete" onPress={() => handleDelete(item.id)} />}
        </View>
      )}
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
          <Text style={styles.inputLabel}>MD (500ml) can</Text>
          <TextInput style={styles.input} value={formData.salesMd500} onChangeText={text => setFormData({...formData, salesMd500: text})} placeholder="MD (500ml) can" keyboardType="numeric" />
          <Text style={styles.inputLabel}>GDIC (400ml) can</Text>
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
              <TextInput style={styles.input} value={formData.tablesAlcoholDrinkers} onChangeText={text => setFormData({...formData, tablesAlcoholDrinkers: text})} placeholder="Tables of Alcohol Drinkers In+1Out-0" keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
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

          <Text style={styles.sectionTitle}>Competitor Sales</Text>
          <Text style={styles.inputLabel}>Competitor Brand A Sales</Text>
          <TextInput style={styles.input} value={formData.competitorBrandA} onChangeText={text => setFormData({...formData, competitorBrandA: text})} placeholder="Competitor Brand A Sales" />
          <Text style={styles.inputLabel}>Competitor Brand B Sales</Text>
          <TextInput style={styles.input} value={formData.competitorBrandB} onChangeText={text => setFormData({...formData, competitorBrandB: text})} placeholder="Competitor Brand B Sales" />
          <Text style={styles.inputLabel}>Competitor Packages</Text>
          <TextInput style={styles.input} value={formData.competitorPackages} onChangeText={text => setFormData({...formData, competitorPackages: text})} placeholder="Competitor Packages" />

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
                  <TextInput style={styles.input} value={formData.merchandiseDescription1} onChangeText={text => setFormData({...formData, merchandiseDescription1: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <TextInput style={styles.input} value={formData.merchandiseSold1} onChangeText={text => setFormData({...formData, merchandiseSold1: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <TextInput style={styles.input} value={formData.merchandiseDescription2} onChangeText={text => setFormData({...formData, merchandiseDescription2: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <TextInput style={styles.input} value={formData.merchandiseSold2} onChangeText={text => setFormData({...formData, merchandiseSold2: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <TextInput style={styles.input} value={formData.merchandiseDescription3} onChangeText={text => setFormData({...formData, merchandiseDescription3: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <TextInput style={styles.input} value={formData.merchandiseSold3} onChangeText={text => setFormData({...formData, merchandiseSold3: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <TextInput style={styles.input} value={formData.merchandiseDescription4} onChangeText={text => setFormData({...formData, merchandiseDescription4: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
                  <TextInput style={styles.input} value={formData.merchandiseSold4} onChangeText={text => setFormData({...formData, merchandiseSold4: text})} placeholder="Merchandise Sold" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <TextInput style={styles.input} value={formData.merchandiseDescription5} onChangeText={text => setFormData({...formData, merchandiseDescription5: text})} placeholder="Merchandise Description" />
                </View>
                <View style={{flex: 1}}>
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
          <TextInput style={styles.input} value={formData.issuesNotesRequests} onChangeText={text => setFormData({...formData, issuesNotesRequests: text})} placeholder="Issues/Notes/Requests" />
          <Text style={styles.inputLabel}>Learning Points</Text>
          <TextInput style={styles.input} value={formData.learningPoints} onChangeText={text => setFormData({...formData, learningPoints: text})} placeholder="Learning Points" />
          <Text style={styles.inputLabel}>Beer Market Size</Text>
          <TextInput style={styles.input} value={formData.beerMarketSize} onChangeText={text => setFormData({...formData, beerMarketSize: text})} placeholder="Beer Market Size" />
          <Text style={styles.inputLabel}>Total Guinness Sales</Text>
          <TextInput style={styles.input} value={formData.totalGuinnessSales} onChangeText={text => setFormData({...formData, totalGuinnessSales: text})} placeholder="Total Guinness Sales" />
          <Text style={styles.inputLabel}>Achievement Percentage</Text>
          <TextInput style={styles.input} value={formData.achievementPercentage} onChangeText={text => setFormData({...formData, achievementPercentage: text})} placeholder="Achievement Percentage" />

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
});
