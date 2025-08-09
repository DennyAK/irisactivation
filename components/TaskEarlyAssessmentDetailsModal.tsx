import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

type Props = { visible: boolean; onClose: () => void; item: any | null; onCopyAll?: () => void };

const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (<Text selectable>{label}: {formatValue(value)}</Text>);
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (<Text selectable style={styles.sectionTitle}>{children}</Text>);

const TaskEarlyAssessmentDetailsModal: React.FC<Props> = ({ visible, onClose, item, onCopyAll }) => {
  const handleCopyMD = async () => { if (!item) return; await Clipboard.setStringAsync(buildTaskEarlyAssessmentText(item, 'markdown')); Alert.alert('Copied to clipboard'); };
  const handleShare = async () => { if (!item) return; try { await Share.share({ message: buildTaskEarlyAssessmentText(item, 'text') }); } catch {} };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text selectable style={styles.title}>Early Assessment</Text>
          {!item ? <Text>No data</Text> : (
            <>
              <SectionTitle>Personnel</SectionTitle>
              <Line label="Assigned BA" value={item.assignedToBA} />
              <Line label="Assigned TL" value={item.assignedToTL} />
              <Line label="Status" value={item.status} />
              <Line label="Created" value={tsToLocale(item.createdAt)} />

              <SectionTitle>Outlet</SectionTitle>
              <Line label="Outlet ID" value={item.outletId} />
              <Line label="Province" value={item.locationProvince} />
              <Line label="City" value={item.locationCity} />
              <Line label="Outlet" value={item.outletName} />
              <Line label="Tier" value={item.outletTier} />
              <Line label="Type" value={item.outletType} />

              <SectionTitle>Availability / Stock / Expiry</SectionTitle>
              <Line label="KEGS Available" value={yn(item.kegsAvailable)} />
              <Line label="Stock Kegs" value={item.stockKegs} />
              <Line label="Expiry Kegs" value={item.expiryKegs} />
              <Line label="Microdraught Available" value={yn(item.microdraughtAvailable)} />
              <Line label="Stock Microdraught" value={item.stockMicrodraught} />
              <Line label="Expiry Microdraught" value={item.expiryMicrodraught} />
              <Line label="GDIC Available" value={yn(item.gdicAvailable)} />
              <Line label="Stock GDIC" value={item.stockGdic} />
              <Line label="Expiry GDIC" value={item.expiryGdic} />
              <Line label="Smooth Available" value={yn(item.smoothAvailable)} />
              <Line label="Stock Smooth Pint 330" value={item.stockSmoothPint330} />
              <Line label="Expiry Smooth Pint 330" value={item.expirySmoothPint330} />
              <Line label="Stock Smooth Can 330" value={item.stockSmoothCan330} />
              <Line label="Expiry Smooth Can 330" value={item.expirySmoothCan330} />
              <Line label="GFES Available" value={yn(item.gfesAvailable)} />
              <Line label="Stock GFES Pint 330" value={item.stockGfesPint330} />
              <Line label="Expiry GFES Pint 330" value={item.expiryGfesPint330} />
              <Line label="Stock GFES Can 330" value={item.stockGfesCan330} />
              <Line label="Expiry GFES Can 330" value={item.expiryGfesCan330} />
              <Line label="Stock GFES 620" value={item.stockGfes620} />
              <Line label="Expiry GFES 620" value={item.expiryGfes620} />
              <Line label="Stock GFES Can Big 500" value={item.stockGfesCanBig500} />
              <Line label="Expiry GFES Can Big 500" value={item.expiryGfesCanBig500} />

              <SectionTitle>Activity / Compliance</SectionTitle>
              <Line label="Activity Stoutie Running" value={yn(item.activityStoutieRunning)} />
              <Line label="Activity Stoutie Result" value={item.activityStoutieResult} />
              <Line label="Daily Quiz Completed" value={yn(item.dailyQuizCompleted)} />
              <Line label="Roleplay Video Made" value={yn(item.roleplayVideoMade)} />
              <Line label="PG Appearance Standard" value={yn(item.pgAppearanceStandard)} />

              <SectionTitle>Visual Merchandising</SectionTitle>
              <Line label="Visibility Available" value={yn(item.visibilityAvailable)} />
              <Line label="Outlet Visibility Description" value={item.outletVisibilityDescription} />
              <Line label="POSM Available" value={yn(item.posmAvailable)} />
              <Line label="POSM Description" value={item.posmDescription} />
              <Line label="Merchandise Available" value={yn(item.merchandiseAvailable)} />
              <Line label="Merchandise Description" value={item.merchandiseDescription} />

              <SectionTitle>Promotions & Engagement</SectionTitle>
              <Line label="Guinness Promotions Available" value={yn(item.guinnessPromotionsAvailable)} />
              <Line label="Promotion Description" value={item.promotionDescription} />
              <Line label="Guinness Promotion Displayed" value={yn(item.guinnessPromotionDisplayed)} />
              <Line label="Guinness Promotion Displayed Description" value={item.guinnessPromotionDisplayedDescription} />
              <Line label="Digital Activity Engagement" value={yn(item.digitalActivityEngagementSwitch)} />
              <Line label="Digital Activity Engagement Description" value={item.digitalActivityEngagementDescription} />

              <SectionTitle>Issues / Notes</SectionTitle>
              <Line label="Issues/Notes" value={item.issuesNotes} />
            </>
          )}
          <View style={styles.buttonRow}>
            {onCopyAll && <Button title="Copy All" onPress={onCopyAll} />}
            {item && <Button title="Copy MD" onPress={handleCopyMD} />}
            {item && <Button title="Share" onPress={handleShare} />}
            <Button title="Close" onPress={onClose} />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '92%', backgroundColor: 'white', padding: 20, borderRadius: 10, marginVertical: 50 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 14, marginBottom: 6, borderTopColor: '#ccc', borderTopWidth: 1, paddingTop: 8 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
});

export default TaskEarlyAssessmentDetailsModal;

export function buildTaskEarlyAssessmentText(item: any, format: 'text' | 'markdown' = 'text') {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (t: string) => (isMD ? `\n## ${t}\n` : `\n${t}\n`);
  const line = (l: string, v: any) => `${l}: ${formatValue(v)}`;
  const out: string[] = [];
  out.push(h('Personnel'));
  out.push(line('Assigned BA', item.assignedToBA));
  out.push(line('Assigned TL', item.assignedToTL));
  out.push(line('Status', item.status));
  out.push(line('Created', tsToLocale(item.createdAt)));
  out.push(h('Outlet'));
  out.push(line('Outlet ID', item.outletId));
  out.push(line('Province', item.locationProvince));
  out.push(line('City', item.locationCity));
  out.push(line('Outlet', item.outletName));
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
