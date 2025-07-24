import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Button, ActivityIndicator, Modal, TextInput, Alert, ScrollView, Switch, RefreshControl } from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function SalesReportDetailScreen() {
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  type ReportItem = {
    id: string;
    assignedToBA?: string;
    // add other relevant fields as needed
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
    week: '', channel: '', activityName: '', tier: '', date: '', city: '', area: '', outletVenueName: '', capacity: '',
    // Personnel Information
    outletEventPic: '', spgCount: '', crewCanvasserCount: '', teamLeaderName: '', spgName: '',
    // Sampling Data
    samplingSmoothBottle: '', samplingSmoothOnLips: '', samplingGfesBottle: '', samplingGfesOnLips: '', samplingTargetAchievement: '',
    // Selling Data
    salesSmoothCan: '', salesSmoothBotol: '', salesGfesCan: '', salesGfesCanBig: '', salesGfesBotol: '', salesGfesQuart: '', salesKegs: '', salesMd: '', salesGdic: '',
    // Call and Customer Data
    callsOffers: '', effectiveCalls: '', callsVsEffectivePercentage: '',
    // Promotional Activities
    promoSmooth: '', promoGfes: '', promoKegs: '', promoMicrodraught: '', promoGdic: '', packagesSold: '', repeatOrders: '',
    // Visitor and Consumer Data
    visitorsOverall: '', visitorsAlcoholDrinkers: '', visitorsAllBeerDrinkers: '', visitorsAllGuinness: '',
    drinkersSmooth: '', drinkersGfes: '', drinkersKegs: '', drinkersMicrodraught: '', drinkersGdic: '', drinkersMixed: '',
    tablesOverall: '', tablesAlcoholDrinkers: '', tablesAllBeerDrinkers: '', tablesAllGuinness: '',
    // Competitor Sales
    competitorBrandA: '', competitorBrandB: '', competitorPackages: '',
    // Merchandise and Programs
    merchandiseAvailable: false, merchandiseDistributed: '', stoutieProgramParticipation: false, loyaltyProgramDetails: '',
    // Notes and Performance
    issuesNotesRequests: '', learningPoints: '', beerMarketSize: '', totalGuinnessSales: '', achievementPercentage: '',
    // Bali Specific Data
    baliLocalVisitors: '', baliForeignVisitors: '', baliLocalGuinnessBuyers: '', baliForeignGuinnessBuyers: '',
    // AMS Data
    amsGfes: '', amsSmooth: '', amsMicrodraught: '', amsKegs: '', amsTotal: '',
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

  useEffect(() => {
    if (userRole) {
      fetchReports();
    }
  }, [userRole]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const collectionRef = collection(db, 'sales_report_detail');
      const snapshot = await getDocs(collectionRef);
      let list = snapshot.docs.map(doc => ({ id: doc.id, assignedToBA: doc.data().assignedToBA, assignedToTL: doc.data().assignedToTL, ...doc.data() }));
      // Filter for BA role: only show records assigned to current user
      if (userRole === 'Iris - BA' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToBA === auth.currentUser?.uid);
      }
      // Filter for TL role: only show records assigned to current TL
      if (userRole === 'Iris - TL' && auth.currentUser?.uid) {
        list = list.filter(a => a?.assignedToTL === auth.currentUser?.uid);
      }
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
      setFormData({
        ...initialFormData,
        ...item,
        date: item.date?.toDate().toISOString().split('T')[0] || '',
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
        date: formData.date ? new Date(formData.date) : null,
        entryTimestamp: serverTimestamp(),
    };

    if (modalType === 'add') {
      addDoc(collection(db, "sales_report_detail"), dataToSubmit)
        .then(() => {
          fetchReports();
          setIsModalVisible(false);
        }).catch(error => Alert.alert("Add Failed", error.message));
    } else if (selectedReport) {
      updateDoc(doc(db, "sales_report_detail", selectedReport.id), dataToSubmit)
        .then(() => {
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
      <Text style={styles.itemTitle}>{item.activityName} @ {item.outletVenueName}</Text>
      <Text>Date: {item.date?.toDate().toLocaleDateString()}</Text>
      <Text>Leader: {item.teamLeaderName}</Text>
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
          
          <Text style={styles.sectionTitle}>Activity Information</Text>
          <TextInput style={styles.input} value={formData.week} onChangeText={text => setFormData({...formData, week: text})} placeholder="Week" />
          <TextInput style={styles.input} value={formData.channel} onChangeText={text => setFormData({...formData, channel: text})} placeholder="Channel" />
          <TextInput style={styles.input} value={formData.activityName} onChangeText={text => setFormData({...formData, activityName: text})} placeholder="Activity Name" />
          <TextInput style={styles.input} value={formData.tier} onChangeText={text => setFormData({...formData, tier: text})} placeholder="Tier" />
          <TextInput style={styles.input} value={formData.date} onChangeText={text => setFormData({...formData, date: text})} placeholder="Date (YYYY-MM-DD)" />
          <TextInput style={styles.input} value={formData.city} onChangeText={text => setFormData({...formData, city: text})} placeholder="City" />
          <TextInput style={styles.input} value={formData.area} onChangeText={text => setFormData({...formData, area: text})} placeholder="Area" />
          <TextInput style={styles.input} value={formData.outletVenueName} onChangeText={text => setFormData({...formData, outletVenueName: text})} placeholder="Outlet/Venue Name" />
          <TextInput style={styles.input} value={formData.capacity} onChangeText={text => setFormData({...formData, capacity: text})} placeholder="Capacity" keyboardType="numeric" />

          <Text style={styles.sectionTitle}>Personnel Information</Text>
          <TextInput style={styles.input} value={formData.outletEventPic} onChangeText={text => setFormData({...formData, outletEventPic: text})} placeholder="Outlet/Event PIC" />
          <TextInput style={styles.input} value={formData.spgCount} onChangeText={text => setFormData({...formData, spgCount: text})} placeholder="# of SPG" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.crewCanvasserCount} onChangeText={text => setFormData({...formData, crewCanvasserCount: text})} placeholder="# of Crew/Canvasser" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.teamLeaderName} onChangeText={text => setFormData({...formData, teamLeaderName: text})} placeholder="Team Leader Name" />
          <TextInput style={styles.input} value={formData.spgName} onChangeText={text => setFormData({...formData, spgName: text})} placeholder="SPG Name" />

          <Text style={styles.sectionTitle}>Sampling Data</Text>
          <TextInput style={styles.input} value={formData.samplingSmoothBottle} onChangeText={text => setFormData({...formData, samplingSmoothBottle: text})} placeholder="Smooth Bottle Sampling" />
          <TextInput style={styles.input} value={formData.samplingSmoothOnLips} onChangeText={text => setFormData({...formData, samplingSmoothOnLips: text})} placeholder="Smooth On-Lips Sampling" />
          <TextInput style={styles.input} value={formData.samplingGfesBottle} onChangeText={text => setFormData({...formData, samplingGfesBottle: text})} placeholder="GFES Bottle Sampling" />
          <TextInput style={styles.input} value={formData.samplingGfesOnLips} onChangeText={text => setFormData({...formData, samplingGfesOnLips: text})} placeholder="GFES On-Lips Sampling" />
          <TextInput style={styles.input} value={formData.samplingTargetAchievement} onChangeText={text => setFormData({...formData, samplingTargetAchievement: text})} placeholder="Target Achievement" />

          <Text style={styles.sectionTitle}>Selling Data</Text>
          <TextInput style={styles.input} value={formData.salesSmoothCan} onChangeText={text => setFormData({...formData, salesSmoothCan: text})} placeholder="Sales SMOOTH CAN" />
          <TextInput style={styles.input} value={formData.salesSmoothBotol} onChangeText={text => setFormData({...formData, salesSmoothBotol: text})} placeholder="Sales SMOOTH BOTOL" />
          <TextInput style={styles.input} value={formData.salesGfesCan} onChangeText={text => setFormData({...formData, salesGfesCan: text})} placeholder="Sales GFES CAN" />
          <TextInput style={styles.input} value={formData.salesGfesCanBig} onChangeText={text => setFormData({...formData, salesGfesCanBig: text})} placeholder="Sales GFES CAN BIG" />
          <TextInput style={styles.input} value={formData.salesGfesBotol} onChangeText={text => setFormData({...formData, salesGfesBotol: text})} placeholder="Sales GFES BOTOL" />
          <TextInput style={styles.input} value={formData.salesGfesQuart} onChangeText={text => setFormData({...formData, salesGfesQuart: text})} placeholder="Sales GFES QUART" />
          <TextInput style={styles.input} value={formData.salesKegs} onChangeText={text => setFormData({...formData, salesKegs: text})} placeholder="Sales KEGS" />
          <TextInput style={styles.input} value={formData.salesMd} onChangeText={text => setFormData({...formData, salesMd: text})} placeholder="Sales MD" />
          <TextInput style={styles.input} value={formData.salesGdic} onChangeText={text => setFormData({...formData, salesGdic: text})} placeholder="Sales GDIC" />

          <Text style={styles.sectionTitle}>Call and Customer Data</Text>
          <TextInput style={styles.input} value={formData.callsOffers} onChangeText={text => setFormData({...formData, callsOffers: text})} placeholder="Number of calls/offers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.effectiveCalls} onChangeText={text => setFormData({...formData, effectiveCalls: text})} placeholder="Effective calls/buyers/shops" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.callsVsEffectivePercentage} onChangeText={text => setFormData({...formData, callsVsEffectivePercentage: text})} placeholder="% calls vs. effective calls" keyboardType="numeric" />

          <Text style={styles.sectionTitle}>Promotional Activities</Text>
          <TextInput style={styles.input} value={formData.promoSmooth} onChangeText={text => setFormData({...formData, promoSmooth: text})} placeholder="Guinness SMOOTH Promotion" />
          <TextInput style={styles.input} value={formData.promoGfes} onChangeText={text => setFormData({...formData, promoGfes: text})} placeholder="Guinness GFES Promotion" />
          <TextInput style={styles.input} value={formData.promoKegs} onChangeText={text => setFormData({...formData, promoKegs: text})} placeholder="Guinness KEGS Promotion" />
          <TextInput style={styles.input} value={formData.promoMicrodraught} onChangeText={text => setFormData({...formData, promoMicrodraught: text})} placeholder="Guinness MICRODRAUGHT Promotion" />
          <TextInput style={styles.input} value={formData.promoGdic} onChangeText={text => setFormData({...formData, promoGdic: text})} placeholder="Guinness GDIC Promotion" />
          <TextInput style={styles.input} value={formData.packagesSold} onChangeText={text => setFormData({...formData, packagesSold: text})} placeholder="Packages Sold" />
          <TextInput style={styles.input} value={formData.repeatOrders} onChangeText={text => setFormData({...formData, repeatOrders: text})} placeholder="Repeat Orders" />

          <Text style={styles.sectionTitle}>Visitor and Consumer Data</Text>
          <TextInput style={styles.input} value={formData.visitorsOverall} onChangeText={text => setFormData({...formData, visitorsOverall: text})} placeholder="Overall Visitors" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.visitorsAlcoholDrinkers} onChangeText={text => setFormData({...formData, visitorsAlcoholDrinkers: text})} placeholder="Alcohol Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.visitorsAllBeerDrinkers} onChangeText={text => setFormData({...formData, visitorsAllBeerDrinkers: text})} placeholder="All Beer Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.visitorsAllGuinness} onChangeText={text => setFormData({...formData, visitorsAllGuinness: text})} placeholder="All Guinness Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.drinkersSmooth} onChangeText={text => setFormData({...formData, drinkersSmooth: text})} placeholder="Smooth Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.drinkersGfes} onChangeText={text => setFormData({...formData, drinkersGfes: text})} placeholder="GFES Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.drinkersKegs} onChangeText={text => setFormData({...formData, drinkersKegs: text})} placeholder="KEGS Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.drinkersMicrodraught} onChangeText={text => setFormData({...formData, drinkersMicrodraught: text})} placeholder="Microdraught Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.drinkersGdic} onChangeText={text => setFormData({...formData, drinkersGdic: text})} placeholder="GDIC Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.drinkersMixed} onChangeText={text => setFormData({...formData, drinkersMixed: text})} placeholder="Mixed Category Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.tablesOverall} onChangeText={text => setFormData({...formData, tablesOverall: text})} placeholder="Overall Tables" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.tablesAlcoholDrinkers} onChangeText={text => setFormData({...formData, tablesAlcoholDrinkers: text})} placeholder="Tables of Alcohol Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.tablesAllBeerDrinkers} onChangeText={text => setFormData({...formData, tablesAllBeerDrinkers: text})} placeholder="Tables of All Beer Drinkers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.tablesAllGuinness} onChangeText={text => setFormData({...formData, tablesAllGuinness: text})} placeholder="Tables of All Guinness Drinkers" keyboardType="numeric" />

          <Text style={styles.sectionTitle}>Competitor Sales</Text>
          <TextInput style={styles.input} value={formData.competitorBrandA} onChangeText={text => setFormData({...formData, competitorBrandA: text})} placeholder="Competitor Brand A Sales" />
          <TextInput style={styles.input} value={formData.competitorBrandB} onChangeText={text => setFormData({...formData, competitorBrandB: text})} placeholder="Competitor Brand B Sales" />
          <TextInput style={styles.input} value={formData.competitorPackages} onChangeText={text => setFormData({...formData, competitorPackages: text})} placeholder="Competitor Packages" />

          <Text style={styles.sectionTitle}>Merchandise and Programs</Text>
          <View style={styles.switchContainer}><Text>Merchandise Available</Text><Switch value={formData.merchandiseAvailable} onValueChange={val => setFormData({...formData, merchandiseAvailable: val})} /></View>
          <TextInput style={styles.input} value={formData.merchandiseDistributed} onChangeText={text => setFormData({...formData, merchandiseDistributed: text})} placeholder="Merchandise Distributed" />
          <View style={styles.switchContainer}><Text>Stoutie Program Participation</Text><Switch value={formData.stoutieProgramParticipation} onValueChange={val => setFormData({...formData, stoutieProgramParticipation: val})} /></View>
          <TextInput style={styles.input} value={formData.loyaltyProgramDetails} onChangeText={text => setFormData({...formData, loyaltyProgramDetails: text})} placeholder="Loyalty Program Details" />

          <Text style={styles.sectionTitle}>Notes and Performance</Text>
          <TextInput style={styles.input} value={formData.issuesNotesRequests} onChangeText={text => setFormData({...formData, issuesNotesRequests: text})} placeholder="Issues/Notes/Requests" />
          <TextInput style={styles.input} value={formData.learningPoints} onChangeText={text => setFormData({...formData, learningPoints: text})} placeholder="Learning Points" />
          <TextInput style={styles.input} value={formData.beerMarketSize} onChangeText={text => setFormData({...formData, beerMarketSize: text})} placeholder="Beer Market Size" />
          <TextInput style={styles.input} value={formData.totalGuinnessSales} onChangeText={text => setFormData({...formData, totalGuinnessSales: text})} placeholder="Total Guinness Sales" />
          <TextInput style={styles.input} value={formData.achievementPercentage} onChangeText={text => setFormData({...formData, achievementPercentage: text})} placeholder="Achievement Percentage" />

          <Text style={styles.sectionTitle}>Bali Specific Data</Text>
          <TextInput style={styles.input} value={formData.baliLocalVisitors} onChangeText={text => setFormData({...formData, baliLocalVisitors: text})} placeholder="Bali Local Visitors" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.baliForeignVisitors} onChangeText={text => setFormData({...formData, baliForeignVisitors: text})} placeholder="Bali Foreign Visitors" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.baliLocalGuinnessBuyers} onChangeText={text => setFormData({...formData, baliLocalGuinnessBuyers: text})} placeholder="Bali Local Guinness Buyers" keyboardType="numeric" />
          <TextInput style={styles.input} value={formData.baliForeignGuinnessBuyers} onChangeText={text => setFormData({...formData, baliForeignGuinnessBuyers: text})} placeholder="Bali Foreign Guinness Buyers" keyboardType="numeric" />

          <Text style={styles.sectionTitle}>AMS Data</Text>
          <TextInput style={styles.input} value={formData.amsGfes} onChangeText={text => setFormData({...formData, amsGfes: text})} placeholder="AMS GFES" />
          <TextInput style={styles.input} value={formData.amsSmooth} onChangeText={text => setFormData({...formData, amsSmooth: text})} placeholder="AMS Smooth" />
          <TextInput style={styles.input} value={formData.amsMicrodraught} onChangeText={text => setFormData({...formData, amsMicrodraught: text})} placeholder="AMS Microdraught" />
          <TextInput style={styles.input} value={formData.amsKegs} onChangeText={text => setFormData({...formData, amsKegs: text})} placeholder="AMS KEGS" />
          <TextInput style={styles.input} value={formData.amsTotal} onChangeText={text => setFormData({...formData, amsTotal: text})} placeholder="Total AMS" />

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
      {canUpdate && <Button title="Add New Report" onPress={() => handleOpenModal('add')} />}
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
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 10 },
  itemContainer: { marginBottom: 10, padding: 10, borderColor: 'gray', borderWidth: 1, borderRadius: 5 },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
});
