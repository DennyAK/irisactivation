import React from 'react';
import { Modal, ScrollView, View, Text, Button, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

type Props = {
  visible: boolean;
  onClose: () => void;
  item: any | null;
  onCopyAll?: () => void;
};

const Line: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <Text selectable>{label}: {formatValue(value)}</Text>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text selectable style={styles.sectionTitle}>{children}</Text>
);

const QuickSalesReportDetailsModal: React.FC<Props> = ({ visible, onClose, item, onCopyAll }) => {
  const handleCopyMD = async () => {
    if (!item) return;
    await Clipboard.setStringAsync(buildQuickSalesReportText(item, 'markdown'));
    Alert.alert('Copied to clipboard');
  };
  const handleShare = async () => {
    if (!item) return;
    try { await Share.share({ message: buildQuickSalesReportText(item, 'text') }); } catch {}
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text selectable style={styles.title}>Quick Sales Report</Text>
          {!item ? (
            <Text>No data</Text>
          ) : (
            <>
              <SectionTitle>Personnel</SectionTitle>
              <Line label="Assigned BA" value={item.assignedToBA} />
              <Line label="Assigned TL" value={item.assignedToTL} />
              <Line label="Status" value={item.taskSalesReportQuickStatus} />
              <Line label="Created" value={tsToLocale(item.createdAt)} />

              <SectionTitle>Outlet / Venue</SectionTitle>
              <Line label="Outlet ID" value={item.outletId} />
              <Line label="Outlet" value={item.outletName} />
              <Line label="Province" value={item.outletProvince} />
              <Line label="City" value={item.outletCity} />
              <Line label="Tier" value={item.outletTier} />
              <Line label="Date" value={tsToLocale(item.guardDate)} />

              <SectionTitle>Guinness Selling</SectionTitle>
              <Line label="KEGS 330ml (glass)" value={item.salesKegs330} />
              <Line label="KEGS 500ml (glass)" value={item.salesKegs500} />
              <Line label="MD 500ml (can)" value={item.salesMd500} />
              <Line label="GDIC 400ml (can)" value={item.salesGdic400} />
              <Line label="Smooth Pint 330ml" value={item.salesSmoothPint330} />
              <Line label="Smooth Can 330ml" value={item.salesSmoothCan330} />
              <Line label="GFES Pint 330ml" value={item.salesGfesPint330} />
              <Line label="GFES Can 330ml" value={item.salesGfesCan330} />
              <Line label="GFES Quart 620ml" value={item.salesGfesQuart620} />
              <Line label="GFES Can Big 500ml" value={item.salesGfesCanbig500} />

              <SectionTitle>Restock</SectionTitle>
              <Line label="Product Restock" value={yn(item.productRestock)} />
              <Line label="Restock Description" value={item.productRestockDescription} />
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

export default QuickSalesReportDetailsModal;

export function buildQuickSalesReportText(item: any, format: 'text' | 'markdown' = 'text') {
  if (!item) return '';
  const isMD = format === 'markdown';
  const h = (t: string) => (isMD ? `\n## ${t}\n` : `\n${t}\n`);
  const line = (l: string, v: any) => `${l}: ${formatValue(v)}`;
  const out: string[] = [];
  out.push(h('Personnel'));
  out.push(line('Assigned BA', item.assignedToBA));
  out.push(line('Assigned TL', item.assignedToTL));
  out.push(line('Status', item.taskSalesReportQuickStatus));
  out.push(line('Created', tsToLocale(item.createdAt)));
  out.push(h('Outlet / Venue'));
  out.push(line('Outlet ID', item.outletId));
  out.push(line('Outlet', item.outletName));
  out.push(line('Province', item.outletProvince));
  out.push(line('City', item.outletCity));
  out.push(line('Tier', item.outletTier));
  out.push(line('Date', tsToLocale(item.guardDate)));
  out.push(h('Guinness Selling'));
  out.push(line('KEGS 330ml (glass)', item.salesKegs330));
  out.push(line('KEGS 500ml (glass)', item.salesKegs500));
  out.push(line('MD 500ml (can)', item.salesMd500));
  out.push(line('GDIC 400ml (can)', item.salesGdic400));
  out.push(line('Smooth Pint 330ml', item.salesSmoothPint330));
  out.push(line('Smooth Can 330ml', item.salesSmoothCan330));
  out.push(line('GFES Pint 330ml', item.salesGfesPint330));
  out.push(line('GFES Can 330ml', item.salesGfesCan330));
  out.push(line('GFES Quart 620ml', item.salesGfesQuart620));
  out.push(line('GFES Can Big 500ml', item.salesGfesCanbig500));
  out.push(h('Restock'));
  out.push(line('Product Restock', yn(item.productRestock)));
  out.push(line('Restock Description', item.productRestockDescription));
  return out.join('\n');
}

function yn(val: any): string { if (val === true) return 'Yes'; if (val === false) return 'No'; return formatValue(val); }
function tsToLocale(value: any): string {
  try { if (value?.toDate) return value.toDate().toLocaleString(); } catch {}
  if (value instanceof Date) return value.toLocaleDateString();
  return formatValue(value);
}
function formatValue(v: any): string { if (v === null || v === undefined || v === '') return '-'; if (typeof v === 'boolean') return v ? 'Yes' : 'No'; return String(v); }
