import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useI18n } from './I18n';
import { useEffectiveScheme } from './ThemePreference';
import { palette } from '@/constants/Design';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: any | null;
  onCopyAll?: () => void;
  // Optional resolvers passed from the screen to avoid extra queries
  userNames?: Record<string, string>;
  outlets?: Array<{ id: string; outletName?: string }>; 
};

const TaskEarlyAssessmentDetailsModal: React.FC<Props> = ({ visible, onClose, item, onCopyAll, userNames, outlets }) => {
  const { t } = useI18n();
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const textColor = { color: isDark ? '#e5e7eb' : '#111827' };
  const sectionBorder = { borderTopColor: isDark ? '#334155' : '#ccc' };
  const resolveUserName = (uid?: string | null) => {
    if (!uid) return '-';
    return (userNames && userNames[uid]) || uid;
  };
  const resolveOutletName = (outletId?: string | null, fallbackName?: string | null) => {
    if (!outletId && !fallbackName) return '-';
    const resolved = outlets?.find(o => o.id === outletId)?.outletName;
    return resolved || fallbackName || outletId || '-';
  };

  const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <Text selectable style={textColor}>{label}: {formatValue(value)}</Text>
  );
  const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Text selectable style={[styles.sectionTitle, sectionBorder, textColor]}>{children}</Text>
  );

  const handleCopyMD = async () => { if (!item) return; await Clipboard.setStringAsync(buildTaskEarlyAssessmentText(item, 'markdown')); Alert.alert(t('copied_to_clipboard') || 'Copied to clipboard'); };
  const handleShare = async () => { if (!item) return; try { await Share.share({ message: buildTaskEarlyAssessmentText(item, 'text') }); } catch {} };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#111827' : palette.surface, borderColor: isDark ? '#334155' : '#e5e7eb' }]}>
          <Text selectable style={[styles.title, textColor]}>{t('assessment') || 'Early Assessment'}</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
            {!item ? <Text style={textColor}>{t('no_data') || 'No data'}</Text> : (
              <>
              <SectionTitle>{t('personnel') || 'Personnel'}</SectionTitle>
              <Line label={t('assigned_ba') || 'Assigned BA'} value={resolveUserName(item.assignedToBA)} />
              <Line label={t('assigned_tl') || 'Assigned TL'} value={resolveUserName(item.assignedToTL)} />
              <Line label={t('status') || 'Status'} value={item.status} />
              <Line label={t('created') || 'Created'} value={tsToLocale(item.createdAt)} />

              <SectionTitle>{t('outlet') || 'Outlet'}</SectionTitle>
              <Line label={t('outlet_id') || 'Outlet ID'} value={resolveOutletName(item.outletId, item.outletName)} />
              <Line label={t('province') || 'Province'} value={item.locationProvince} />
              <Line label={t('city') || 'City'} value={item.locationCity} />
              <Line label={t('outlet') || 'Outlet'} value={resolveOutletName(item.outletId, item.outletName)} />
              <Line label={t('tier') || 'Tier'} value={item.outletTier} />
              <Line label={t('type') || 'Type'} value={item.outletType} />

              <SectionTitle>{t('availability_stock_expiry') || 'Availability / Stock / Expiry'}</SectionTitle>
              <Line label={t('kegs_available') || 'KEGS Available'} value={yn(item.kegsAvailable)} />
              <Line label={t('stock_kegs') || 'Stock Kegs'} value={item.stockKegs} />
              <Line label={t('expiry_kegs') || 'Expiry Kegs'} value={item.expiryKegs} />
              <Line label={t('microdraught_available') || 'Microdraught Available'} value={yn(item.microdraughtAvailable)} />
              <Line label={t('stock_microdraught') || 'Stock Microdraught'} value={item.stockMicrodraught} />
              <Line label={t('expiry_microdraught') || 'Expiry Microdraught'} value={item.expiryMicrodraught} />
              <Line label={t('gdic_available') || 'GDIC Available'} value={yn(item.gdicAvailable)} />
              <Line label={t('stock_gdic') || 'Stock GDIC'} value={item.stockGdic} />
              <Line label={t('expiry_gdic') || 'Expiry GDIC'} value={item.expiryGdic} />
              <Line label={t('smooth_available') || 'Smooth Available'} value={yn(item.smoothAvailable)} />
              <Line label={t('stock_smooth_pint_330') || 'Stock Smooth Pint 330'} value={item.stockSmoothPint330} />
              <Line label={t('expiry_smooth_pint_330') || 'Expiry Smooth Pint 330'} value={item.expirySmoothPint330} />
              <Line label={t('stock_smooth_can_330') || 'Stock Smooth Can 330'} value={item.stockSmoothCan330} />
              <Line label={t('expiry_smooth_can_330') || 'Expiry Smooth Can 330'} value={item.expirySmoothCan330} />
              <Line label={t('gfes_available') || 'GFES Available'} value={yn(item.gfesAvailable)} />
              <Line label={t('stock_gfes_pint_330') || 'Stock GFES Pint 330'} value={item.stockGfesPint330} />
              <Line label={t('expiry_gfes_pint_330') || 'Expiry GFES Pint 330'} value={item.expiryGfesPint330} />
              <Line label={t('stock_gfes_can_330') || 'Stock GFES Can 330'} value={item.stockGfesCan330} />
              <Line label={t('expiry_gfes_can_330') || 'Expiry GFES Can 330'} value={item.expiryGfesCan330} />
              <Line label={t('stock_gfes_620') || 'Stock GFES 620'} value={item.stockGfes620} />
              <Line label={t('expiry_gfes_620') || 'Expiry GFES 620'} value={item.expiryGfes620} />
              <Line label={t('stock_gfes_can_big_500') || 'Stock GFES Can Big 500'} value={item.stockGfesCanBig500} />
              <Line label={t('expiry_gfes_can_big_500') || 'Expiry GFES Can Big 500'} value={item.expiryGfesCanBig500} />

              <SectionTitle>{t('activity_compliance') || 'Activity / Compliance'}</SectionTitle>
              <Line label={t('activity_stoutie_running') || 'Activity Stoutie Running'} value={yn(item.activityStoutieRunning)} />
              <Line label={t('activity_stoutie_result') || 'Activity Stoutie Result'} value={item.activityStoutieResult} />
              <Line label={t('daily_quiz_completed') || 'Daily Quiz Completed'} value={yn(item.dailyQuizCompleted)} />
              <Line label={t('roleplay_video_made') || 'Roleplay Video Made'} value={yn(item.roleplayVideoMade)} />
              <Line label={t('pg_appearance_standard') || 'PG Appearance Standard'} value={yn(item.pgAppearanceStandard)} />

              <SectionTitle>{t('visual_merchandising') || 'Visual Merchandising'}</SectionTitle>
              <Line label={t('visibility_available') || 'Visibility Available'} value={yn(item.visibilityAvailable)} />
              <Line label={t('outlet_visibility_description') || 'Outlet Visibility Description'} value={item.outletVisibilityDescription} />
              <Line label={t('posm_available') || 'POSM Available'} value={yn(item.posmAvailable)} />
              <Line label={t('posm_description') || 'POSM Description'} value={item.posmDescription} />
              <Line label={t('merchandise_available') || 'Merchandise Available'} value={yn(item.merchandiseAvailable)} />
              <Line label={t('merchandise_description') || 'Merchandise Description'} value={item.merchandiseDescription} />

              <SectionTitle>{t('promotions_engagement') || 'Promotions & Engagement'}</SectionTitle>
              <Line label={t('guinness_promotions_available') || 'Guinness Promotions Available'} value={yn(item.guinnessPromotionsAvailable)} />
              <Line label={t('promotion_description') || 'Promotion Description'} value={item.promotionDescription} />
              <Line label={t('guinness_promotion_displayed') || 'Guinness Promotion Displayed'} value={yn(item.guinnessPromotionDisplayed)} />
              <Line label={t('guinness_promotion_displayed_description') || 'Guinness Promotion Displayed Description'} value={item.guinnessPromotionDisplayedDescription} />
              <Line label={t('digital_activity_engagement') || 'Digital Activity Engagement'} value={yn(item.digitalActivityEngagementSwitch)} />
              <Line label={t('digital_activity_engagement_description') || 'Digital Activity Engagement Description'} value={item.digitalActivityEngagementDescription} />

              <SectionTitle>{t('issues_notes') || 'Issues / Notes'}</SectionTitle>
              <Line label={t('issues_notes') || 'Issues/Notes'} value={item.issuesNotes} />
            </>
          )}
          </ScrollView>
          <View style={styles.buttonRow}>
            {onCopyAll && <Button title={t('copy') || 'Copy All'} onPress={onCopyAll} />}
            {item && <Button title={t('copy_md') || 'Copy MD'} onPress={async () => { if (!item) return; await Clipboard.setStringAsync(buildTaskEarlyAssessmentText(item, 'markdown', { userNames, outlets })); Alert.alert(t('copied_to_clipboard') || 'Copied to clipboard'); }} />}
            {item && <Button title={t('share') || 'Share'} onPress={async () => { if (!item) return; try { await Share.share({ message: buildTaskEarlyAssessmentText(item, 'text', { userNames, outlets }) }); } catch {} }} />}
            <Button title={t('close') || 'Close'} onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', backgroundColor: 'white', padding: 16, borderRadius: 10, maxHeight: '85%', borderWidth: 1 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default TaskEarlyAssessmentDetailsModal;

export function buildTaskEarlyAssessmentText(
  item: any,
  format: 'text' | 'markdown' = 'text',
  opts?: { userNames?: Record<string, string>; outlets?: Array<{ id: string; outletName?: string }> }
) {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (t: string) => (isMD ? `\n## ${t}\n` : `\n${t}\n`);
  const line = (l: string, v: any) => `${l}: ${formatValue(v)}`;
  const resolveUser = (uid?: string) => (uid ? (opts?.userNames?.[uid] || uid) : '-');
  const resolveOutlet = (outletId?: string, name?: string) => {
    if (!outletId && !name) return '-';
    const resolved = opts?.outlets?.find(o => o.id === outletId)?.outletName;
    return resolved || name || outletId || '-';
  };
  const out: string[] = [];
  out.push(h('Personnel'));
  out.push(line('Assigned BA', `${resolveUser(item.assignedToBA)}${item.assignedToBA ? ` (${item.assignedToBA})` : ''}`));
  out.push(line('Assigned TL', `${resolveUser(item.assignedToTL)}${item.assignedToTL ? ` (${item.assignedToTL})` : ''}`));
  out.push(line('Status', item.status));
  out.push(line('Created', tsToLocale(item.createdAt)));
  out.push(h('Outlet'));
  out.push(line('Outlet ID', `${resolveOutlet(item.outletId, item.outletName)}${item.outletId ? ` (${item.outletId})` : ''}`));
  out.push(line('Province', item.locationProvince));
  out.push(line('City', item.locationCity));
  out.push(line('Outlet', resolveOutlet(item.outletId, item.outletName)));
  out.push(line('Tier', item.outletTier));
  out.push(line('Type', item.outletType));
  out.push(h('Availability / Stock / Expiry'));
  out.push(line('KEGS Available', yn(item.kegsAvailable)));
  out.push(line('Stock Kegs', item.stockKegs));
  out.push(line('Expiry Kegs', item.expiryKegs));
  out.push(line('Microdraught Available', yn(item.microdraughtAvailable)));
  out.push(line('Stock Microdraught', item.stockMicrodraught));
  out.push(line('Expiry Microdraught', item.expiryMicrodraught));
  out.push(line('GDIC Available', yn(item.gdicAvailable)));
  out.push(line('Stock GDIC', item.stockGdic));
  out.push(line('Expiry GDIC', item.expiryGdic));
  out.push(line('Smooth Available', yn(item.smoothAvailable)));
  out.push(line('Stock Smooth Pint 330', item.stockSmoothPint330));
  out.push(line('Expiry Smooth Pint 330', item.expirySmoothPint330));
  out.push(line('Stock Smooth Can 330', item.stockSmoothCan330));
  out.push(line('Expiry Smooth Can 330', item.expirySmoothCan330));
  out.push(line('GFES Available', yn(item.gfesAvailable)));
  out.push(line('Stock GFES Pint 330', item.stockGfesPint330));
  out.push(line('Expiry GFES Pint 330', item.expiryGfesPint330));
  out.push(line('Stock GFES Can 330', item.stockGfesCan330));
  out.push(line('Expiry GFES Can 330', item.expiryGfesCan330));
  out.push(line('Stock GFES 620', item.stockGfes620));
  out.push(line('Expiry GFES 620', item.expiryGfes620));
  out.push(line('Stock GFES Can Big 500', item.stockGfesCanBig500));
  out.push(line('Expiry GFES Can Big 500', item.expiryGfesCanBig500));
  out.push(h('Activity / Compliance'));
  out.push(line('Activity Stoutie Running', yn(item.activityStoutieRunning)));
  out.push(line('Activity Stoutie Result', item.activityStoutieResult));
  out.push(line('Daily Quiz Completed', yn(item.dailyQuizCompleted)));
  out.push(line('Roleplay Video Made', yn(item.roleplayVideoMade)));
  out.push(line('PG Appearance Standard', yn(item.pgAppearanceStandard)));
  out.push(h('Visual Merchandising'));
  out.push(line('Visibility Available', yn(item.visibilityAvailable)));
  out.push(line('Outlet Visibility Description', item.outletVisibilityDescription));
  out.push(line('POSM Available', yn(item.posmAvailable)));
  out.push(line('POSM Description', item.posmDescription));
  out.push(line('Merchandise Available', yn(item.merchandiseAvailable)));
  out.push(line('Merchandise Description', item.merchandiseDescription));
  out.push(h('Promotions & Engagement'));
  out.push(line('Guinness Promotions Available', yn(item.guinnessPromotionsAvailable)));
  out.push(line('Promotion Description', item.promotionDescription));
  out.push(line('Guinness Promotion Displayed', yn(item.guinnessPromotionDisplayed)));
  out.push(line('Guinness Promotion Displayed Description', item.guinnessPromotionDisplayedDescription));
  out.push(line('Digital Activity Engagement', yn(item.digitalActivityEngagementSwitch)));
  out.push(line('Digital Activity Engagement Description', item.digitalActivityEngagementDescription));
  out.push(h('Issues / Notes'));
  out.push(line('Issues/Notes', item.issuesNotes));
  return out.join('\n');
}

function yn(val: any): string { if (val === true) return 'Yes'; if (val === false) return 'No'; return formatValue(val); }
function tsToLocale(value: any): string { try { if (value?.toDate) return value.toDate().toLocaleString(); } catch {} return formatValue(value); }
function formatValue(v: any): string { if (v === null || v === undefined || v === '') return '-'; if (typeof v === 'boolean') return v ? 'Yes' : 'No'; return String(v); }
