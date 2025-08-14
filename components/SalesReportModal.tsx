import React from 'react';
import { Modal, ScrollView, View, Text, TextInput, Switch, Button, StyleSheet } from 'react-native';
import stateMachine from '../constants/stateMachine';
import { SRDStatus } from '../constants/status';
import { Picker } from '@react-native-picker/picker';
import { useI18n } from './I18n';
import { useEffectiveScheme } from './ThemePreference';

type SalesReportModalProps = {
  visible: boolean;
  onClose: () => void;
  modalType: 'add' | 'edit' | 'review';
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  userRole: string | null;
  assessmentMerchandiseAvailable: boolean | null;
  setAssessmentMerchandiseAvailable: React.Dispatch<React.SetStateAction<boolean | null>>;
  handleFormSubmit: () => void;
  // Optional name/outlet resolvers for cleaner UI labels
  userNames?: Record<string, string>;
  outlets?: Array<{ id: string; outletName?: string }>;
};

const WEATHER_STATUS_OPTIONS_I18N = (t: (k: string) => string) => [
  { label: t('sunny') || 'Cerah', value: t('sunny') || 'Cerah' },
  { label: t('cloudy') || 'Berawan', value: t('cloudy') || 'Berawan' },
  { label: t('rainy') || 'Hujan', value: t('rainy') || 'Hujan' },
];

const SalesReportModal: React.FC<SalesReportModalProps> = ({
  visible,
  onClose,
  modalType,
  formData,
  setFormData,
  userRole,
  assessmentMerchandiseAvailable,
  setAssessmentMerchandiseAvailable,
  handleFormSubmit,
  userNames,
  outlets,
}) => {
  const resolveUserName = (uid?: string | null) => {
    if (!uid) return '-';
    return (userNames && userNames[uid]) || uid;
  };
  const resolveOutletName = (outletId?: string | null, fallbackName?: string | null) => {
    if (!outletId && !fallbackName) return '-';
    const resolved = outlets?.find(o => o.id === outletId)?.outletName;
    return resolved || fallbackName || outletId || '-';
  };
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const colors = {
    overlay: 'rgba(0,0,0,0.5)',
    surface: isDark ? '#111827' : 'white',
    border: isDark ? '#1f2937' : '#e5e7eb',
    text: isDark ? '#e5e7eb' : '#111827',
    muted: isDark ? '#94a3b8' : '#6b7280',
    inputBg: isDark ? '#0b1220' : 'white',
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{(modalType === 'add' ? (t('add') || 'Add') : (t('edit') || 'Edit')) + ' ' + (t('sales_report') || 'Report')}</Text>
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('personnel_information') || 'Personnel Information'}</Text>
          <Text style={{ color: colors.text }}>{t('assigned_to_ba') || 'Assigned to BA'}: {resolveUserName(formData.assignedToBA)}</Text>
          <Text style={{ color: colors.text }}>{t('assigned_to_tl') || 'Assigned to TL'}: {resolveUserName(formData.assignedToTL)}</Text>
          <Text style={[styles.inputLabel, { color: colors.muted }]}>no of BA / SPG Guinness in charge (for selling program)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.baCount} onChangeText={text => setFormData((p:any)=>({...p, baCount: text}))} placeholder="# of BA" placeholderTextColor={colors.muted} keyboardType="numeric" />
          <Text style={[styles.inputLabel, { color: colors.muted }]}>no of crew or canvasser in charge (for event or canvasser program)</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.crewCanvasserCount} onChangeText={text => setFormData((p:any)=>({...p, crewCanvasserCount: text}))} placeholder="# of Crew/Canvasser" placeholderTextColor={colors.muted} keyboardType="numeric" />

          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('outlet_information') || 'Outlet Information'}</Text>
          <Text style={{ color: colors.text }}>{t('outlet_id') || 'Outlet ID'}: {resolveOutletName(formData.outletId, formData.outletName)}</Text>
          <Text style={{ color: colors.text }}>{t('outlet_name') || 'Outlet Name'}: {resolveOutletName(formData.outletId, formData.outletName)}</Text>
          <Text style={{ color: colors.text }}>{t('province') || 'Province'}: {formData.outletProvince || '-'}</Text>
          <Text style={{ color: colors.text }}>{t('city') || 'City'}: {formData.outletCity || '-'}</Text>
          <Text style={{ color: colors.text }}>{t('activity_name') || 'Activity Name'}: {formData.activityName || '-'}</Text>
            <Text style={{ color: colors.text }}>Channel: {formData.channel || '-'}</Text>
            <Text style={{ color: colors.text }}>{t('tier') || 'Tier'}: {formData.tier || '-'}</Text>
            <Text style={{ color: colors.text }}>{t('capacity') || 'Capacity'}: {formData.outletCapacity || '-'}</Text>
            <Text style={{ color: colors.text }}>{t('tables_available') || 'Outlet No. of Tables Available'}: {formData.outletNoOfTableAVailable || '-'}</Text>

          {/* Sampling Data */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('sampling_data') || 'Sampling Data (if any)'}</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('sampling_available') || 'Sampling Available'}</Text>
            <Switch value={formData.samplingDataAvailable} onValueChange={value => setFormData((p:any)=>({...p, samplingDataAvailable: value}))} />
          </View>
          {formData.samplingDataAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Smooth Bottle Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingSmoothBottle} onChangeText={text => setFormData((p:any)=>({...p, samplingSmoothBottle: text}))} placeholder="Smooth Bottle Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Smooth On-Lips Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingSmoothOnLips} onChangeText={text => setFormData((p:any)=>({...p, samplingSmoothOnLips: text}))} placeholder="Smooth On-Lips Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Smooth Sampling To Buy</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingSmoothToBuy} onChangeText={text => setFormData((p:any)=>({...p, samplingSmoothToBuy: text}))} placeholder="Smooth Sampling To Buy" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES Bottle Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingGfesBottle} onChangeText={text => setFormData((p:any)=>({...p, samplingGfesBottle: text}))} placeholder="GFES Bottle Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES On-Lips Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingGfesOnLips} onChangeText={text => setFormData((p:any)=>({...p, samplingGfesOnLips: text}))} placeholder="GFES On-Lips Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES Sampling To Buy</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingGfesToBuy} onChangeText={text => setFormData((p:any)=>({...p, samplingGfesToBuy: text}))} placeholder="GFES Sampling To Buy" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>MD Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingMd} onChangeText={text => setFormData((p:any)=>({...p, samplingMd: text}))} placeholder="MD Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>MD Sampling on-Lips</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingMdOnLips} onChangeText={text => setFormData((p:any)=>({...p, samplingMdOnLips: text}))} placeholder="MD Sampling on-Lips" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>MD Sampling To Buy</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingMdToBuy} onChangeText={text => setFormData((p:any)=>({...p, samplingMdToBuy: text}))} placeholder="MD Sampling To Buy" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>GDIC Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingGdic} onChangeText={text => setFormData((p:any)=>({...p, samplingGdic: text}))} placeholder="GDIC Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>GDIC Sampling On-Lips</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingGdicOnLips} onChangeText={text => setFormData((p:any)=>({...p, samplingGdicOnLips: text}))} placeholder="GDIC Sampling On-Lips" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>GDIC Sampling To Buy</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingGdicToBuy} onChangeText={text => setFormData((p:any)=>({...p, samplingGdicToBuy: text}))} placeholder="GDIC Sampling To Buy" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Kegs Sampling</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingKegs} onChangeText={text => setFormData((p:any)=>({...p, samplingKegs: text}))} placeholder="Kegs Sampling" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Kegs Sampling On-Lips</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingKegsOnLips} onChangeText={text => setFormData((p:any)=>({...p, samplingKegsOnLips: text}))} placeholder="Kegs Sampling On-Lips" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Kegs Sampling To Buy</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.samplingKegsToBuy} onChangeText={text => setFormData((p:any)=>({...p, samplingKegsToBuy: text}))} placeholder="Kegs Sampling To Buy" placeholderTextColor={colors.muted} keyboardType='numeric'/>
                </View>
              </View>
            </>
          )}

          {/* Guinness Selling Data */}
      <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('guinness_selling_data') || 'Guinness Selling Data'}</Text>
      <Text style={[styles.inputLabel, { color: colors.muted }]}>(Fields below refer to the Quick Sales Report Collection)</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>KEGS (330ml) glass</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesKegs330} onChangeText={text => setFormData((p:any)=>({...p, salesKegs330: text}))} placeholder="KEGS (330ml) glass" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>KEGS (500ml) glass</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesKegs500} onChangeText={text => setFormData((p:any)=>({...p, salesKegs500: text}))} placeholder="KEGS (500ml) glass" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
      <Text style={[styles.inputLabel, { color: colors.muted }]}>MD (500ml) can</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesMd500} onChangeText={text => setFormData((p:any)=>({...p, salesMd500: text}))} placeholder="MD (500ml) can" placeholderTextColor={colors.muted} keyboardType="numeric" />
      <Text style={[styles.inputLabel, { color: colors.muted }]}>GDIC (400ml) can</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesGdic400} onChangeText={text => setFormData((p:any)=>({...p, salesGdic400: text}))} placeholder="GDIC (400ml) can" placeholderTextColor={colors.muted} keyboardType="numeric" />
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>SMOOTH PINT 330ml</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesSmoothPint330} onChangeText={text => setFormData((p:any)=>({...p, salesSmoothPint330: text}))} placeholder="SMOOTH PINT 330ml" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>SMOOTH CAN 330ml</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesSmoothCan330} onChangeText={text => setFormData((p:any)=>({...p, salesSmoothCan330: text}))} placeholder="SMOOTH CAN 330ml" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES PINT 330ml</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesGfesPint330} onChangeText={text => setFormData((p:any)=>({...p, salesGfesPint330: text}))} placeholder="GFES PINT 330ml" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES QUART 620ml</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesGfesQuart620} onChangeText={text => setFormData((p:any)=>({...p, salesGfesQuart620: text}))} placeholder="GFES QUART 620ml" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES CAN 330ml</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesGfesCan330} onChangeText={text => setFormData((p:any)=>({...p, salesGfesCan330: text}))} placeholder="GFES CAN 330ml" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES CANBIG 500ml</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.salesGfesCanbig500} onChangeText={text => setFormData((p:any)=>({...p, salesGfesCanbig500: text}))} placeholder="GFES CANBIG 500ml" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
      <Text style={[styles.inputLabel, { color: colors.muted }]}>Total Guinness Sales</Text>
      <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.totalGuinnessSales} onChangeText={text => setFormData((p:any)=>({...p, totalGuinnessSales: text}))} placeholder="Total Guinness Sales" placeholderTextColor={colors.muted} />

          {/* Call and Customer Data */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('call_and_customer_data') || 'Call and Customer Data'}</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Call/Jumlah Warung/Jumlah Penawaran</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.callsOffers} onChangeText={text => setFormData((p:any)=>({...p, callsOffers: text}))} placeholder="No of calls/offers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>Effective Call/Jumlah Pembeli/Jumlah Warung Beli</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.effectiveCalls} onChangeText={text => setFormData((p:any)=>({...p, effectiveCalls: text}))} placeholder="Effective calls/buyers/shops" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>% calls vs. effective calls</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                value={(() => {
                  const calls = parseFloat(formData.callsOffers);
                  const effective = parseFloat(formData.effectiveCalls);
                  if (formData.callsOffers === '' || formData.effectiveCalls === '') return '';
                  if (!isNaN(calls) && calls === 0) return '';
                  if (!isNaN(calls) && calls > 0 && !isNaN(effective) && effective === 0) return '0%';
                  if (!isNaN(calls) && calls > 0 && !isNaN(effective) && effective >= 0) {
                    const percent = (effective / calls) * 100;
                    if (!isFinite(percent) || percent < 0) return '';
                    return percent.toFixed(2) + '%';
                  }
                  return '';
                })()}
                editable={false}
                placeholder="% calls vs. effective calls"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          {/* Promotional Activities (abridged - full extraction retained) */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('guinness_promotional_activities') || 'Promotional Activities'}</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Guinness SMOOTH Promotion Available</Text>
            <Switch value={formData.guinnessSmoothPromotionAvailable} onValueChange={value => setFormData((p:any)=>({...p, guinnessSmoothPromotionAvailable: value}))} />
          </View>
          {formData.guinnessSmoothPromotionAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Smooth Description </Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoSmoothDescription} onChangeText={text => setFormData((p:any)=>({...p, promoSmoothDescription: text}))} placeholder="Guinness SMOOTH Promotion" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Smooth Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoSmoothSold} onChangeText={text => setFormData((p:any)=>({...p, promoSmoothSold: text}))} placeholder="Promo Smooth Sold" placeholderTextColor={colors.muted} keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Smooth Repeat Order</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoSmoothRepeatOrder} onChangeText={text => setFormData((p:any)=>({...p, promoSmoothRepeatOrder: text}))} placeholder="Promo Smooth Repeat Order" placeholderTextColor={colors.muted} keyboardType="numeric"/>
                </View>
              </View>
            </>
          )}

          {/* GFES Promotion */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Guinness GFES Promotion Available</Text>
            <Switch value={formData.guinnessGfesPromotionAvailable} onValueChange={value => setFormData((p:any)=>({...p, guinnessGfesPromotionAvailable: value}))} />
          </View>
          {formData.guinnessGfesPromotionAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo GFES Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoGfesDescription} onChangeText={text => setFormData((p:any)=>({...p, promoGfesDescription: text}))} placeholder="GFES Promotion" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo GFES Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoGfesSold} onChangeText={text => setFormData((p:any)=>({...p, promoGfesSold: text}))} placeholder="Sold" placeholderTextColor={colors.muted} keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo GFES Repeat Order</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoGfesRepeatOrder} onChangeText={text => setFormData((p:any)=>({...p, promoGfesRepeatOrder: text}))} placeholder="Repeat" placeholderTextColor={colors.muted} keyboardType="numeric"/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Smooth Description (Type 2)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoSmoothDescriptionType2} onChangeText={text => setFormData((p:any)=>({...p, promoSmoothDescriptionType2: text}))} placeholder="Description (Type 2)" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Smooth Sold (Type 2)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoSmoothSoldType2} onChangeText={text => setFormData((p:any)=>({...p, promoSmoothSoldType2: text}))} placeholder="Sold (Type 2)" placeholderTextColor={colors.muted} keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Smooth Repeat Order (Type 2)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoSmoothRepeatOrderType2} onChangeText={text => setFormData((p:any)=>({...p, promoSmoothRepeatOrderType2: text}))} placeholder="Repeat (Type 2)" placeholderTextColor={colors.muted} keyboardType="numeric"/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo GFES Description (Type 2)</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.promoGfesDescriptionType2} onChangeText={text => setFormData((p:any)=>({...p, promoGfesDescriptionType2: text}))} placeholder="Description (Type 2)" placeholderTextColor={colors.muted} />

          {/* Performance Metrics */}
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
              <Text style={styles.inputLabel}>Beer Market Size</Text>
              <TextInput style={styles.input} value={formData.beerMarketSize} onChangeText={text => setFormData((p:any)=>({...p, beerMarketSize: text}))} placeholder="Beer Market Size" keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.inputLabel}>Achievement %</Text>
              <TextInput style={styles.input} value={formData.achievementPercentage} onChangeText={text => setFormData((p:any)=>({...p, achievementPercentage: text}))} placeholder="Achievement %" />
            </View>
          </View>
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo GFES Sold (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoGfesSoldType2} onChangeText={text => setFormData((p:any)=>({...p, promoGfesSoldType2: text}))} placeholder="Sold (Type 2)" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo GFES Repeat Order (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoGfesRepeatOrderType2} onChangeText={text => setFormData((p:any)=>({...p, promoGfesRepeatOrderType2: text}))} placeholder="Repeat (Type 2)" keyboardType="numeric"/>
                </View>
              </View>
            </>
          )}

          {/* KEGS Promotion */}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness KEGS Promotion Available</Text>
            <Switch value={formData.guinnessKegsPromotionAvailable} onValueChange={value => setFormData((p:any)=>({...p, guinnessKegsPromotionAvailable: value}))} />
          </View>
          {formData.guinnessKegsPromotionAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo KEGS Description</Text>
                  <TextInput style={styles.input} value={formData.promoKegsDescription} onChangeText={text => setFormData((p:any)=>({...p, promoKegsDescription: text}))} placeholder="KEGS Promotion" />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo KEGS Sold</Text>
                  <TextInput style={styles.input} value={formData.promoKegsSold} onChangeText={text => setFormData((p:any)=>({...p, promoKegsSold: text}))} placeholder="Sold" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo KEGS Repeat Order</Text>
                  <TextInput style={styles.input} value={formData.promoKegsRepeatOrder} onChangeText={text => setFormData((p:any)=>({...p, promoKegsRepeatOrder: text}))} placeholder="Repeat" keyboardType="numeric"/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo KEGS Description (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoKegsDescriptionType2} onChangeText={text => setFormData((p:any)=>({...p, promoKegsDescriptionType2: text}))} placeholder="Description (Type 2)" />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo KEGS Sold (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoKegsSoldType2} onChangeText={text => setFormData((p:any)=>({...p, promoKegsSoldType2: text}))} placeholder="Sold (Type 2)" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo KEGS Repeat Order (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoKegsRepeatOrderType2} onChangeText={text => setFormData((p:any)=>({...p, promoKegsRepeatOrderType2: text}))} placeholder="Repeat (Type 2)" keyboardType="numeric"/>
                </View>
              </View>
            </>
          )}

          {/* Microdraught Promotion */}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness Microdraught Promotion Available</Text>
            <Switch value={formData.guinnessMicroDraughtPromotionAvailable} onValueChange={value => setFormData((p:any)=>({...p, guinnessMicroDraughtPromotionAvailable: value}))} />
          </View>
          {formData.guinnessMicroDraughtPromotionAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo Microdraught Description</Text>
                  <TextInput style={styles.input} value={formData.promoMicrodraughtDescription} onChangeText={text => setFormData((p:any)=>({...p, promoMicrodraughtDescription: text}))} placeholder="Microdraught Promotion" />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo Microdraught Sold</Text>
                  <TextInput style={styles.input} value={formData.promoMicrodraughtSold} onChangeText={text => setFormData((p:any)=>({...p, promoMicrodraughtSold: text}))} placeholder="Sold" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo Microdraught Repeat Order</Text>
                  <TextInput style={styles.input} value={formData.promoMicrodraughtRepeatOrder} onChangeText={text => setFormData((p:any)=>({...p, promoMicrodraughtRepeatOrder: text}))} placeholder="Repeat" keyboardType="numeric"/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo Microdraught Description (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoMicrodraughtDescriptionType2} onChangeText={text => setFormData((p:any)=>({...p, promoMicrodraughtDescriptionType2: text}))} placeholder="Description (Type 2)" />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo Microdraught Sold (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoMicrodraughtSoldType2} onChangeText={text => setFormData((p:any)=>({...p, promoMicrodraughtSoldType2: text}))} placeholder="Sold (Type 2)" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo Microdraught Repeat Order (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoMicrodraughtRepeatOrderType2} onChangeText={text => setFormData((p:any)=>({...p, promoMicrodraughtRepeatOrderType2: text}))} placeholder="Repeat (Type 2)" keyboardType="numeric"/>
                </View>
              </View>
            </>
          )}

          {/* GDIC Promotion */}
          <View style={styles.switchContainer}>
            <Text style={styles.inputLabel}>Guinness GDIC Promotion Available</Text>
            <Switch value={formData.guinnessGdicPromotionAvailable} onValueChange={value => setFormData((p:any)=>({...p, guinnessGdicPromotionAvailable: value}))} />
          </View>
          {formData.guinnessGdicPromotionAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo GDIC Description</Text>
                  <TextInput style={styles.input} value={formData.promoGdicDescription} onChangeText={text => setFormData((p:any)=>({...p, promoGdicDescription: text}))} placeholder="GDIC Promotion" />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo GDIC Sold</Text>
                  <TextInput style={styles.input} value={formData.promoGdicSold} onChangeText={text => setFormData((p:any)=>({...p, promoGdicSold: text}))} placeholder="Sold" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo GDIC Repeat Order</Text>
                  <TextInput style={styles.input} value={formData.promoGdicRepeatOrder} onChangeText={text => setFormData((p:any)=>({...p, promoGdicRepeatOrder: text}))} placeholder="Repeat" keyboardType="numeric"/>
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo GDIC Description (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoGdicDescriptionType2} onChangeText={text => setFormData((p:any)=>({...p, promoGdicDescriptionType2: text}))} placeholder="Description (Type 2)" />
                </View>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={styles.inputLabel}>Promo GDIC Sold (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoGdicSoldType2} onChangeText={text => setFormData((p:any)=>({...p, promoGdicSoldType2: text}))} placeholder="Sold (Type 2)" keyboardType="numeric"/>
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>Promo GDIC Repeat Order (Type 2)</Text>
                  <TextInput style={styles.input} value={formData.promoGdicRepeatOrderType2} onChangeText={text => setFormData((p:any)=>({...p, promoGdicRepeatOrderType2: text}))} placeholder="Repeat (Type 2)" keyboardType="numeric"/>
                </View>
              </View>
            </>
          )}

          {/* Visitor and Tables Data */}
      <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('visitor_consumer_data') || 'Visitor and Tables Data'}</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Visitors Overall</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.visitorsOverall} onChangeText={text => setFormData((p:any)=>({...p, visitorsOverall: text}))} placeholder="Visitors Overall" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Visitors Alcohol Drinkers</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.visitorsAlcoholDrinkers} onChangeText={text => setFormData((p:any)=>({...p, visitorsAlcoholDrinkers: text}))} placeholder="Alcohol Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Visitors All Beer Drinkers</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.visitorsAllBeerDrinkers} onChangeText={text => setFormData((p:any)=>({...p, visitorsAllBeerDrinkers: text}))} placeholder="Beer Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Visitors All Guinness</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.visitorsAllGuinness} onChangeText={text => setFormData((p:any)=>({...p, visitorsAllGuinness: text}))} placeholder="Guinness Visitors" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Visitors All Competitor</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.visitorsAllCompetitor} onChangeText={text => setFormData((p:any)=>({...p, visitorsAllCompetitor: text}))} placeholder="Competitor Visitors" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Visitors Mixed</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.visitorsAllGuinnessMixedCompetitor} onChangeText={text => setFormData((p:any)=>({...p, visitorsAllGuinnessMixedCompetitor: text}))} placeholder="Mixed" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables Overall</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesOverall} onChangeText={text => setFormData((p:any)=>({...p, tablesOverall: text}))} placeholder="Tables Overall" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables Alcohol Drinkers</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesAlcoholDrinkers} onChangeText={text => setFormData((p:any)=>({...p, tablesAlcoholDrinkers: text}))} placeholder="Tables Alcohol" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables Non Alcohol Drinkers</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesNonAlcoholDrinkers} onChangeText={text => setFormData((p:any)=>({...p, tablesNonAlcoholDrinkers: text}))} placeholder="Tables Non Alcohol" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables All Beer Drinkers</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesAllBeerDrinkers} onChangeText={text => setFormData((p:any)=>({...p, tablesAllBeerDrinkers: text}))} placeholder="Beer Tables" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables All Guinness</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesAllGuinness} onChangeText={text => setFormData((p:any)=>({...p, tablesAllGuinness: text}))} placeholder="Guinness Tables" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables All Competitor</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesAllCompetitor} onChangeText={text => setFormData((p:any)=>({...p, tablesAllCompetitor: text}))} placeholder="Competitor Tables" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Tables Mixed</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.tablesAllGuinnessMixedCompetitor} onChangeText={text => setFormData((p:any)=>({...p, tablesAllGuinnessMixedCompetitor: text}))} placeholder="Mixed Tables" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>

          {/* Drinkers Breakdown */}
      <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>Drinkers Breakdown (By Brand)</Text>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Smooth</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.drinkersSmooth} onChangeText={text => setFormData((p:any)=>({...p, drinkersSmooth: text}))} placeholder="Smooth Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>GFES</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.drinkersGfes} onChangeText={text => setFormData((p:any)=>({...p, drinkersGfes: text}))} placeholder="GFES Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>KEGS</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.drinkersKegs} onChangeText={text => setFormData((p:any)=>({...p, drinkersKegs: text}))} placeholder="KEGS Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>
          <View style={styles.rowInputs}>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Microdraught</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.drinkersMicrodraught} onChangeText={text => setFormData((p:any)=>({...p, drinkersMicrodraught: text}))} placeholder="Microdraught Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1, marginRight: 4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>GDIC</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.drinkersGdic} onChangeText={text => setFormData((p:any)=>({...p, drinkersGdic: text}))} placeholder="GDIC Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
            <View style={{flex: 1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>Mixed</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.drinkersMixed} onChangeText={text => setFormData((p:any)=>({...p, drinkersMixed: text}))} placeholder="Mixed Drinkers" placeholderTextColor={colors.muted} keyboardType="numeric" />
            </View>
          </View>

          {/* Bali Specific Data */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('bali_specific_data') || 'Bali Specific Visitors'}</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Track Bali Specific Visitor Data</Text>
            <Switch value={!!formData.baliSpecificVisitorData} onValueChange={value => setFormData((p:any)=>({...p, baliSpecificVisitorData: value}))} />
          </View>
          {formData.baliSpecificVisitorData && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Local Visitors</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.baliLocalVisitors} onChangeText={text => setFormData((p:any)=>({...p, baliLocalVisitors: text}))} placeholder="Local Visitors" placeholderTextColor={colors.muted} keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Foreign Visitors</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.baliForeignVisitors} onChangeText={text => setFormData((p:any)=>({...p, baliForeignVisitors: text}))} placeholder="Foreign Visitors" placeholderTextColor={colors.muted} keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex: 1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Local Guinness Buyers</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.baliLocalGuinnessBuyers} onChangeText={text => setFormData((p:any)=>({...p, baliLocalGuinnessBuyers: text}))} placeholder="Local Guinness Buyers" placeholderTextColor={colors.muted} keyboardType="numeric" />
                </View>
                <View style={{flex: 1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Foreign Guinness Buyers</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.baliForeignGuinnessBuyers} onChangeText={text => setFormData((p:any)=>({...p, baliForeignGuinnessBuyers: text}))} placeholder="Foreign Guinness Buyers" placeholderTextColor={colors.muted} keyboardType="numeric" />
                </View>
              </View>
            </>
          )}

          {/* Competitor Sales */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('competitor_sales') || 'Competitor Sales'}</Text>
          {/* Bintang */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Bintang Available</Text>
            <Switch value={formData.competitorBintangAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorBintangAvailable: value}))} />
          </View>
          {formData.competitorBintangAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangPint} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Bintang Crystal */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Bintang Crystal Available</Text>
            <Switch value={formData.competitorBintangCrystalAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorBintangCrystalAvailable: value}))} />
          </View>
          {formData.competitorBintangCrystalAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalPint} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBintangCrystalPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorBintangCrystalPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Heineken */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Heineken Available</Text>
            <Switch value={formData.competitorHeinekenAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorHeinekenAvailable: value}))} />
          </View>
          {formData.competitorHeinekenAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenPint} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Heineken Import */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Heineken Import Available</Text>
            <Switch value={formData.competitorHeinekenImportAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorHeinekenImportAvailable: value}))} />
          </View>
          {formData.competitorHeinekenImportAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportPint} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorHeinekenImportPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorHeinekenImportPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Erdinger Import */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Erdinger Import Available</Text>
            <Switch value={formData.competitorErdingerImportAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorErdingerImportAvailable: value}))} />
          </View>
          {formData.competitorErdingerImportAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportPint} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorErdingerImportPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorErdingerImportPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Budweizer Import */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Budweizer Import Available</Text>
            <Switch value={formData.competitorBudweizerImportAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorBudweizerImportAvailable: value}))} />
          </View>
          {formData.competitorBudweizerImportAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportPint} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBudweizerImportPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorBudweizerImportPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Anker */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Anker Available</Text>
            <Switch value={formData.competitorAnkerAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorAnkerAvailable: value}))} />
          </View>
          {formData.competitorAnkerAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerPint} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorAnkerPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorAnkerPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Balihai */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Balihai Available</Text>
            <Switch value={formData.competitorBalihaiAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorBalihaiAvailable: value}))} />
          </View>
          {formData.competitorBalihaiAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiPint} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorBalihaiPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorBalihaiPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Prost */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Prost Available</Text>
            <Switch value={formData.competitorProstAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorProstAvailable: value}))} />
          </View>
          {formData.competitorProstAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorProstGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstPint} onChangeText={text => setFormData((p:any)=>({...p, competitorProstPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorProstQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorProstCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorProstCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorProstPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorProstPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorProstPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* San Miguel */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>San Miguel Available</Text>
            <Switch value={formData.competitorSanMiguelAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorSanMiguelAvailable: value}))} />
          </View>
          {formData.competitorSanMiguelAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelPint} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSanMiguelPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorSanMiguelPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Singaraja */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Singaraja Available</Text>
            <Switch value={formData.competitorSingarajaAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorSingarajaAvailable: value}))} />
          </View>
          {formData.competitorSingarajaAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSingarajaGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorSingarajaGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSingarajaPint} onChangeText={text => setFormData((p:any)=>({...p, competitorSingarajaPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSingarajaQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorSingarajaQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSingarajaCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorSingarajaCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorSingarajaCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorSingarajaCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Carlsberg */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Carlsberg Available</Text>
            <Switch value={formData.competitorCarlsbergAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorCarlsbergAvailable: value}))} />
          </View>
          {formData.competitorCarlsbergAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergPint} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorCarlsbergPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorCarlsbergPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Draft Beer */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Draft Beer Available</Text>
            <Switch value={formData.competitorDraftBeerAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorDraftBeerAvailable: value}))} />
          </View>
          {formData.competitorDraftBeerAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerPint} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorDraftBeerPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorDraftBeerPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Kura Kura */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Kura Kura Available</Text>
            <Switch value={formData.competitorKuraKuraAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorKuraKuraAvailable: value}))} />
          </View>
          {formData.competitorKuraKuraAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraPint} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorKuraKuraPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorKuraKuraPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Island Brewing */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Island Brewing Available</Text>
            <Switch value={formData.competitorIslandBrewingAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorIslandBrewingAvailable: value}))} />
          </View>
          {formData.competitorIslandBrewingAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingPint} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorIslandBrewingPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorIslandBrewingPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

          {/* Others */}
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Other Brands Available</Text>
            <Switch value={formData.competitorOthersAvailable} onValueChange={value => setFormData((p:any)=>({...p, competitorOthersAvailable: value}))} />
          </View>
          {formData.competitorOthersAvailable && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Glass</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersGlass} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersGlass: text}))} placeholder="Glass" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Pint</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersPint} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersPint: text}))} placeholder="Pint" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Quart</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersQuart} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersQuart: text}))} placeholder="Quart" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Small</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersCanSmall} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersCanSmall: text}))} placeholder="Can Small" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Can Big</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersCanBig} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersCanBig: text}))} placeholder="Can Big" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Description</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersPromoDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersPromoDescription: text}))} placeholder="Promo Description" placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Promo Sold</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorOthersPromoSold} onChangeText={text => setFormData((p:any)=>({...p, competitorOthersPromoSold: text}))} placeholder="Promo Sold" placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
            </>
          )}

      {/* Competitor Activity Summary */}
      <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('competitor_activity_description') || 'Competitor Activity'} (Summary)</Text>
          <View style={styles.rowInputs}>
            <View style={{flex:1, marginRight:4}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('competitor_activity_description') || 'Activity Description'}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorActivityDescription} onChangeText={text => setFormData((p:any)=>({...p, competitorActivityDescription: text}))} placeholder={(t('competitor_activity_description') || 'Describe competitor activities')} placeholderTextColor={colors.muted} />
            </View>
            <View style={{flex:1}}>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('competitor_activity_spg_total') || 'Total SPG Involved'}</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.competitorActivitySpgTotal} onChangeText={text => setFormData((p:any)=>({...p, competitorActivitySpgTotal: text}))} placeholder={t('competitor_activity_spg_total') || '# SPG'} placeholderTextColor={colors.muted} keyboardType='numeric' />
            </View>
          </View>

          {/* Merchandise */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('merchandise_data') || 'Merchandise'}</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('merchandise_available') || 'Merchandise Available'}</Text>
            <Switch value={formData.merchandiseAvailable} onValueChange={value => setFormData((p:any)=>({...p, merchandiseAvailable: value}))} />
          </View>
          {formData.merchandiseAvailable && (
            <>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('merchandise_distributed') || 'Merchandise Distributed'}</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.merchandiseDistributed} onChangeText={text => setFormData((p:any)=>({...p, merchandiseDistributed: text}))} placeholder={(t('merchandise_distributed') || 'Merchandise Distributed')} placeholderTextColor={colors.muted} />
              {[1,2,3,4,5].map((n) => (
                <View key={n} style={styles.rowInputs}>
                  <View style={{flex:1, marginRight:4}}>
                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{(t('description') || 'Description')} {n}</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData[`merchandiseDescription${n}`]} onChangeText={text => setFormData((p:any)=>({...p, [`merchandiseDescription${n}`]: text}))} placeholder={`${t('description') || 'Description'} ${n}`} placeholderTextColor={colors.muted} />
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[styles.inputLabel, { color: colors.muted }]}>{(t('sold') || 'Sold')} {n}</Text>
                    <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData[`merchandiseSold${n}`]} onChangeText={text => setFormData((p:any)=>({...p, [`merchandiseSold${n}`]: text}))} placeholder={`${t('sold') || 'Sold'} ${n}`} placeholderTextColor={colors.muted} keyboardType='numeric' />
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Programs & Digital Activity */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('programs_digital_activity') || 'Programs & Digital Activity'}</Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Stoutie {t('program_participation') || 'Program Participation'}</Text>
            <Switch value={!!formData.stoutieprogramParticipation} onValueChange={value => setFormData((p:any)=>({...p, stoutieprogramParticipation: value}))} />
          </View>
          {formData.stoutieprogramParticipation && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('description') || 'Description'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.stoutieProgramDescription} onChangeText={text => setFormData((p:any)=>({...p, stoutieProgramDescription: text}))} placeholder={`Stoutie ${t('description') || 'Description'}`} placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('call_reach') || 'Call Reach'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.stoutieProgramCallReach} onChangeText={text => setFormData((p:any)=>({...p, stoutieProgramCallReach: text}))} placeholder={t('call_reach') || 'Call Reach'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('packet_sold') || 'Packet Sold'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.stoutieProgramPacketSold} onChangeText={text => setFormData((p:any)=>({...p, stoutieProgramPacketSold: text}))} placeholder={t('packet_sold') || 'Packet Sold'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('engaged_people') || 'Engaged People'}</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.stoutieProgramEngagePeople} onChangeText={text => setFormData((p:any)=>({...p, stoutieProgramEngagePeople: text}))} placeholder={t('engaged_people') || 'Engaged People'} placeholderTextColor={colors.muted} keyboardType='numeric' />
            </>
          )}

          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Loyalty {t('program_participation') || 'Program Participation'}</Text>
            <Switch value={!!formData.loyaltyProgramParticipation} onValueChange={value => setFormData((p:any)=>({...p, loyaltyProgramParticipation: value}))} />
          </View>
          {formData.loyaltyProgramParticipation && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('description') || 'Description'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.loyaltyProgramDescription} onChangeText={text => setFormData((p:any)=>({...p, loyaltyProgramDescription: text}))} placeholder={`Loyalty ${t('description') || 'Description'}`} placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('call_reach') || 'Call Reach'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.loyaltyProgramCallReach} onChangeText={text => setFormData((p:any)=>({...p, loyaltyProgramCallReach: text}))} placeholder={t('call_reach') || 'Call Reach'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('packet_sold') || 'Packet Sold'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.loyaltyProgramPacketSold} onChangeText={text => setFormData((p:any)=>({...p, loyaltyProgramPacketSold: text}))} placeholder={t('packet_sold') || 'Packet Sold'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('engaged_people') || 'Engaged People'}</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.loyaltyProgramEngagePeople} onChangeText={text => setFormData((p:any)=>({...p, loyaltyProgramEngagePeople: text}))} placeholder={t('engaged_people') || 'Engaged People'} placeholderTextColor={colors.muted} keyboardType='numeric' />
            </>
          )}

          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Brightball {t('program_participation') || 'Program Participation'}</Text>
            <Switch value={!!formData.brightballParticipation} onValueChange={value => setFormData((p:any)=>({...p, brightballParticipation: value}))} />
          </View>
          {formData.brightballParticipation && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('description') || 'Description'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.brightballDescription} onChangeText={text => setFormData((p:any)=>({...p, brightballDescription: text}))} placeholder={`Brightball ${t('description') || 'Description'}`} placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('call_reach') || 'Call Reach'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.brightballCallReach} onChangeText={text => setFormData((p:any)=>({...p, brightballCallReach: text}))} placeholder={t('call_reach') || 'Call Reach'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('packet_sold') || 'Packet Sold'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.brightballPacketSold} onChangeText={text => setFormData((p:any)=>({...p, brightballPacketSold: text}))} placeholder={t('packet_sold') || 'Packet Sold'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('engaged_people') || 'Engaged People'}</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.brightballEngagePeople} onChangeText={text => setFormData((p:any)=>({...p, brightballEngagePeople: text}))} placeholder={t('engaged_people') || 'Engaged People'} placeholderTextColor={colors.muted} keyboardType='numeric' />
            </>
          )}

          <View style={styles.switchContainer}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>SOV {t('program_participation') || 'Program Participation'}</Text>
            <Switch value={!!formData.sovProgramParticipation} onValueChange={value => setFormData((p:any)=>({...p, sovProgramParticipation: value}))} />
          </View>
          {formData.sovProgramParticipation && (
            <>
              <View style={styles.rowInputs}>
                <View style={{flex:1, marginRight:4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('description') || 'Description'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.sovProgramDescription} onChangeText={text => setFormData((p:any)=>({...p, sovProgramDescription: text}))} placeholder={`SOV ${t('description') || 'Description'}`} placeholderTextColor={colors.muted} />
                </View>
                <View style={{flex:1, marginRight: 4}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('call_reach') || 'Call Reach'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.sovProgramCallReach} onChangeText={text => setFormData((p:any)=>({...p, sovProgramCallReach: text}))} placeholder={t('call_reach') || 'Call Reach'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
                <View style={{flex:1}}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('packet_sold') || 'Packet Sold'}</Text>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.sovProgramPacketSold} onChangeText={text => setFormData((p:any)=>({...p, sovProgramPacketSold: text}))} placeholder={t('packet_sold') || 'Packet Sold'} placeholderTextColor={colors.muted} keyboardType='numeric' />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('engaged_people') || 'Engaged People'}</Text>
              <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} value={formData.sovProgramEngagePeople} onChangeText={text => setFormData((p:any)=>({...p, sovProgramEngagePeople: text}))} placeholder={t('engaged_people') || 'Engaged People'} placeholderTextColor={colors.muted} keyboardType='numeric' />
            </>
          )}

          {/* Weather */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('weather_data') || 'Weather'}</Text>
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('weather_status') || 'Weather Status'}</Text>
          <View style={[styles.input, { padding: 0, backgroundColor: colors.inputBg, borderColor: colors.border }]}> 
            <Picker
              selectedValue={formData.weatherStatus}
              onValueChange={value => setFormData((p:any)=>({ ...p, weatherStatus: value }))}
              style={{ height: 40 }}
            >
              <Picker.Item label="" value="" />
              {WEATHER_STATUS_OPTIONS_I18N(t).map((option: {label: string; value: string}) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>

          {/* Notes */}
          <Text style={[styles.sectionTitle, { color: colors.muted, borderTopColor: colors.border }]}>{t('srd_summary_notes_learning') || 'Sales Report Summary Notes and Learning'}</Text>
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('issues_notes') || 'Issues/Notes/Requests'}</Text>
          <TextInput
            style={[styles.input, { height: 80, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            value={formData.issuesNotesRequests}
            onChangeText={text => setFormData((p:any)=>({ ...p, issuesNotesRequests: text }))}
            placeholder={t('issues_notes') || 'Issues/Notes/Requests'}
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
          />
          <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('learning_points') || 'Learning Points'}</Text>
          <TextInput 
            style={[styles.input, { height: 80, backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} 
            value={formData.learningPoints} 
            onChangeText={text => setFormData((p:any)=>({...p, learningPoints: text}))} 
            placeholder={t('learning_points') || 'Learning Points'} 
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={4}
          />

          {/* Status for admin */}
      {(userRole === 'admin' || userRole === 'superadmin') && modalType === 'edit' && (
            <>
        <Text style={[styles.inputLabel, { color: colors.muted }]}>{t('sales_report_detail_status') || 'Task Sales Report Detail Status'}</Text>
        <View style={[styles.input, { padding: 0, backgroundColor: colors.inputBg, borderColor: colors.border }]}> 
                <Picker
                  selectedValue={formData.salesReportDetailStatus}
                  onValueChange={value => setFormData((p:any)=>({ ...p, salesReportDetailStatus: value }))}
                  style={{ height: 40 }}
                >
                  {(() => {
                    const current = String(formData.salesReportDetailStatus || '');
                    const role = String(userRole || '');
                    const opts = stateMachine.nextOptionsForRole('SRD', role as any, current as any);
                    const all = [SRDStatus.Empty, ...opts];
                    return all.map(value => (
                      <Picker.Item key={value} label={value} value={value} />
                    ));
                  })()}
                </Picker>
              </View>
            </>
          )}

          <View style={styles.buttonContainer}>
            <Button title={modalType === 'add' ? (t('add') || 'Add') : (t('update') || 'Update')} onPress={handleFormSubmit} />
            <Button title={t('cancel') || 'Cancel'} onPress={onClose} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 10 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, padding: 8, borderRadius: 5 },
  inputLabel: { fontSize: 10, color: '#888', marginBottom: 2, marginLeft: 2 },
  rowInputs: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
});

export default SalesReportModal;
