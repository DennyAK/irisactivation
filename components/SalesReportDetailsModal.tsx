import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet } from 'react-native';

export type DetailsMode = 'review' | 'description';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: any | null;
  mode: DetailsMode;
  userRole: string | null;
  onCopyAll?: () => void;
  onDoneByAM?: () => void;
};

const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <Text selectable>{label}: {value ?? '-'}</Text>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text selectable style={styles.sectionTitle}>{children}</Text>
);

const SalesReportDetailsModal: React.FC<Props> = ({
  visible,
  onClose,
  item,
  mode,
  userRole,
  onCopyAll,
  onDoneByAM,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text selectable style={styles.title}>{mode === 'review' ? 'Review for Area Manager' : 'Description'}</Text>
          {!item ? (
            <Text>No data</Text>
          ) : (
            <>
              <SectionTitle>Personnel Information</SectionTitle>
              <Line label="Assigned to BA" value={item.assignedToBA} />
              <Line label="Assigned to TL" value={item.assignedToTL} />
              <Line label="BA Count" value={item.baCount} />
              <Line label="Crew Canvasser Count" value={item.crewCanvasserCount} />
              <Line label="Team Leader Name" value={item.teamLeaderName} />
              <Line label="SPG Name" value={item.spgName} />
              <Line label="Sales Report Detail Status" value={item.salesReportDetailStatus} />
              <Line label="Created At" value={item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : item.createdAt} />
              <Line label="Created By" value={item.createdBy} />
              <Line label="Task ID" value={item.tasksId} />

              <SectionTitle>Outlet Information</SectionTitle>
              <Line label="Outlet ID" value={item.outletId} />
              <Line label="Outlet Name" value={item.outletName} />
              <Line label="Province" value={item.outletProvince} />
              <Line label="City" value={item.outletCity} />
              <Line label="Activity Name" value={item.activityName} />
              <Line label="Outlet Venue Name" value={item.outletVenueName} />
              <Line label="Capacity" value={item.outletCapacity} />
              <Line label="Outlet No. of Table Available" value={item.outletNoOfTableAVailable} />
              <Line label="Outlet Event PIC" value={item.outletEventPic} />

              <SectionTitle>Guinness Selling Data</SectionTitle>
              <Line label="Sales Kegs 330ml" value={item.salesKegs330} />
              <Line label="Sales Kegs 500ml" value={item.salesKegs500} />
              <Line label="Sales MD 500ml" value={item.salesMd500} />
              <Line label="Sales Gdic 400ml" value={item.salesGdic400} />
              <Line label="Sales Smooth Pint 330ml" value={item.salesSmoothPint330} />
              <Line label="Sales Smooth Can 330ml" value={item.salesSmoothCan330} />
              <Line label="Sales Gfes Pint 330ml" value={item.salesGfesPint330} />
              <Line label="Sales Gfes Can 330ml" value={item.salesGfesCan330} />
              <Line label="Sales Gfes Quart 620ml" value={item.salesGfesQuart620} />
              <Line label="Sales Gfes Can Big 500ml" value={item.salesGfesCanbig500} />

              <SectionTitle>Sampling Data</SectionTitle>
              <Line label="Sampling available" value={item.samplingAvailable} />
              <Line label="Sampling Smooth Bottle" value={item.samplingSmoothBottle} />
              <Line label="Sampling Smooth On Lips" value={item.samplingSmoothOnLips} />
              <Line label="Sampling Smooth Bottle To Buy" value={item.samplingSmoothBottleToBuy} />
              <Line label="Sampling Gfes Bottle" value={item.samplingGfesBottle} />
              <Line label="Sampling Gfes On Lips" value={item.samplingGfesOnLips} />
              <Line label="Sampling Gfes To Buy" value={item.samplingGfesToBuy} />
              <Line label="Sampling Kegs" value={item.samplingKegs} />
              <Line label="Sampling Kegs On Lips" value={item.samplingKegsOnLips} />
              <Line label="Sampling Kegs To Buy" value={item.samplingKegsToBuy} />
              <Line label="Sampling Md" value={item.samplingMd} />
              <Line label="Sampling Md On Lips" value={item.samplingMdOnLips} />
              <Line label="Sampling Md To Buy" value={item.samplingMdToBuy} />
              <Line label="Sampling Gdic" value={item.samplingGdic} />
              <Line label="Sampling Gdic On Lips" value={item.samplingGdicOnLips} />
              <Line label="Sampling Gdic Bottle To Buy" value={item.samplingGdicBottleToBuy} />

              <SectionTitle>Call and Customer Data</SectionTitle>
              <Line label="Calls Offers" value={item.callsOffers} />
              <Line label="Effective Calls" value={item.effectiveCalls} />
              <Line label="Calls vs Effective Percentage" value={item.callsVsEffectivePercentage} />

              <SectionTitle>Guinness Promotional Activities</SectionTitle>
              <Line label="Guinness Smooth Promotion Available" value={item.guinnessSmoothPromotionAvailable ? 'Yes' : 'No'} />
              <Line label="Promo Smooth Description" value={item.promoSmoothDescription} />
              <Line label="Promo Smooth Sold" value={item.promoSmoothSold} />
              <Line label="Promo Smooth Repeat Orders" value={item.promoSmoothRepeatOrders ?? item.promoSmoothRepeatOrder} />
              <Line label="Promo Smooth Description - Type 2" value={item.promoSmoothDescriptionType2} />
              <Line label="Promo Smooth Sold - Type 2" value={item.promoSmoothSoldType2} />
              <Line label="Promo Smooth Repeat Orders - Type 2" value={item.promoSmoothRepeatOrdersType2 ?? item.promoSmoothRepeatOrderType2} />

              <Line label="Guinness Gfes Promotion Available" value={item.guinnessGfesPromotionAvailable ? 'Yes' : 'No'} />
              <Line label="Promo Gfes Description" value={item.promoGfesDescription} />
              <Line label="Promo Gfes Sold" value={item.promoGfesSold} />
              <Line label="Promo Gfes Repeat Orders" value={item.promoGfesRepeatOrders ?? item.promoGfesRepeatOrder} />
              <Line label="Promo Gfes Description - Type 2" value={item.promoGfesDescriptionType2} />
              <Line label="Promo Gfes Sold - Type 2" value={item.promoGfesSoldType2} />
              <Line label="Promo Gfes Repeat Orders - Type 2" value={item.promoGfesRepeatOrdersType2 ?? item.promoGfesRepeatOrderType2} />

              <Line label="Guinness Kegs Promotion Available" value={item.guinnessKegsPromotionAvailable ? 'Yes' : 'No'} />
              <Line label="Promo Kegs Description" value={item.promoKegsDescription} />
              <Line label="Promo Kegs Sold" value={item.promoKegsSold} />
              <Line label="Promo Kegs Repeat Orders" value={item.promoKegsRepeatOrders ?? item.promoKegsRepeatOrder} />
              <Line label="Promo Kegs Description - Type 2" value={item.promoKegsDescriptionType2} />
              <Line label="Promo Kegs Sold - Type 2" value={item.promoKegsSoldType2} />
              <Line label="Promo Kegs Repeat Orders - Type 2" value={item.promoKegsRepeatOrdersType2 ?? item.promoKegsRepeatOrderType2} />

              <Line label="Guinness Microdraught Promotion Available" value={item.guinnessMicroDraughtPromotionAvailable ? 'Yes' : 'No'} />
              <Line label="Promo Microdraught Description" value={item.promoMicrodraughtDescription} />
              <Line label="Promo Microdraught Sold" value={item.promoMicrodraughtSold} />
              <Line label="Promo Microdraught Repeat Orders" value={item.promoMicrodraughtRepeatOrders ?? item.promoMicrodraughtRepeatOrder} />
              <Line label="Promo Microdraught Description - Type 2" value={item.promoMicrodraughtDescriptionType2} />
              <Line label="Promo Microdraught Sold - Type 2" value={item.promoMicrodraughtSoldType2} />
              <Line label="Promo Microdraught Repeat Orders - Type 2" value={item.promoMicrodraughtRepeatOrdersType2 ?? item.promoMicrodraughtRepeatOrderType2} />

              <Line label="Guinness Gdic Promotion Available" value={item.guinnessGdicPromotionAvailable ? 'Yes' : 'No'} />
              <Line label="Promo Gdic Description" value={item.promoGdicDescription} />
              <Line label="Promo Gdic Sold" value={item.promoGdicSold} />
              <Line label="Promo Gdic Repeat Orders" value={item.promoGdicRepeatOrders ?? item.promoGdicRepeatOrder} />
              <Line label="Promo Gdic Description - Type 2" value={item.promoGdicDescriptionType2} />
              <Line label="Promo Gdic Sold - Type 2" value={item.promoGdicSoldType2} />
              <Line label="Promo Gdic Repeat Orders - Type 2" value={item.promoGdicRepeatOrdersType2 ?? item.promoGdicRepeatOrderType2} />

              <SectionTitle>Visitor and Consumer Data</SectionTitle>
              <Line label="Visitors Overall" value={item.visitorsOverall} />
              <Line label="Visitors Alcohol Drinkers" value={item.visitorsAlcoholDrinkers} />
              <Line label="Visitors All Beer Drinkers" value={item.visitorsAllBeerDrinkers} />
              <Line label="Visitors All Guinness" value={item.visitorsAllGuinness} />
              <Line label="Visitors All Competitor" value={item.visitorsAllCompetitor} />
              <Line label="Visitors All Guinness Mixed Competitor" value={item.visitorsAllGuinnessMixedCompetitor} />
              <Line label="Drinkers Smooth" value={item.drinkersSmooth} />
              <Line label="Drinkers Gfes" value={item.drinkersGfes} />
              <Line label="Drinkers Kegs" value={item.drinkersKegs} />
              <Line label="Drinkers Microdraught" value={item.drinkersMicrodraught} />
              <Line label="Drinkers Gdic" value={item.drinkersGdic} />
              <Line label="Drinkers Mixed" value={item.drinkersMixed} />

              <SectionTitle>Tables Data</SectionTitle>
              <Line label="Tables Overall" value={item.tablesOverall} />
              <Line label="Tables Alcohol Drinkers" value={item.tablesAlcoholDrinkers} />
              <Line label="Tables Non Alcohol Drinkers" value={item.tablesNonAlcoholDrinkers} />
              <Line label="Tables All Beer Drinkers" value={item.tablesAllBeerDrinkers} />
              <Line label="Tables All Guinness" value={item.tablesAllGuinness} />
              <Line label="Tables All Competitor" value={item.tablesAllCompetitor} />
              <Line label="Tables All Guinness Mixed Competitor" value={item.tablesAllGuinnessMixedCompetitor} />

              <SectionTitle>Competitor Sales</SectionTitle>
              {/* Bintang */}
              <Line label="Competitor Bintang Available" value={item.competitorBintangAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Bintang Glass" value={item.competitorBintangGlass} />
              <Line label="Competitor Bintang Pint" value={item.competitorBintangPint} />
              <Line label="Competitor Bintang Quart" value={item.competitorBintangQuart} />
              <Line label="Competitor Bintang Can Small" value={item.competitorBintangCanSmall} />
              <Line label="Competitor Bintang Can Big" value={item.competitorBintangCanBig} />
              <Line label="Competitor Bintang Promo Description" value={item.competitorBintangPromoDescription} />
              <Line label="Competitor Bintang Promo Sold" value={item.competitorBintangPromoSold} />

              {/* Bintang Crystal */}
              <Line label="Competitor Bintang Crystal Available" value={item.competitorBintangCrystalAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Bintang Crystal Glass" value={item.competitorBintangCrystalGlass} />
              <Line label="Competitor Bintang Crystal Pint" value={item.competitorBintangCrystalPint} />
              <Line label="Competitor Bintang Crystal Quart" value={item.competitorBintangCrystalQuart} />
              <Line label="Competitor Bintang Crystal Can Small" value={item.competitorBintangCrystalCanSmall} />
              <Line label="Competitor Bintang Crystal Can Big" value={item.competitorBintangCrystalCanBig} />
              <Line label="Competitor Bintang Crystal Promo Description" value={item.competitorBintangCrystalPromoDescription} />
              <Line label="Competitor Bintang Crystal Promo Sold" value={item.competitorBintangCrystalPromoSold} />

              {/* Heineken */}
              <Line label="Competitor Heineken Available" value={item.competitorHeinekenAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Heineken Glass" value={item.competitorHeinekenGlass} />
              <Line label="Competitor Heineken Pint" value={item.competitorHeinekenPint} />
              <Line label="Competitor Heineken Quart" value={item.competitorHeinekenQuart} />
              <Line label="Competitor Heineken Can Small" value={item.competitorHeinekenCanSmall} />
              <Line label="Competitor Heineken Can Big" value={item.competitorHeinekenCanBig} />
              <Line label="Competitor Heineken Promo Description" value={item.competitorHeinekenPromoDescription} />
              <Line label="Competitor Heineken Promo Sold" value={item.competitorHeinekenPromoSold} />

              {/* Heineken Import */}
              <Line label="Competitor Heineken Import Available" value={item.competitorHeinekenImportAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Heineken Import Glass" value={item.competitorHeinekenImportGlass} />
              <Line label="Competitor Heineken Import Pint" value={item.competitorHeinekenImportPint} />
              <Line label="Competitor Heineken Import Quart" value={item.competitorHeinekenImportQuart} />
              <Line label="Competitor Heineken Import Can Small" value={item.competitorHeinekenImportCanSmall} />
              <Line label="Competitor Heineken Import Can Big" value={item.competitorHeinekenImportCanBig} />
              <Line label="Competitor Heineken Import Promo Description" value={item.competitorHeinekenImportPromoDescription} />
              <Line label="Competitor Heineken Import Promo Sold" value={item.competitorHeinekenImportPromoSold} />

              {/* Erdinger Import */}
              <Line label="Competitor Erdinger Import Available" value={item.competitorErdingerImportAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Erdinger Import Glass" value={item.competitorErdingerImportGlass} />
              <Line label="Competitor Erdinger Import Pint" value={item.competitorErdingerImportPint} />
              <Line label="Competitor Erdinger Import Quart" value={item.competitorErdingerImportQuart} />
              <Line label="Competitor Erdinger Import Can Small" value={item.competitorErdingerImportCanSmall} />
              <Line label="Competitor Erdinger Import Can Big" value={item.competitorErdingerImportCanBig} />
              <Line label="Competitor Erdinger Import Promo Description" value={item.competitorErdingerImportPromoDescription} />
              <Line label="Competitor Erdinger Import Promo Sold" value={item.competitorErdingerImportPromoSold} />

              {/* Budweizer Import */}
              <Line label="Competitor Budweizer Import Available" value={item.competitorBudweizerImportAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Budweizer Import Glass" value={item.competitorBudweizerImportGlass} />
              <Line label="Competitor Budweizer Import Pint" value={item.competitorBudweizerImportPint} />
              <Line label="Competitor Budweizer Import Quart" value={item.competitorBudweizerImportQuart} />
              <Line label="Competitor Budweizer Import Can Small" value={item.competitorBudweizerImportCanSmall} />
              <Line label="Competitor Budweizer Import Can Big" value={item.competitorBudweizerImportCanBig} />
              <Line label="Competitor Budweizer Import Promo Description" value={item.competitorBudweizerImportPromoDescription} />
              <Line label="Competitor Budweizer Import Promo Sold" value={item.competitorBudweizerImportPromoSold} />

              {/* Anker */}
              <Line label="Competitor Anker Available" value={item.competitorAnkerAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Anker Glass" value={item.competitorAnkerGlass} />
              <Line label="Competitor Anker Pint" value={item.competitorAnkerPint} />
              <Line label="Competitor Anker Quart" value={item.competitorAnkerQuart} />
              <Line label="Competitor Anker Can Small" value={item.competitorAnkerCanSmall} />
              <Line label="Competitor Anker Can Big" value={item.competitorAnkerCanBig} />
              <Line label="Competitor Anker Promo Description" value={item.competitorAnkerPromoDescription} />
              <Line label="Competitor Anker Promo Sold" value={item.competitorAnkerPromoSold} />

              {/* Bali Hai */}
              <Line label="Competitor Bali Hai Available" value={item.competitorBalihaiAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Bali Hai Glass" value={item.competitorBalihaiGlass} />
              <Line label="Competitor Bali Hai Pint" value={item.competitorBalihaiPint} />
              <Line label="Competitor Bali Hai Quart" value={item.competitorBalihaiQuart} />
              <Line label="Competitor Bali Hai Can Small" value={item.competitorBalihaiCanSmall} />
              <Line label="Competitor Bali Hai Can Big" value={item.competitorBalihaiCanBig} />
              <Line label="Competitor Bali Hai Promo Description" value={item.competitorBalihaiPromoDescription} />
              <Line label="Competitor Bali Hai Promo Sold" value={item.competitorBalihaiPromoSold} />

              {/* Prost */}
              <Line label="Competitor Prost Available" value={item.competitorProstAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Prost Glass" value={item.competitorProstGlass} />
              <Line label="Competitor Prost Pint" value={item.competitorProstPint} />
              <Line label="Competitor Prost Quart" value={item.competitorProstQuart} />
              <Line label="Competitor Prost Can Small" value={item.competitorProstCanSmall} />
              <Line label="Competitor Prost Can Big" value={item.competitorProstCanBig} />
              <Line label="Competitor Prost Promo Description" value={item.competitorProstPromoDescription} />
              <Line label="Competitor Prost Promo Sold" value={item.competitorProstPromoSold} />

              {/* San Miguel */}
              <Line label="Competitor San Miguel Available" value={item.competitorSanMiguelAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor San Miguel Glass" value={item.competitorSanMiguelGlass} />
              <Line label="Competitor San Miguel Pint" value={item.competitorSanMiguelPint} />
              <Line label="Competitor San Miguel Quart" value={item.competitorSanMiguelQuart} />
              <Line label="Competitor San Miguel Can Small" value={item.competitorSanMiguelCanSmall} />
              <Line label="Competitor San Miguel Can Big" value={item.competitorSanMiguelCanBig} />
              <Line label="Competitor San Miguel Promo Description" value={item.competitorSanMiguelPromoDescription} />
              <Line label="Competitor San Miguel Promo Sold" value={item.competitorSanMiguelPromoSold} />

              {/* Singaraja */}
              <Line label="Competitor Singaraja Available" value={item.competitorSingarajaAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Singaraja Glass" value={item.competitorSingarajaGlass} />
              <Line label="Competitor Singaraja Pint" value={item.competitorSingarajaPint} />
              <Line label="Competitor Singaraja Quart" value={item.competitorSingarajaQuart} />
              <Line label="Competitor Singaraja Can Small" value={item.competitorSingarajaCanSmall} />
              <Line label="Competitor Singaraja Can Big" value={item.competitorSingarajaCanBig} />

              {/* Carlsberg */}
              <Line label="Competitor Carlsberg Available" value={item.competitorCarlsbergAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Carlsberg Glass" value={item.competitorCarlsbergGlass} />
              <Line label="Competitor Carlsberg Pint" value={item.competitorCarlsbergPint} />
              <Line label="Competitor Carlsberg Quart" value={item.competitorCarlsbergQuart} />
              <Line label="Competitor Carlsberg Can Small" value={item.competitorCarlsbergCanSmall} />
              <Line label="Competitor Carlsberg Can Big" value={item.competitorCarlsbergCanBig} />
              <Line label="Competitor Carlsberg Promo Description" value={item.competitorCarlsbergPromoDescription} />
              <Line label="Competitor Carlsberg Promo Sold" value={item.competitorCarlsbergPromoSold} />

              {/* Draft Beer */}
              <Line label="Competitor Draftbeer Available" value={item.competitorDraftBeerAvailable ?? item.competitorDraftbeerAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Draftbeer Glass" value={item.competitorDraftBeerGlass ?? item.competitorDraftbeerGlass} />
              <Line label="Competitor Draftbeer Pint" value={item.competitorDraftBeerPint ?? item.competitorDraftbeerPint} />
              <Line label="Competitor Draftbeer Quart" value={item.competitorDraftBeerQuart ?? item.competitorDraftbeerQuart} />
              <Line label="Competitor Draftbeer Can Small" value={item.competitorDraftBeerCanSmall ?? item.competitorDraftbeerCanSmall} />
              <Line label="Competitor Draftbeer Can Big" value={item.competitorDraftBeerCanBig ?? item.competitorDraftbeerCanBig} />
              <Line label="Competitor Draftbeer Promo Description" value={item.competitorDraftBeerPromoDescription ?? item.competitorDraftbeerPromoDescription} />
              <Line label="Competitor Draftbeer Promo Sold" value={item.competitorDraftBeerPromoSold ?? item.competitorDraftbeerPromoSold} />

              {/* Kura Kura */}
              <Line label="Competitor Kura Kura Available" value={item.competitorKuraKuraAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Kura Kura Glass" value={item.competitorKuraKuraGlass} />
              <Line label="Competitor Kura Kura Pint" value={item.competitorKuraKuraPint} />
              <Line label="Competitor Kura Kura Quart" value={item.competitorKuraKuraQuart} />
              <Line label="Competitor Kura Kura Can Small" value={item.competitorKuraKuraCanSmall} />
              <Line label="Competitor Kura Kura Can Big" value={item.competitorKuraKuraCanBig} />
              <Line label="Competitor Kura Kura Promo Description" value={item.competitorKuraKuraPromoDescription} />
              <Line label="Competitor Kura Kura Promo Sold" value={item.competitorKuraKuraPromoSold} />

              {/* Island Brewing */}
              <Line label="Competitor Island Brewing Available" value={item.competitorIslandBrewingAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Island Brewing Glass" value={item.competitorIslandBrewingGlass} />
              <Line label="Competitor Island Brewing Pint" value={item.competitorIslandBrewingPint} />
              <Line label="Competitor Island Brewing Quart" value={item.competitorIslandBrewingQuart} />
              <Line label="Competitor Island Brewing Can Small" value={item.competitorIslandBrewingCanSmall} />
              <Line label="Competitor Island Brewing Can Big" value={item.competitorIslandBrewingCanBig} />
              <Line label="Competitor Island Brewing Promo Description" value={item.competitorIslandBrewingPromoDescription} />
              <Line label="Competitor Island Brewing Promo Sold" value={item.competitorIslandBrewingPromoSold} />

              {/* Others */}
              <Line label="Competitor Others Available" value={item.competitorOthersAvailable ? 'Yes' : 'No'} />
              <Line label="Competitor Others Glass" value={item.competitorOthersGlass} />
              <Line label="Competitor Others Pint" value={item.competitorOthersPint} />
              <Line label="Competitor Others Quart" value={item.competitorOthersQuart} />
              <Line label="Competitor Others Can Small" value={item.competitorOthersCanSmall} />
              <Line label="Competitor Others Can Big" value={item.competitorOthersCanBig} />
              <Line label="Competitor Others Promo Description" value={item.competitorOthersPromoDescription} />
              <Line label="Competitor Others Promo Sold" value={item.competitorOthersPromoSold} />

              {/* Competitor activities summary */}
              <Line label="Competitor Activity Description" value={item.competitorActivityDescription} />
              <Line label="Competitor Activity SPG Total" value={item.competitorActivitySpgTotal} />

              <SectionTitle>Merchandise Data</SectionTitle>
              <Line label="Merchandise Description 1" value={item.merchandiseDescription1} />
              <Line label="Merchandise Sold 1" value={item.merchandiseSold1} />
              <Line label="Merchandise Description 2" value={item.merchandiseDescription2} />
              <Line label="Merchandise Sold 2" value={item.merchandiseSold2} />
              <Line label="Merchandise Description 3" value={item.merchandiseDescription3} />
              <Line label="Merchandise Sold 3" value={item.merchandiseSold3} />
              <Line label="Merchandise Description 4" value={item.merchandiseDescription4} />
              <Line label="Merchandise Sold 4" value={item.merchandiseSold4} />
              <Line label="Merchandise Description 5" value={item.merchandiseDescription5} />
              <Line label="Merchandise Sold 5" value={item.merchandiseSold5} />

              <SectionTitle>Weather Data</SectionTitle>
              <Line label="Weather Status" value={item.weatherStatus} />

              <SectionTitle>Sales Report Summary Notes and Learning</SectionTitle>
              <Line label="Issues/Notes/Requests" value={item.issuesNotesRequests} />
              <Line label="Learning Points" value={item.learningPoints} />
            </>
          )}

          <View style={styles.buttonRow}>
            {mode === 'description' && onCopyAll && (
              <Button title="Copy All" onPress={onCopyAll} />
            )}
            {mode === 'review' && userRole === 'area manager' && onDoneByAM && (
              <Button title="Done by AM" onPress={onDoneByAM} />
            )}
            <Button title="Close" onPress={onClose} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default SalesReportDetailsModal;
