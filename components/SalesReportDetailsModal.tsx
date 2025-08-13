import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useI18n } from './I18n';
import { useEffectiveScheme } from './ThemePreference';
import { palette, radius, spacing } from '@/constants/Design';

export type DetailsMode = 'review' | 'description';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: any | null;
  mode: DetailsMode;
  userRole: string | null;
  onCopyAll?: () => void;
  onDoneByAM?: () => void;
  onReviewBackToTL?: () => void;
};

const SalesReportDetailsModal: React.FC<Props> = ({
  visible,
  onClose,
  item,
  mode,
  userRole,
  onCopyAll,
  onDoneByAM,
  onReviewBackToTL,
}) => {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    overlay: 'rgba(0,0,0,0.5)',
    surface: isDark ? '#111827' : 'white',
    border: isDark ? '#1f2937' : '#e5e7eb',
    text: isDark ? '#e5e7eb' : '#111827',
    muted: isDark ? '#94a3b8' : '#6b7280',
  };

  const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <Text selectable style={{ color: colors.text, marginBottom: 4 }}>
      {label}: {value ?? '-'}
    </Text>
  );

  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Text selectable style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{children}</Text>
  );
  const handleCopyMarkdown = async () => {
    if (!item) return;
    const md = buildSalesReportText(item, 'markdown');
    await Clipboard.setStringAsync(md);
    Alert.alert(t('copied_to_clipboard') || 'Copied to clipboard');
  };

  const handleShare = async () => {
    if (!item) return;
    const text = buildSalesReportText(item, 'text');
    try {
      await Share.share({ message: text });
    } catch {}
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text selectable style={[styles.title, { color: colors.text }]}>{mode === 'review' ? (t('review_for_area_manager') || 'Review for Area Manager') : (t('description') || 'Description')}</Text>
          {!item ? (
            <Text style={{ color: colors.muted }}>{t('no_data') || 'No data'}</Text>
          ) : (
            <>
              <SectionTitle>{t('personnel_information') || 'Personnel Information'}</SectionTitle>
              <Line label={t('assigned_to_ba') || 'Assigned to BA'} value={item.assignedToBA} />
              <Line label={t('assigned_to_tl') || 'Assigned to TL'} value={item.assignedToTL} />
              <Line label={t('ba_count') || 'BA Count'} value={item.baCount} />
              <Line label={t('crew_canvasser_count') || 'Crew Canvasser Count'} value={item.crewCanvasserCount} />
              <Line label={t('team_leader_name') || 'Team Leader Name'} value={item.teamLeaderName} />
              <Line label={t('spg_name') || 'SPG Name'} value={item.spgName} />
              <Line label={t('sales_report_detail_status') || 'Sales Report Detail Status'} value={item.salesReportDetailStatus} />
              <Line label={t('created_at') || 'Created At'} value={item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : item.createdAt} />
              <Line label={t('created_by') || 'Created By'} value={item.createdBy} />
              <Line label={t('task_id') || 'Task ID'} value={item.tasksId} />

              <SectionTitle>{t('outlet_information') || 'Outlet Information'}</SectionTitle>
              <Line label={t('outlet_id') || 'Outlet ID'} value={item.outletId} />
              <Line label={t('outlet_name') || 'Outlet Name'} value={item.outletName} />
              <Line label={t('province') || 'Province'} value={item.outletProvince} />
              <Line label={t('city') || 'City'} value={item.outletCity} />
              <Line label={t('activity_name') || 'Activity Name'} value={item.activityName} />
              <Line label={t('outlet_venue_name') || 'Outlet Venue Name'} value={item.outletVenueName} />
              <Line label={t('capacity') || 'Capacity'} value={item.outletCapacity} />
              <Line label={t('tables_available') || 'Outlet No. of Table Available'} value={item.outletNoOfTableAVailable} />
              <Line label={t('outlet_event_pic') || 'Outlet Event PIC'} value={item.outletEventPic} />

              <SectionTitle>{t('guinness_selling_data') || 'Guinness Selling Data'}</SectionTitle>
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

              <SectionTitle>{t('sampling_data') || 'Sampling Data'}</SectionTitle>
              <Line label={t('sampling_available') || 'Sampling available'} value={(item.samplingDataAvailable ?? item.samplingAvailable) ? t('yes') || 'Yes' : t('no') || 'No'} />
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

              <SectionTitle>{t('call_and_customer_data') || 'Call and Customer Data'}</SectionTitle>
              <Line label="Calls Offers" value={item.callsOffers} />
              <Line label="Effective Calls" value={item.effectiveCalls} />
              <Line label="Calls vs Effective Percentage" value={item.callsVsEffectivePercentage} />

              <SectionTitle>{t('selling_data_aggregates') || 'Selling Data (Aggregates)'}</SectionTitle>
              <Line label="Sales Smooth Can" value={item.salesSmoothCan} />
              <Line label="Sales Smooth Bottle" value={item.salesSmoothBotol} />
              <Line label="Sales GFES Can" value={item.salesGfesCan} />
              <Line label="Sales GFES Can Big" value={item.salesGfesCanBig} />
              <Line label="Sales GFES Bottle" value={item.salesGfesBotol} />
              <Line label="Sales GFES Quart" value={item.salesGfesQuart} />
              <Line label="Sales Kegs" value={item.salesKegs} />
              <Line label="Sales Microdraught" value={item.salesMd} />
              <Line label="Sales GDIC" value={item.salesGdic} />

              <SectionTitle>{t('guinness_promotional_activities') || 'Guinness Promotional Activities'}</SectionTitle>
              <Line label="Guinness Smooth Promotion Available" value={item.guinnessSmoothPromotionAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Promo Smooth Description" value={item.promoSmoothDescription} />
              <Line label="Promo Smooth Sold" value={item.promoSmoothSold} />
              <Line label="Promo Smooth Repeat Orders" value={item.promoSmoothRepeatOrders ?? item.promoSmoothRepeatOrder} />
              <Line label="Promo Smooth Description - Type 2" value={item.promoSmoothDescriptionType2} />
              <Line label="Promo Smooth Sold - Type 2" value={item.promoSmoothSoldType2} />
              <Line label="Promo Smooth Repeat Orders - Type 2" value={item.promoSmoothRepeatOrdersType2 ?? item.promoSmoothRepeatOrderType2} />

              <Line label="Guinness Gfes Promotion Available" value={item.guinnessGfesPromotionAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Promo Gfes Description" value={item.promoGfesDescription} />
              <Line label="Promo Gfes Sold" value={item.promoGfesSold} />
              <Line label="Promo Gfes Repeat Orders" value={item.promoGfesRepeatOrders ?? item.promoGfesRepeatOrder} />
              <Line label="Promo Gfes Description - Type 2" value={item.promoGfesDescriptionType2} />
              <Line label="Promo Gfes Sold - Type 2" value={item.promoGfesSoldType2} />
              <Line label="Promo Gfes Repeat Orders - Type 2" value={item.promoGfesRepeatOrdersType2 ?? item.promoGfesRepeatOrderType2} />

              <Line label="Guinness Kegs Promotion Available" value={item.guinnessKegsPromotionAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Promo Kegs Description" value={item.promoKegsDescription} />
              <Line label="Promo Kegs Sold" value={item.promoKegsSold} />
              <Line label="Promo Kegs Repeat Orders" value={item.promoKegsRepeatOrders ?? item.promoKegsRepeatOrder} />
              <Line label="Promo Kegs Description - Type 2" value={item.promoKegsDescriptionType2} />
              <Line label="Promo Kegs Sold - Type 2" value={item.promoKegsSoldType2} />
              <Line label="Promo Kegs Repeat Orders - Type 2" value={item.promoKegsRepeatOrdersType2 ?? item.promoKegsRepeatOrderType2} />

              <Line label="Guinness Microdraught Promotion Available" value={item.guinnessMicroDraughtPromotionAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Promo Microdraught Description" value={item.promoMicrodraughtDescription} />
              <Line label="Promo Microdraught Sold" value={item.promoMicrodraughtSold} />
              <Line label="Promo Microdraught Repeat Orders" value={item.promoMicrodraughtRepeatOrders ?? item.promoMicrodraughtRepeatOrder} />
              <Line label="Promo Microdraught Description - Type 2" value={item.promoMicrodraughtDescriptionType2} />
              <Line label="Promo Microdraught Sold - Type 2" value={item.promoMicrodraughtSoldType2} />
              <Line label="Promo Microdraught Repeat Orders - Type 2" value={item.promoMicrodraughtRepeatOrdersType2 ?? item.promoMicrodraughtRepeatOrderType2} />

              <Line label="Guinness Gdic Promotion Available" value={item.guinnessGdicPromotionAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Promo Gdic Description" value={item.promoGdicDescription} />
              <Line label="Promo Gdic Sold" value={item.promoGdicSold} />
              <Line label="Promo Gdic Repeat Orders" value={item.promoGdicRepeatOrders ?? item.promoGdicRepeatOrder} />
              <Line label="Promo Gdic Description - Type 2" value={item.promoGdicDescriptionType2} />
              <Line label="Promo Gdic Sold - Type 2" value={item.promoGdicSoldType2} />
              <Line label="Promo Gdic Repeat Orders - Type 2" value={item.promoGdicRepeatOrdersType2 ?? item.promoGdicRepeatOrderType2} />

              {/* Generic promo rollups */}
              <Line label="Packages Sold (All)" value={item.packagesSold} />
              <Line label="Repeat Orders (All)" value={item.repeatOrders} />

              <SectionTitle>{t('visitor_consumer_data') || 'Visitor and Consumer Data'}</SectionTitle>
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

              <SectionTitle>{t('tables_data') || 'Tables Data'}</SectionTitle>
              <Line label="Tables Overall" value={item.tablesOverall} />
              <Line label="Tables Alcohol Drinkers" value={item.tablesAlcoholDrinkers} />
              <Line label="Tables Non Alcohol Drinkers" value={item.tablesNonAlcoholDrinkers} />
              <Line label="Tables All Beer Drinkers" value={item.tablesAllBeerDrinkers} />
              <Line label="Tables All Guinness" value={item.tablesAllGuinness} />
              <Line label="Tables All Competitor" value={item.tablesAllCompetitor} />
              <Line label="Tables All Guinness Mixed Competitor" value={item.tablesAllGuinnessMixedCompetitor} />

              <SectionTitle>{t('competitor_sales') || 'Competitor Sales'}</SectionTitle>
              {/* Bintang */}
              <Line label="Competitor Bintang Available" value={item.competitorBintangAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Bintang Glass" value={item.competitorBintangGlass} />
              <Line label="Competitor Bintang Pint" value={item.competitorBintangPint} />
              <Line label="Competitor Bintang Quart" value={item.competitorBintangQuart} />
              <Line label="Competitor Bintang Can Small" value={item.competitorBintangCanSmall} />
              <Line label="Competitor Bintang Can Big" value={item.competitorBintangCanBig} />
              <Line label="Competitor Bintang Promo Description" value={item.competitorBintangPromoDescription} />
              <Line label="Competitor Bintang Promo Sold" value={item.competitorBintangPromoSold} />

              {/* Bintang Crystal */}
              <Line label="Competitor Bintang Crystal Available" value={item.competitorBintangCrystalAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Bintang Crystal Glass" value={item.competitorBintangCrystalGlass} />
              <Line label="Competitor Bintang Crystal Pint" value={item.competitorBintangCrystalPint} />
              <Line label="Competitor Bintang Crystal Quart" value={item.competitorBintangCrystalQuart} />
              <Line label="Competitor Bintang Crystal Can Small" value={item.competitorBintangCrystalCanSmall} />
              <Line label="Competitor Bintang Crystal Can Big" value={item.competitorBintangCrystalCanBig} />
              <Line label="Competitor Bintang Crystal Promo Description" value={item.competitorBintangCrystalPromoDescription} />
              <Line label="Competitor Bintang Crystal Promo Sold" value={item.competitorBintangCrystalPromoSold} />

              {/* Heineken */}
              <Line label="Competitor Heineken Available" value={item.competitorHeinekenAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Heineken Glass" value={item.competitorHeinekenGlass} />
              <Line label="Competitor Heineken Pint" value={item.competitorHeinekenPint} />
              <Line label="Competitor Heineken Quart" value={item.competitorHeinekenQuart} />
              <Line label="Competitor Heineken Can Small" value={item.competitorHeinekenCanSmall} />
              <Line label="Competitor Heineken Can Big" value={item.competitorHeinekenCanBig} />
              <Line label="Competitor Heineken Promo Description" value={item.competitorHeinekenPromoDescription} />
              <Line label="Competitor Heineken Promo Sold" value={item.competitorHeinekenPromoSold} />

              {/* Heineken Import */}
              <Line label="Competitor Heineken Import Available" value={item.competitorHeinekenImportAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Heineken Import Glass" value={item.competitorHeinekenImportGlass} />
              <Line label="Competitor Heineken Import Pint" value={item.competitorHeinekenImportPint} />
              <Line label="Competitor Heineken Import Quart" value={item.competitorHeinekenImportQuart} />
              <Line label="Competitor Heineken Import Can Small" value={item.competitorHeinekenImportCanSmall} />
              <Line label="Competitor Heineken Import Can Big" value={item.competitorHeinekenImportCanBig} />
              <Line label="Competitor Heineken Import Promo Description" value={item.competitorHeinekenImportPromoDescription} />
              <Line label="Competitor Heineken Import Promo Sold" value={item.competitorHeinekenImportPromoSold} />

              {/* Erdinger Import */}
              <Line label="Competitor Erdinger Import Available" value={item.competitorErdingerImportAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Erdinger Import Glass" value={item.competitorErdingerImportGlass} />
              <Line label="Competitor Erdinger Import Pint" value={item.competitorErdingerImportPint} />
              <Line label="Competitor Erdinger Import Quart" value={item.competitorErdingerImportQuart} />
              <Line label="Competitor Erdinger Import Can Small" value={item.competitorErdingerImportCanSmall} />
              <Line label="Competitor Erdinger Import Can Big" value={item.competitorErdingerImportCanBig} />
              <Line label="Competitor Erdinger Import Promo Description" value={item.competitorErdingerImportPromoDescription} />
              <Line label="Competitor Erdinger Import Promo Sold" value={item.competitorErdingerImportPromoSold} />

              {/* Budweizer Import */}
              <Line label="Competitor Budweizer Import Available" value={item.competitorBudweizerImportAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Budweizer Import Glass" value={item.competitorBudweizerImportGlass} />
              <Line label="Competitor Budweizer Import Pint" value={item.competitorBudweizerImportPint} />
              <Line label="Competitor Budweizer Import Quart" value={item.competitorBudweizerImportQuart} />
              <Line label="Competitor Budweizer Import Can Small" value={item.competitorBudweizerImportCanSmall} />
              <Line label="Competitor Budweizer Import Can Big" value={item.competitorBudweizerImportCanBig} />
              <Line label="Competitor Budweizer Import Promo Description" value={item.competitorBudweizerImportPromoDescription} />
              <Line label="Competitor Budweizer Import Promo Sold" value={item.competitorBudweizerImportPromoSold} />

              {/* Anker */}
              <Line label="Competitor Anker Available" value={item.competitorAnkerAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Anker Glass" value={item.competitorAnkerGlass} />
              <Line label="Competitor Anker Pint" value={item.competitorAnkerPint} />
              <Line label="Competitor Anker Quart" value={item.competitorAnkerQuart} />
              <Line label="Competitor Anker Can Small" value={item.competitorAnkerCanSmall} />
              <Line label="Competitor Anker Can Big" value={item.competitorAnkerCanBig} />
              <Line label="Competitor Anker Promo Description" value={item.competitorAnkerPromoDescription} />
              <Line label="Competitor Anker Promo Sold" value={item.competitorAnkerPromoSold} />

              {/* Bali Hai */}
              <Line label="Competitor Bali Hai Available" value={item.competitorBalihaiAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Bali Hai Glass" value={item.competitorBalihaiGlass} />
              <Line label="Competitor Bali Hai Pint" value={item.competitorBalihaiPint} />
              <Line label="Competitor Bali Hai Quart" value={item.competitorBalihaiQuart} />
              <Line label="Competitor Bali Hai Can Small" value={item.competitorBalihaiCanSmall} />
              <Line label="Competitor Bali Hai Can Big" value={item.competitorBalihaiCanBig} />
              <Line label="Competitor Bali Hai Promo Description" value={item.competitorBalihaiPromoDescription} />
              <Line label="Competitor Bali Hai Promo Sold" value={item.competitorBalihaiPromoSold} />

              {/* Prost */}
              <Line label="Competitor Prost Available" value={item.competitorProstAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Prost Glass" value={item.competitorProstGlass} />
              <Line label="Competitor Prost Pint" value={item.competitorProstPint} />
              <Line label="Competitor Prost Quart" value={item.competitorProstQuart} />
              <Line label="Competitor Prost Can Small" value={item.competitorProstCanSmall} />
              <Line label="Competitor Prost Can Big" value={item.competitorProstCanBig} />
              <Line label="Competitor Prost Promo Description" value={item.competitorProstPromoDescription} />
              <Line label="Competitor Prost Promo Sold" value={item.competitorProstPromoSold} />

              {/* San Miguel */}
              <Line label="Competitor San Miguel Available" value={item.competitorSanMiguelAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor San Miguel Glass" value={item.competitorSanMiguelGlass} />
              <Line label="Competitor San Miguel Pint" value={item.competitorSanMiguelPint} />
              <Line label="Competitor San Miguel Quart" value={item.competitorSanMiguelQuart} />
              <Line label="Competitor San Miguel Can Small" value={item.competitorSanMiguelCanSmall} />
              <Line label="Competitor San Miguel Can Big" value={item.competitorSanMiguelCanBig} />
              <Line label="Competitor San Miguel Promo Description" value={item.competitorSanMiguelPromoDescription} />
              <Line label="Competitor San Miguel Promo Sold" value={item.competitorSanMiguelPromoSold} />

              {/* Singaraja */}
              <Line label="Competitor Singaraja Available" value={item.competitorSingarajaAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Singaraja Glass" value={item.competitorSingarajaGlass} />
              <Line label="Competitor Singaraja Pint" value={item.competitorSingarajaPint} />
              <Line label="Competitor Singaraja Quart" value={item.competitorSingarajaQuart} />
              <Line label="Competitor Singaraja Can Small" value={item.competitorSingarajaCanSmall} />
              <Line label="Competitor Singaraja Can Big" value={item.competitorSingarajaCanBig} />

              {/* Carlsberg */}
              <Line label="Competitor Carlsberg Available" value={item.competitorCarlsbergAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Carlsberg Glass" value={item.competitorCarlsbergGlass} />
              <Line label="Competitor Carlsberg Pint" value={item.competitorCarlsbergPint} />
              <Line label="Competitor Carlsberg Quart" value={item.competitorCarlsbergQuart} />
              <Line label="Competitor Carlsberg Can Small" value={item.competitorCarlsbergCanSmall} />
              <Line label="Competitor Carlsberg Can Big" value={item.competitorCarlsbergCanBig} />
              <Line label="Competitor Carlsberg Promo Description" value={item.competitorCarlsbergPromoDescription} />
              <Line label="Competitor Carlsberg Promo Sold" value={item.competitorCarlsbergPromoSold} />

              {/* Draft Beer */}
              <Line label="Competitor Draftbeer Available" value={(item.competitorDraftBeerAvailable ?? item.competitorDraftbeerAvailable) ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Draftbeer Glass" value={item.competitorDraftBeerGlass ?? item.competitorDraftbeerGlass} />
              <Line label="Competitor Draftbeer Pint" value={item.competitorDraftBeerPint ?? item.competitorDraftbeerPint} />
              <Line label="Competitor Draftbeer Quart" value={item.competitorDraftBeerQuart ?? item.competitorDraftbeerQuart} />
              <Line label="Competitor Draftbeer Can Small" value={item.competitorDraftBeerCanSmall ?? item.competitorDraftbeerCanSmall} />
              <Line label="Competitor Draftbeer Can Big" value={item.competitorDraftBeerCanBig ?? item.competitorDraftbeerCanBig} />
              <Line label="Competitor Draftbeer Promo Description" value={item.competitorDraftBeerPromoDescription ?? item.competitorDraftbeerPromoDescription} />
              <Line label="Competitor Draftbeer Promo Sold" value={item.competitorDraftBeerPromoSold ?? item.competitorDraftbeerPromoSold} />

              {/* Kura Kura */}
              <Line label="Competitor Kura Kura Available" value={item.competitorKuraKuraAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Kura Kura Glass" value={item.competitorKuraKuraGlass} />
              <Line label="Competitor Kura Kura Pint" value={item.competitorKuraKuraPint} />
              <Line label="Competitor Kura Kura Quart" value={item.competitorKuraKuraQuart} />
              <Line label="Competitor Kura Kura Can Small" value={item.competitorKuraKuraCanSmall} />
              <Line label="Competitor Kura Kura Can Big" value={item.competitorKuraKuraCanBig} />
              <Line label="Competitor Kura Kura Promo Description" value={item.competitorKuraKuraPromoDescription} />
              <Line label="Competitor Kura Kura Promo Sold" value={item.competitorKuraKuraPromoSold} />

              {/* Island Brewing */}
              <Line label="Competitor Island Brewing Available" value={item.competitorIslandBrewingAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Island Brewing Glass" value={item.competitorIslandBrewingGlass} />
              <Line label="Competitor Island Brewing Pint" value={item.competitorIslandBrewingPint} />
              <Line label="Competitor Island Brewing Quart" value={item.competitorIslandBrewingQuart} />
              <Line label="Competitor Island Brewing Can Small" value={item.competitorIslandBrewingCanSmall} />
              <Line label="Competitor Island Brewing Can Big" value={item.competitorIslandBrewingCanBig} />
              <Line label="Competitor Island Brewing Promo Description" value={item.competitorIslandBrewingPromoDescription} />
              <Line label="Competitor Island Brewing Promo Sold" value={item.competitorIslandBrewingPromoSold} />

              {/* Others */}
              <Line label="Competitor Others Available" value={item.competitorOthersAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Competitor Others Glass" value={item.competitorOthersGlass} />
              <Line label="Competitor Others Pint" value={item.competitorOthersPint} />
              <Line label="Competitor Others Quart" value={item.competitorOthersQuart} />
              <Line label="Competitor Others Can Small" value={item.competitorOthersCanSmall} />
              <Line label="Competitor Others Can Big" value={item.competitorOthersCanBig} />
              <Line label="Competitor Others Promo Description" value={item.competitorOthersPromoDescription} />
              <Line label="Competitor Others Promo Sold" value={item.competitorOthersPromoSold} />

              {/* Competitor activities summary */}
              <Line label={t('competitor_activity_description') || 'Competitor Activity Description'} value={item.competitorActivityDescription} />
              <Line label={t('competitor_activity_spg_total') || 'Competitor Activity SPG Total'} value={item.competitorActivitySpgTotal} />

              <SectionTitle>{t('merchandise_data') || 'Merchandise Data'}</SectionTitle>
              <Line label="Merchandise Available" value={item.merchandiseAvailable ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Merchandise Distributed" value={item.merchandiseDistributed} />
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

              <SectionTitle>{t('weather_data') || 'Weather Data'}</SectionTitle>
              <Line label="Weather Status" value={item.weatherStatus} />

              <SectionTitle>{t('programs_digital_activity') || 'Programs and Digital Activity'}</SectionTitle>
              {/* Stoutie */}
              <Line label="Stoutie Program Participation" value={(item.stoutieProgramParticipation ?? item.stoutieprogramParticipation) ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Stoutie Program Description" value={item.stoutieProgramDescription} />
              <Line label="Stoutie Program Call Reach" value={item.stoutieProgramCallReach} />
              <Line label="Stoutie Program Packet Sold" value={item.stoutieProgramPacketSold} />
              <Line label="Stoutie Program Engage People" value={item.stoutieProgramEngagePeople} />
              {/* Loyalty */}
              <Line label="Loyalty Program Participation" value={item.loyaltyProgramParticipation ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Loyalty Program Description" value={item.loyaltyProgramDescription} />
              <Line label="Loyalty Program Call Reach" value={item.loyaltyProgramCallReach} />
              <Line label="Loyalty Program Packet Sold" value={item.loyaltyProgramPacketSold} />
              <Line label="Loyalty Program Engage People" value={item.loyaltyProgramEngagePeople} />
              {/* Brightball */}
              <Line label="Brightball Participation" value={item.brightballParticipation ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Brightball Description" value={item.brightballDescription} />
              <Line label="Brightball Call Reach" value={item.brightballCallReach} />
              <Line label="Brightball Packet Sold" value={item.brightballPacketSold} />
              <Line label="Brightball Engage People" value={item.brightballEngagePeople} />
              {/* SOV */}
              <Line label="SOV Program Participation" value={item.sovProgramParticipation ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="SOV Program Description" value={item.sovProgramDescription} />
              <Line label="SOV Program Call Reach" value={item.sovProgramCallReach} />
              <Line label="SOV Program Packet Sold" value={item.sovProgramPacketSold} />
              <Line label="SOV Program Engage People" value={item.sovProgramEngagePeople} />

              <SectionTitle>{t('bali_specific_data') || 'Bali Specific Data'}</SectionTitle>
              <Line label="Bali Specific Visitor Data" value={item.baliSpecificVisitorData ? (t('yes') || 'Yes') : (t('no') || 'No')} />
              <Line label="Bali Local Visitors" value={item.baliLocalVisitors} />
              <Line label="Bali Foreign Visitors" value={item.baliForeignVisitors} />
              <Line label="Bali Local Guinness Buyers" value={item.baliLocalGuinnessBuyers} />
              <Line label="Bali Foreign Guinness Buyers" value={item.baliForeignGuinnessBuyers} />

              <SectionTitle>{t('ams_data') || 'AMS Data'}</SectionTitle>
              <Line label="AMS GFES" value={item.amsGfes} />
              <Line label="AMS Smooth" value={item.amsSmooth} />
              <Line label="AMS Microdraught" value={item.amsMicrodraught} />
              <Line label="AMS Kegs" value={item.amsKegs} />
              <Line label="AMS Total" value={item.amsTotal} />

              <SectionTitle>{t('srd_summary_notes_learning') || 'Sales Report Summary Notes and Learning'}</SectionTitle>
              <Line label="Issues/Notes/Requests" value={item.issuesNotesRequests} />
              <Line label="Learning Points" value={item.learningPoints} />
              <Line label="Beer Market Size" value={item.beerMarketSize} />
              <Line label="Total Guinness Sales" value={item.totalGuinnessSales} />
              <Line label="Achievement Percentage" value={item.achievementPercentage} />
            </>
          )}

          <View style={styles.buttonRow}>
            {mode === 'description' && onCopyAll && (
              <Button title={t('copy_all') || 'Copy All'} onPress={onCopyAll} />
            )}
            {mode === 'description' && item && (
              <Button title={t('copy_md') || 'Copy MD'} onPress={handleCopyMarkdown} />
            )}
            {mode === 'description' && item && (
              <Button title={t('share') || 'Share'} onPress={handleShare} />
            )}
            {mode === 'review' && userRole === 'area manager' && (
              <>
                {onDoneByAM && <Button title={t('done_by_am') || 'Done by AM'} onPress={onDoneByAM} />} 
                {onReviewBackToTL && <Button title={t('review_back_to_tl') || 'Review back to TL'} onPress={onReviewBackToTL} />}
              </>
            )}
            <Button title={t('close') || 'Close'} onPress={onClose} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '92%', padding: spacing(5), borderRadius: radius.xl, marginVertical: spacing(8), borderWidth: 1 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: spacing(3), textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: spacing(3), marginBottom: spacing(1.5), borderTopWidth: 1, paddingTop: spacing(2) },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default SalesReportDetailsModal;

// Centralized builder for "Copy All" text. Matches the fields shown above.
export function buildSalesReportText(
  item: any,
  format: 'text' | 'markdown' = 'text'
): string {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (title: string) => (isMD ? `\n## ${title}\n` : `\n${title}\n`);
  const line = (label: string, value: any) => `${label}: ${formatValue(value)}`;
  const lines: string[] = [];

  // Personnel Information
  lines.push(h('Personnel Information'));
  lines.push(line('Assigned to BA', item.assignedToBA));
  lines.push(line('Assigned to TL', item.assignedToTL));
  lines.push(line('BA Count', item.baCount));
  lines.push(line('Crew Canvasser Count', item.crewCanvasserCount));
  lines.push(line('Team Leader Name', item.teamLeaderName));
  lines.push(line('SPG Name', item.spgName));
  lines.push(line('Sales Report Detail Status', item.salesReportDetailStatus));
  lines.push(line('Created At', tsToLocale(item.createdAt)));
  lines.push(line('Created By', item.createdBy));
  lines.push(line('Task ID', item.tasksId));

  // Outlet Information
  lines.push(h('Outlet Information'));
  lines.push(line('Outlet ID', item.outletId));
  lines.push(line('Outlet Name', item.outletName));
  lines.push(line('Province', item.outletProvince));
  lines.push(line('City', item.outletCity));
  lines.push(line('Activity Name', item.activityName));
  lines.push(line('Outlet Venue Name', item.outletVenueName));
  lines.push(line('Capacity', item.outletCapacity));
  lines.push(line('Outlet No. of Table Available', item.outletNoOfTableAVailable));
  lines.push(line('Outlet Event PIC', item.outletEventPic));

  // Guinness Selling Data
  lines.push(h('Guinness Selling Data'));
  lines.push(line('Sales Kegs 330ml', item.salesKegs330));
  lines.push(line('Sales Kegs 500ml', item.salesKegs500));
  lines.push(line('Sales MD 500ml', item.salesMd500));
  lines.push(line('Sales Gdic 400ml', item.salesGdic400));
  lines.push(line('Sales Smooth Pint 330ml', item.salesSmoothPint330));
  lines.push(line('Sales Smooth Can 330ml', item.salesSmoothCan330));
  lines.push(line('Sales Gfes Pint 330ml', item.salesGfesPint330));
  lines.push(line('Sales Gfes Can 330ml', item.salesGfesCan330));
  lines.push(line('Sales Gfes Quart 620ml', item.salesGfesQuart620));
  lines.push(line('Sales Gfes Can Big 500ml', item.salesGfesCanbig500));

  // Sampling Data
  lines.push(h('Sampling Data'));
  lines.push(line('Sampling available', yn(item.samplingDataAvailable ?? item.samplingAvailable)));
  lines.push(line('Sampling Smooth Bottle', item.samplingSmoothBottle));
  lines.push(line('Sampling Smooth On Lips', item.samplingSmoothOnLips));
  lines.push(line('Sampling Smooth Bottle To Buy', item.samplingSmoothBottleToBuy));
  lines.push(line('Sampling Gfes Bottle', item.samplingGfesBottle));
  lines.push(line('Sampling Gfes On Lips', item.samplingGfesOnLips));
  lines.push(line('Sampling Gfes To Buy', item.samplingGfesToBuy));
  lines.push(line('Sampling Kegs', item.samplingKegs));
  lines.push(line('Sampling Kegs On Lips', item.samplingKegsOnLips));
  lines.push(line('Sampling Kegs To Buy', item.samplingKegsToBuy));
  lines.push(line('Sampling Md', item.samplingMd));
  lines.push(line('Sampling Md On Lips', item.samplingMdOnLips));
  lines.push(line('Sampling Md To Buy', item.samplingMdToBuy));
  lines.push(line('Sampling Gdic', item.samplingGdic));
  lines.push(line('Sampling Gdic On Lips', item.samplingGdicOnLips));
  lines.push(line('Sampling Gdic Bottle To Buy', item.samplingGdicBottleToBuy));

  // Call and Customer Data
  lines.push(h('Call and Customer Data'));
  lines.push(line('Calls Offers', item.callsOffers));
  lines.push(line('Effective Calls', item.effectiveCalls));
  lines.push(line('Calls vs Effective Percentage', item.callsVsEffectivePercentage));

  // Selling Data (Aggregates)
  lines.push(h('Selling Data (Aggregates)'));
  lines.push(line('Sales Smooth Can', item.salesSmoothCan));
  lines.push(line('Sales Smooth Bottle', item.salesSmoothBotol));
  lines.push(line('Sales GFES Can', item.salesGfesCan));
  lines.push(line('Sales GFES Can Big', item.salesGfesCanBig));
  lines.push(line('Sales GFES Bottle', item.salesGfesBotol));
  lines.push(line('Sales GFES Quart', item.salesGfesQuart));
  lines.push(line('Sales Kegs', item.salesKegs));
  lines.push(line('Sales Microdraught', item.salesMd));
  lines.push(line('Sales GDIC', item.salesGdic));

  // Promotional Activities
  lines.push(h('Guinness Promotional Activities'));
  // Smooth
  lines.push(line('Guinness Smooth Promotion Available', yn(item.guinnessSmoothPromotionAvailable)));
  lines.push(line('Promo Smooth Description', item.promoSmoothDescription));
  lines.push(line('Promo Smooth Sold', item.promoSmoothSold));
  lines.push(line('Promo Smooth Repeat Orders', item.promoSmoothRepeatOrders ?? item.promoSmoothRepeatOrder));
  lines.push(line('Promo Smooth Description - Type 2', item.promoSmoothDescriptionType2));
  lines.push(line('Promo Smooth Sold - Type 2', item.promoSmoothSoldType2));
  lines.push(line('Promo Smooth Repeat Orders - Type 2', item.promoSmoothRepeatOrdersType2 ?? item.promoSmoothRepeatOrderType2));
  // GFES
  lines.push(line('Guinness Gfes Promotion Available', yn(item.guinnessGfesPromotionAvailable)));
  lines.push(line('Promo Gfes Description', item.promoGfesDescription));
  lines.push(line('Promo Gfes Sold', item.promoGfesSold));
  lines.push(line('Promo Gfes Repeat Orders', item.promoGfesRepeatOrders ?? item.promoGfesRepeatOrder));
  lines.push(line('Promo Gfes Description - Type 2', item.promoGfesDescriptionType2));
  lines.push(line('Promo Gfes Sold - Type 2', item.promoGfesSoldType2));
  lines.push(line('Promo Gfes Repeat Orders - Type 2', item.promoGfesRepeatOrdersType2 ?? item.promoGfesRepeatOrderType2));
  // Kegs
  lines.push(line('Guinness Kegs Promotion Available', yn(item.guinnessKegsPromotionAvailable)));
  lines.push(line('Promo Kegs Description', item.promoKegsDescription));
  lines.push(line('Promo Kegs Sold', item.promoKegsSold));
  lines.push(line('Promo Kegs Repeat Orders', item.promoKegsRepeatOrders ?? item.promoKegsRepeatOrder));
  lines.push(line('Promo Kegs Description - Type 2', item.promoKegsDescriptionType2));
  lines.push(line('Promo Kegs Sold - Type 2', item.promoKegsSoldType2));
  lines.push(line('Promo Kegs Repeat Orders - Type 2', item.promoKegsRepeatOrdersType2 ?? item.promoKegsRepeatOrderType2));
  // Microdraught
  lines.push(line('Guinness Microdraught Promotion Available', yn(item.guinnessMicroDraughtPromotionAvailable)));
  lines.push(line('Promo Microdraught Description', item.promoMicrodraughtDescription));
  lines.push(line('Promo Microdraught Sold', item.promoMicrodraughtSold));
  lines.push(line('Promo Microdraught Repeat Orders', item.promoMicrodraughtRepeatOrders ?? item.promoMicrodraughtRepeatOrder));
  lines.push(line('Promo Microdraught Description - Type 2', item.promoMicrodraughtDescriptionType2));
  lines.push(line('Promo Microdraught Sold - Type 2', item.promoMicrodraughtSoldType2));
  lines.push(line('Promo Microdraught Repeat Orders - Type 2', item.promoMicrodraughtRepeatOrdersType2 ?? item.promoMicrodraughtRepeatOrderType2));
  // GDIC
  lines.push(line('Guinness Gdic Promotion Available', yn(item.guinnessGdicPromotionAvailable)));
  lines.push(line('Promo Gdic Description', item.promoGdicDescription));
  lines.push(line('Promo Gdic Sold', item.promoGdicSold));
  lines.push(line('Promo Gdic Repeat Orders', item.promoGdicRepeatOrders ?? item.promoGdicRepeatOrder));
  lines.push(line('Promo Gdic Description - Type 2', item.promoGdicDescriptionType2));
  lines.push(line('Promo Gdic Sold - Type 2', item.promoGdicSoldType2));
  lines.push(line('Promo Gdic Repeat Orders - Type 2', item.promoGdicRepeatOrdersType2 ?? item.promoGdicRepeatOrderType2));

  // Generic promo rollups
  lines.push(line('Packages Sold (All)', item.packagesSold));
  lines.push(line('Repeat Orders (All)', item.repeatOrders));

  // Visitor and Consumer Data
  lines.push(h('Visitor and Consumer Data'));
  lines.push(line('Visitors Overall', item.visitorsOverall));
  lines.push(line('Visitors Alcohol Drinkers', item.visitorsAlcoholDrinkers));
  lines.push(line('Visitors All Beer Drinkers', item.visitorsAllBeerDrinkers));
  lines.push(line('Visitors All Guinness', item.visitorsAllGuinness));
  lines.push(line('Visitors All Competitor', item.visitorsAllCompetitor));
  lines.push(line('Visitors All Guinness Mixed Competitor', item.visitorsAllGuinnessMixedCompetitor));
  lines.push(line('Drinkers Smooth', item.drinkersSmooth));
  lines.push(line('Drinkers Gfes', item.drinkersGfes));
  lines.push(line('Drinkers Kegs', item.drinkersKegs));
  lines.push(line('Drinkers Microdraught', item.drinkersMicrodraught));
  lines.push(line('Drinkers Gdic', item.drinkersGdic));
  lines.push(line('Drinkers Mixed', item.drinkersMixed));

  // Tables Data
  lines.push(h('Tables Data'));
  lines.push(line('Tables Overall', item.tablesOverall));
  lines.push(line('Tables Alcohol Drinkers', item.tablesAlcoholDrinkers));
  lines.push(line('Tables Non Alcohol Drinkers', item.tablesNonAlcoholDrinkers));
  lines.push(line('Tables All Beer Drinkers', item.tablesAllBeerDrinkers));
  lines.push(line('Tables All Guinness', item.tablesAllGuinness));
  lines.push(line('Tables All Competitor', item.tablesAllCompetitor));
  lines.push(line('Tables All Guinness Mixed Competitor', item.tablesAllGuinnessMixedCompetitor));

  // Competitor Sales (with key variants for Draft Beer)
  lines.push(h('Competitor Sales'));
  // Bintang
  lines.push(line('Competitor Bintang Available', yn(item.competitorBintangAvailable)));
  lines.push(line('Competitor Bintang Glass', item.competitorBintangGlass));
  lines.push(line('Competitor Bintang Pint', item.competitorBintangPint));
  lines.push(line('Competitor Bintang Quart', item.competitorBintangQuart));
  lines.push(line('Competitor Bintang Can Small', item.competitorBintangCanSmall));
  lines.push(line('Competitor Bintang Can Big', item.competitorBintangCanBig));
  lines.push(line('Competitor Bintang Promo Description', item.competitorBintangPromoDescription));
  lines.push(line('Competitor Bintang Promo Sold', item.competitorBintangPromoSold));
  // Bintang Crystal
  lines.push(line('Competitor Bintang Crystal Available', yn(item.competitorBintangCrystalAvailable)));
  lines.push(line('Competitor Bintang Crystal Glass', item.competitorBintangCrystalGlass));
  lines.push(line('Competitor Bintang Crystal Pint', item.competitorBintangCrystalPint));
  lines.push(line('Competitor Bintang Crystal Quart', item.competitorBintangCrystalQuart));
  lines.push(line('Competitor Bintang Crystal Can Small', item.competitorBintangCrystalCanSmall));
  lines.push(line('Competitor Bintang Crystal Can Big', item.competitorBintangCrystalCanBig));
  lines.push(line('Competitor Bintang Crystal Promo Description', item.competitorBintangCrystalPromoDescription));
  lines.push(line('Competitor Bintang Crystal Promo Sold', item.competitorBintangCrystalPromoSold));
  // Heineken
  lines.push(line('Competitor Heineken Available', yn(item.competitorHeinekenAvailable)));
  lines.push(line('Competitor Heineken Glass', item.competitorHeinekenGlass));
  lines.push(line('Competitor Heineken Pint', item.competitorHeinekenPint));
  lines.push(line('Competitor Heineken Quart', item.competitorHeinekenQuart));
  lines.push(line('Competitor Heineken Can Small', item.competitorHeinekenCanSmall));
  lines.push(line('Competitor Heineken Can Big', item.competitorHeinekenCanBig));
  lines.push(line('Competitor Heineken Promo Description', item.competitorHeinekenPromoDescription));
  lines.push(line('Competitor Heineken Promo Sold', item.competitorHeinekenPromoSold));
  // Heineken Import
  lines.push(line('Competitor Heineken Import Available', yn(item.competitorHeinekenImportAvailable)));
  lines.push(line('Competitor Heineken Import Glass', item.competitorHeinekenImportGlass));
  lines.push(line('Competitor Heineken Import Pint', item.competitorHeinekenImportPint));
  lines.push(line('Competitor Heineken Import Quart', item.competitorHeinekenImportQuart));
  lines.push(line('Competitor Heineken Import Can Small', item.competitorHeinekenImportCanSmall));
  lines.push(line('Competitor Heineken Import Can Big', item.competitorHeinekenImportCanBig));
  lines.push(line('Competitor Heineken Import Promo Description', item.competitorHeinekenImportPromoDescription));
  lines.push(line('Competitor Heineken Import Promo Sold', item.competitorHeinekenImportPromoSold));
  // Erdinger Import
  lines.push(line('Competitor Erdinger Import Available', yn(item.competitorErdingerImportAvailable)));
  lines.push(line('Competitor Erdinger Import Glass', item.competitorErdingerImportGlass));
  lines.push(line('Competitor Erdinger Import Pint', item.competitorErdingerImportPint));
  lines.push(line('Competitor Erdinger Import Quart', item.competitorErdingerImportQuart));
  lines.push(line('Competitor Erdinger Import Can Small', item.competitorErdingerImportCanSmall));
  lines.push(line('Competitor Erdinger Import Can Big', item.competitorErdingerImportCanBig));
  lines.push(line('Competitor Erdinger Import Promo Description', item.competitorErdingerImportPromoDescription));
  lines.push(line('Competitor Erdinger Import Promo Sold', item.competitorErdingerImportPromoSold));
  // Budweizer Import
  lines.push(line('Competitor Budweizer Import Available', yn(item.competitorBudweizerImportAvailable)));
  lines.push(line('Competitor Budweizer Import Glass', item.competitorBudweizerImportGlass));
  lines.push(line('Competitor Budweizer Import Pint', item.competitorBudweizerImportPint));
  lines.push(line('Competitor Budweizer Import Quart', item.competitorBudweizerImportQuart));
  lines.push(line('Competitor Budweizer Import Can Small', item.competitorBudweizerImportCanSmall));
  lines.push(line('Competitor Budweizer Import Can Big', item.competitorBudweizerImportCanBig));
  lines.push(line('Competitor Budweizer Import Promo Description', item.competitorBudweizerImportPromoDescription));
  lines.push(line('Competitor Budweizer Import Promo Sold', item.competitorBudweizerImportPromoSold));
  // Anker
  lines.push(line('Competitor Anker Available', yn(item.competitorAnkerAvailable)));
  lines.push(line('Competitor Anker Glass', item.competitorAnkerGlass));
  lines.push(line('Competitor Anker Pint', item.competitorAnkerPint));
  lines.push(line('Competitor Anker Quart', item.competitorAnkerQuart));
  lines.push(line('Competitor Anker Can Small', item.competitorAnkerCanSmall));
  lines.push(line('Competitor Anker Can Big', item.competitorAnkerCanBig));
  lines.push(line('Competitor Anker Promo Description', item.competitorAnkerPromoDescription));
  lines.push(line('Competitor Anker Promo Sold', item.competitorAnkerPromoSold));
  // Bali Hai
  lines.push(line('Competitor Bali Hai Available', yn(item.competitorBalihaiAvailable)));
  lines.push(line('Competitor Bali Hai Glass', item.competitorBalihaiGlass));
  lines.push(line('Competitor Bali Hai Pint', item.competitorBalihaiPint));
  lines.push(line('Competitor Bali Hai Quart', item.competitorBalihaiQuart));
  lines.push(line('Competitor Bali Hai Can Small', item.competitorBalihaiCanSmall));
  lines.push(line('Competitor Bali Hai Can Big', item.competitorBalihaiCanBig));
  lines.push(line('Competitor Bali Hai Promo Description', item.competitorBalihaiPromoDescription));
  lines.push(line('Competitor Bali Hai Promo Sold', item.competitorBalihaiPromoSold));
  // Prost
  lines.push(line('Competitor Prost Available', yn(item.competitorProstAvailable)));
  lines.push(line('Competitor Prost Glass', item.competitorProstGlass));
  lines.push(line('Competitor Prost Pint', item.competitorProstPint));
  lines.push(line('Competitor Prost Quart', item.competitorProstQuart));
  lines.push(line('Competitor Prost Can Small', item.competitorProstCanSmall));
  lines.push(line('Competitor Prost Can Big', item.competitorProstCanBig));
  lines.push(line('Competitor Prost Promo Description', item.competitorProstPromoDescription));
  lines.push(line('Competitor Prost Promo Sold', item.competitorProstPromoSold));
  // San Miguel
  lines.push(line('Competitor San Miguel Available', yn(item.competitorSanMiguelAvailable)));
  lines.push(line('Competitor San Miguel Glass', item.competitorSanMiguelGlass));
  lines.push(line('Competitor San Miguel Pint', item.competitorSanMiguelPint));
  lines.push(line('Competitor San Miguel Quart', item.competitorSanMiguelQuart));
  lines.push(line('Competitor San Miguel Can Small', item.competitorSanMiguelCanSmall));
  lines.push(line('Competitor San Miguel Can Big', item.competitorSanMiguelCanBig));
  lines.push(line('Competitor San Miguel Promo Description', item.competitorSanMiguelPromoDescription));
  lines.push(line('Competitor San Miguel Promo Sold', item.competitorSanMiguelPromoSold));
  // Singaraja
  lines.push(line('Competitor Singaraja Available', yn(item.competitorSingarajaAvailable)));
  lines.push(line('Competitor Singaraja Glass', item.competitorSingarajaGlass));
  lines.push(line('Competitor Singaraja Pint', item.competitorSingarajaPint));
  lines.push(line('Competitor Singaraja Quart', item.competitorSingarajaQuart));
  lines.push(line('Competitor Singaraja Can Small', item.competitorSingarajaCanSmall));
  lines.push(line('Competitor Singaraja Can Big', item.competitorSingarajaCanBig));
  // Carlsberg
  lines.push(line('Competitor Carlsberg Available', yn(item.competitorCarlsbergAvailable)));
  lines.push(line('Competitor Carlsberg Glass', item.competitorCarlsbergGlass));
  lines.push(line('Competitor Carlsberg Pint', item.competitorCarlsbergPint));
  lines.push(line('Competitor Carlsberg Quart', item.competitorCarlsbergQuart));
  lines.push(line('Competitor Carlsberg Can Small', item.competitorCarlsbergCanSmall));
  lines.push(line('Competitor Carlsberg Can Big', item.competitorCarlsbergCanBig));
  lines.push(line('Competitor Carlsberg Promo Description', item.competitorCarlsbergPromoDescription));
  lines.push(line('Competitor Carlsberg Promo Sold', item.competitorCarlsbergPromoSold));
  // Draftbeer (support both key styles)
  const dbAvail = item.competitorDraftBeerAvailable ?? item.competitorDraftbeerAvailable;
  const dbGlass = item.competitorDraftBeerGlass ?? item.competitorDraftbeerGlass;
  const dbPint = item.competitorDraftBeerPint ?? item.competitorDraftbeerPint;
  const dbQuart = item.competitorDraftBeerQuart ?? item.competitorDraftbeerQuart;
  const dbCanSmall = item.competitorDraftBeerCanSmall ?? item.competitorDraftbeerCanSmall;
  const dbCanBig = item.competitorDraftBeerCanBig ?? item.competitorDraftbeerCanBig;
  const dbDesc = item.competitorDraftBeerPromoDescription ?? item.competitorDraftbeerPromoDescription;
  const dbSold = item.competitorDraftBeerPromoSold ?? item.competitorDraftbeerPromoSold;
  lines.push(line('Competitor Draftbeer Available', yn(dbAvail)));
  lines.push(line('Competitor Draftbeer Glass', dbGlass));
  lines.push(line('Competitor Draftbeer Pint', dbPint));
  lines.push(line('Competitor Draftbeer Quart', dbQuart));
  lines.push(line('Competitor Draftbeer Can Small', dbCanSmall));
  lines.push(line('Competitor Draftbeer Can Big', dbCanBig));
  lines.push(line('Competitor Draftbeer Promo Description', dbDesc));
  lines.push(line('Competitor Draftbeer Promo Sold', dbSold));
  // Kura Kura
  lines.push(line('Competitor Kura Kura Available', yn(item.competitorKuraKuraAvailable)));
  lines.push(line('Competitor Kura Kura Glass', item.competitorKuraKuraGlass));
  lines.push(line('Competitor Kura Kura Pint', item.competitorKuraKuraPint));
  lines.push(line('Competitor Kura Kura Quart', item.competitorKuraKuraQuart));
  lines.push(line('Competitor Kura Kura Can Small', item.competitorKuraKuraCanSmall));
  lines.push(line('Competitor Kura Kura Can Big', item.competitorKuraKuraCanBig));
  lines.push(line('Competitor Kura Kura Promo Description', item.competitorKuraKuraPromoDescription));
  lines.push(line('Competitor Kura Kura Promo Sold', item.competitorKuraKuraPromoSold));
  // Island Brewing
  lines.push(line('Competitor Island Brewing Available', yn(item.competitorIslandBrewingAvailable)));
  lines.push(line('Competitor Island Brewing Glass', item.competitorIslandBrewingGlass));
  lines.push(line('Competitor Island Brewing Pint', item.competitorIslandBrewingPint));
  lines.push(line('Competitor Island Brewing Quart', item.competitorIslandBrewingQuart));
  lines.push(line('Competitor Island Brewing Can Small', item.competitorIslandBrewingCanSmall));
  lines.push(line('Competitor Island Brewing Can Big', item.competitorIslandBrewingCanBig));
  lines.push(line('Competitor Island Brewing Promo Description', item.competitorIslandBrewingPromoDescription));
  lines.push(line('Competitor Island Brewing Promo Sold', item.competitorIslandBrewingPromoSold));
  // Others
  lines.push(line('Competitor Others Available', yn(item.competitorOthersAvailable)));
  lines.push(line('Competitor Others Glass', item.competitorOthersGlass));
  lines.push(line('Competitor Others Pint', item.competitorOthersPint));
  lines.push(line('Competitor Others Quart', item.competitorOthersQuart));
  lines.push(line('Competitor Others Can Small', item.competitorOthersCanSmall));
  lines.push(line('Competitor Others Can Big', item.competitorOthersCanBig));
  lines.push(line('Competitor Others Promo Description', item.competitorOthersPromoDescription));
  lines.push(line('Competitor Others Promo Sold', item.competitorOthersPromoSold));
  // Competitor activity summary
  lines.push(line('Competitor Activity Description', item.competitorActivityDescription));
  lines.push(line('Competitor Activity SPG Total', item.competitorActivitySpgTotal));

  // Merchandise
  lines.push(h('Merchandise Data'));
  lines.push(line('Merchandise Available', yn(item.merchandiseAvailable)));
  lines.push(line('Merchandise Distributed', item.merchandiseDistributed));
  lines.push(line('Merchandise Description 1', item.merchandiseDescription1));
  lines.push(line('Merchandise Sold 1', item.merchandiseSold1));
  lines.push(line('Merchandise Description 2', item.merchandiseDescription2));
  lines.push(line('Merchandise Sold 2', item.merchandiseSold2));
  lines.push(line('Merchandise Description 3', item.merchandiseDescription3));
  lines.push(line('Merchandise Sold 3', item.merchandiseSold3));
  lines.push(line('Merchandise Description 4', item.merchandiseDescription4));
  lines.push(line('Merchandise Sold 4', item.merchandiseSold4));
  lines.push(line('Merchandise Description 5', item.merchandiseDescription5));
  lines.push(line('Merchandise Sold 5', item.merchandiseSold5));

  // Weather
  lines.push(h('Weather Data'));
  lines.push(line('Weather Status', item.weatherStatus));

  // Programs and Digital Activity
  lines.push(h('Programs and Digital Activity'));
  // Stoutie
  lines.push(line('Stoutie Program Participation', yn(item.stoutieProgramParticipation ?? item.stoutieprogramParticipation)));
  lines.push(line('Stoutie Program Description', item.stoutieProgramDescription));
  lines.push(line('Stoutie Program Call Reach', item.stoutieProgramCallReach));
  lines.push(line('Stoutie Program Packet Sold', item.stoutieProgramPacketSold));
  lines.push(line('Stoutie Program Engage People', item.stoutieProgramEngagePeople));
  // Loyalty
  lines.push(line('Loyalty Program Participation', yn(item.loyaltyProgramParticipation)));
  lines.push(line('Loyalty Program Description', item.loyaltyProgramDescription));
  lines.push(line('Loyalty Program Call Reach', item.loyaltyProgramCallReach));
  lines.push(line('Loyalty Program Packet Sold', item.loyaltyProgramPacketSold));
  lines.push(line('Loyalty Program Engage People', item.loyaltyProgramEngagePeople));
  // Brightball
  lines.push(line('Brightball Participation', yn(item.brightballParticipation)));
  lines.push(line('Brightball Description', item.brightballDescription));
  lines.push(line('Brightball Call Reach', item.brightballCallReach));
  lines.push(line('Brightball Packet Sold', item.brightballPacketSold));
  lines.push(line('Brightball Engage People', item.brightballEngagePeople));
  // SOV
  lines.push(line('SOV Program Participation', yn(item.sovProgramParticipation)));
  lines.push(line('SOV Program Description', item.sovProgramDescription));
  lines.push(line('SOV Program Call Reach', item.sovProgramCallReach));
  lines.push(line('SOV Program Packet Sold', item.sovProgramPacketSold));
  lines.push(line('SOV Program Engage People', item.sovProgramEngagePeople));

  // Bali Specific Data
  lines.push(h('Bali Specific Data'));
  lines.push(line('Bali Specific Visitor Data', yn(item.baliSpecificVisitorData)));
  lines.push(line('Bali Local Visitors', item.baliLocalVisitors));
  lines.push(line('Bali Foreign Visitors', item.baliForeignVisitors));
  lines.push(line('Bali Local Guinness Buyers', item.baliLocalGuinnessBuyers));
  lines.push(line('Bali Foreign Guinness Buyers', item.baliForeignGuinnessBuyers));

  // AMS Data
  lines.push(h('AMS Data'));
  lines.push(line('AMS GFES', item.amsGfes));
  lines.push(line('AMS Smooth', item.amsSmooth));
  lines.push(line('AMS Microdraught', item.amsMicrodraught));
  lines.push(line('AMS Kegs', item.amsKegs));
  lines.push(line('AMS Total', item.amsTotal));

  // Summary
  lines.push(h('Sales Report Summary Notes and Learning'));
  lines.push(line('Issues/Notes/Requests', item.issuesNotesRequests));
  lines.push(line('Learning Points', item.learningPoints));
  lines.push(line('Beer Market Size', item.beerMarketSize));
  lines.push(line('Total Guinness Sales', item.totalGuinnessSales));
  lines.push(line('Achievement Percentage', item.achievementPercentage));

  return lines.join('\n');
}

function yn(val: any): string {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  return formatValue(val);
}

function tsToLocale(value: any): string {
  try {
    if (value?.toDate) {
      return value.toDate().toLocaleString();
    }
  } catch {}
  return formatValue(value);
}

function formatValue(value: any): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}
