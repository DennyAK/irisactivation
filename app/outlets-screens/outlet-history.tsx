import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { palette, radius, shadow, spacing, typography } from '../../constants/Design';
import FilterHeader from '../../components/ui/FilterHeader';
import SecondaryButton from '../../components/ui/SecondaryButton';
import SimpleBarChart from '@/components/ui/SimpleBarChart';

type Doc = { id: string; createdAt?: any; [key: string]: any };

function monthsAgoDate(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

function inRange(d: any, since: Date): boolean {
  const dt = d?.toDate ? d.toDate() : undefined;
  if (!dt) return false;
  return dt >= since;
}

function groupMonthly(docs: Doc[], monthsBack = 6) {
  const map = new Map<string, number>();
  const since = monthsAgoDate(monthsBack);
  for (const d of docs) {
    const dt = d.createdAt?.toDate ? d.createdAt.toDate() : undefined;
    if (!dt) continue;
    if (dt < since) continue;
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + 1);
  }
  const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const last = entries.slice(-monthsBack);
  return last.map(([label, value]) => ({ label, value }));
}

export default function OutletHistoryScreen() {
  const params = useLocalSearchParams<{ outletId?: string; outletName?: string }>();
  const outletId = params.outletId || '';
  const outletName = params.outletName || '';

  const [search, setSearch] = useState('');
  const [sortAsc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState<Doc[]>([]);
  const [srd, setSrd] = useState<Doc[]>([]);
  const [ea, setEa] = useState<Doc[]>([]);
  const [att, setAtt] = useState<Doc[]>([]);
  const [active, setActive] = useState<'QR' | 'SRD' | 'EA' | 'ATT'>('QR');
  const [monthsBack, setMonthsBack] = useState(6);
  const [qrVar, setQrVar] = useState('salesSmoothPint330');
  // SRD group + metric selection
  const [srdGroup, setSrdGroup] = useState<'selling' | 'calls' | 'promos' | 'visitors' | 'tables' | 'competitor' | 'programs'>('visitors');
  const [srdVarIndex, setSrdVarIndex] = useState(0);
  const [eaVar, setEaVar] = useState('stockKegs');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!outletId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fetchFor = async (col: string) => {
          try {
            const qRef = query(collection(db, col), where('outletId', '==', outletId as string), orderBy('createdAt', 'asc'));
            const snap = await getDocs(qRef);
            return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Doc[];
          } catch {
            const qRef = query(collection(db, col), where('outletId', '==', outletId as string));
            const snap = await getDocs(qRef);
            return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Doc[];
          }
        };
        const [qrDocs, srdDocs, eaDocs, attDocs] = await Promise.all([
          fetchFor('sales_report_quick'),
          fetchFor('sales_report_detail'),
          fetchFor('task_early_assessment'),
          fetchFor('task_attendance'),
        ]);
        if (cancelled) return;
        setQr(qrDocs);
        setSrd(srdDocs);
        setEa(eaDocs);
        setAtt(attDocs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [outletId]);

  const qrMonthly = useMemo(() => groupMonthly(qr, monthsBack), [qr, monthsBack]);
  const srdMonthly = useMemo(() => groupMonthly(srd, monthsBack), [srd, monthsBack]);
  const eaMonthly = useMemo(() => groupMonthly(ea, monthsBack), [ea, monthsBack]);
  const attMonthly = useMemo(() => groupMonthly(att, monthsBack), [att, monthsBack]);

  const QR_VAR_OPTIONS = [
    { label: 'Kegs 330', key: 'salesKegs330' },
    { label: 'Kegs 500', key: 'salesKegs500' },
    { label: 'Microdraught 500', key: 'salesMd500' },
    { label: 'GDIC 400', key: 'salesGdic400' },
    { label: 'Smooth Pint 330', key: 'salesSmoothPint330' },
    { label: 'Smooth Can 330', key: 'salesSmoothCan330' },
    { label: 'GFES Pint 330', key: 'salesGfesPint330' },
    { label: 'GFES Can 330', key: 'salesGfesCan330' },
    { label: 'GFES Quart 620', key: 'salesGfesQuart620' },
    { label: 'GFES Can Big 500', key: 'salesGfesCanbig500' },
  ];
  const SRD_VAR_OPTIONS = [
    { label: 'Visitors Overall', key: 'visitorsOverall' },
    { label: 'Visitors Alcohol Drinkers', key: 'visitorsAlcoholDrinkers' },
    { label: 'Visitors All Beer Drinkers', key: 'visitorsAllBeerDrinkers' },
    { label: 'Visitors All Guinness', key: 'visitorsAllGuinness' },
    { label: 'Visitors All Competitor', key: 'visitorsAllCompetitor' },
    { label: 'Guinness Total Sales', key: 'totalGuinnessSales' },
    { label: 'Drinkers Smooth', key: 'drinkersSmooth' },
    { label: 'Drinkers GFES', key: 'drinkersGfes' },
    { label: 'Drinkers Kegs', key: 'drinkersKegs' },
    { label: 'Drinkers Microdraught', key: 'drinkersMicrodraught' },
  ];
  // Grouped SRD options
  const SRD_GROUPS = [
    { label: 'Guinness Selling', key: 'selling' as const },
    { label: 'Call & Customers', key: 'calls' as const },
    { label: 'Promotions', key: 'promos' as const },
    { label: 'Visitors & Consumers', key: 'visitors' as const },
    { label: 'Tables', key: 'tables' as const },
    { label: 'Competitor Sales', key: 'competitor' as const },
    { label: 'Programs & Digital', key: 'programs' as const },
  ];
  const SRD_SELLING_OPTIONS = [
    { label: 'Kegs 330', key: 'salesKegs330' },
    { label: 'Kegs 500', key: 'salesKegs500' },
    { label: 'Microdraught 500', key: 'salesMd500' },
    { label: 'GDIC 400', key: 'salesGdic400' },
    { label: 'Smooth Pint 330', key: 'salesSmoothPint330' },
    { label: 'Smooth Can 330', key: 'salesSmoothCan330' },
    { label: 'GFES Pint 330', key: 'salesGfesPint330' },
    { label: 'GFES Can 330', key: 'salesGfesCan330' },
    { label: 'GFES Quart 620', key: 'salesGfesQuart620' },
    { label: 'GFES Can Big 500', key: 'salesGfesCanbig500' },
    { label: 'Total Guinness Sales', key: 'totalGuinnessSales' },
  ];
  const SRD_CALLS_OPTIONS = [
    { label: 'Calls/Offers', key: 'callsOffers' },
    { label: 'Effective Calls/Buyers/Shops', key: 'effectiveCalls' },
  ];
  const SRD_VISITORS_OPTIONS = SRD_VAR_OPTIONS;
  const SRD_TABLES_OPTIONS = [
    { label: 'Tables Overall', key: 'tablesOverall' },
    { label: 'Tables Alcohol Drinkers', key: 'tablesAlcoholDrinkers' },
    { label: 'Tables Non Alcohol Drinkers', key: 'tablesNonAlcoholDrinkers' },
    { label: 'Tables All Beer Drinkers', key: 'tablesAllBeerDrinkers' },
    { label: 'Tables All Guinness', key: 'tablesAllGuinness' },
    { label: 'Tables All Competitor', key: 'tablesAllCompetitor' },
    { label: 'Tables Mixed', key: 'tablesAllGuinnessMixedCompetitor' },
  ];
  const SRD_COMPETITOR_OPTIONS = [
    { label: 'Bintang Promo Sold', key: 'competitorBintangPromoSold' },
    { label: 'Bintang Crystal Promo Sold', key: 'competitorBintangCrystalPromoSold' },
    { label: 'Heineken Promo Sold', key: 'competitorHeinekenPromoSold' },
    { label: 'Heineken Import Promo Sold', key: 'competitorHeinekenImportPromoSold' },
    { label: 'Erdinger Import Promo Sold', key: 'competitorErdingerImportPromoSold' },
    { label: 'Budweizer Import Promo Sold', key: 'competitorBudweizerImportPromoSold' },
    { label: 'Anker Promo Sold', key: 'competitorAnkerPromoSold' },
    { label: 'Bali Hai Promo Sold', key: 'competitorBalihaiPromoSold' },
    { label: 'Prost Promo Sold', key: 'competitorProstPromoSold' },
    { label: 'San Miguel Promo Sold', key: 'competitorSanMiguelPromoSold' },
    { label: 'Singaraja Promo Sold', key: 'competitorSingarajaPromoSold' },
    { label: 'Kura Kura Promo Sold', key: 'competitorKuraKuraPromoSold' },
    { label: 'Island Brewing Promo Sold', key: 'competitorIslandBrewingPromoSold' },
    { label: 'Others Promo Sold', key: 'competitorOthersPromoSold' },
    { label: 'Competitor Activity SPG Total', key: 'competitorActivitySpgTotal' },
  ];
  const SRD_PROMO_OPTIONS = [
    { label: 'Packages Sold (All)', key: 'packagesSold' },
    { label: 'Repeat Orders (All)', key: 'repeatOrders' },
    // Smooth
    { label: 'Promo Smooth Sold', key: 'promoSmoothSold' },
    { label: 'Promo Smooth Repeat Orders', keys: ['promoSmoothRepeatOrders', 'promoSmoothRepeatOrder'] },
    { label: 'Promo Smooth Sold (Type 2)', key: 'promoSmoothSoldType2' },
    { label: 'Promo Smooth Repeat Orders (Type 2)', keys: ['promoSmoothRepeatOrdersType2', 'promoSmoothRepeatOrderType2'] },
    // GFES
    { label: 'Promo GFES Sold', key: 'promoGfesSold' },
    { label: 'Promo GFES Repeat Orders', keys: ['promoGfesRepeatOrders', 'promoGfesRepeatOrder'] },
    { label: 'Promo GFES Sold (Type 2)', key: 'promoGfesSoldType2' },
    { label: 'Promo GFES Repeat Orders (Type 2)', keys: ['promoGfesRepeatOrdersType2', 'promoGfesRepeatOrderType2'] },
    // KEGS
    { label: 'Promo KEGS Sold', key: 'promoKegsSold' },
    { label: 'Promo KEGS Repeat Orders', keys: ['promoKegsRepeatOrders', 'promoKegsRepeatOrder'] },
    { label: 'Promo KEGS Sold (Type 2)', key: 'promoKegsSoldType2' },
    { label: 'Promo KEGS Repeat Orders (Type 2)', keys: ['promoKegsRepeatOrdersType2', 'promoKegsRepeatOrderType2'] },
    // Microdraught
    { label: 'Promo Microdraught Sold', key: 'promoMicrodraughtSold' },
    { label: 'Promo Microdraught Repeat Orders', keys: ['promoMicrodraughtRepeatOrders', 'promoMicrodraughtRepeatOrder'] },
    { label: 'Promo Microdraught Sold (Type 2)', key: 'promoMicrodraughtSoldType2' },
    { label: 'Promo Microdraught Repeat Orders (Type 2)', keys: ['promoMicrodraughtRepeatOrdersType2', 'promoMicrodraughtRepeatOrderType2'] },
    // GDIC
    { label: 'Promo GDIC Sold', key: 'promoGdicSold' },
    { label: 'Promo GDIC Repeat Orders', keys: ['promoGdicRepeatOrders', 'promoGdicRepeatOrder'] },
    { label: 'Promo GDIC Sold (Type 2)', key: 'promoGdicSoldType2' },
    { label: 'Promo GDIC Repeat Orders (Type 2)', keys: ['promoGdicRepeatOrdersType2', 'promoGdicRepeatOrderType2'] },
  ];
  const SRD_PROGRAM_OPTIONS = [
    // Stoutie Program
    { label: 'Stoutie Call Reach', key: 'stoutieProgramCallReach' },
    { label: 'Stoutie Packet Sold', key: 'stoutieProgramPacketSold' },
    { label: 'Stoutie Engage - People', key: 'stoutieProgramEngagePeople' },
    // Loyalty Program
    { label: 'Loyalty Call Reach', key: 'loyaltyProgramCallReach' },
    { label: 'Loyalty Packet Sold', key: 'loyaltyProgramPacketSold' },
    { label: 'Loyalty Engage - People', key: 'loyaltyProgramEngagePeople' },
    // Brightball Program
    { label: 'Brightball Call Reach', key: 'brightballCallReach' },
    { label: 'Brightball Packet Sold', key: 'brightballPacketSold' },
    { label: 'Brightball Engage - People', key: 'brightballEngagePeople' },
    // SOV Program
    { label: 'SOV Call Reach', key: 'sovProgramCallReach' },
    { label: 'SOV Packet Sold', key: 'sovProgramPacketSold' },
    { label: 'SOV Engage - People', key: 'sovProgramEngagePeople' },
  ];
  const EA_VAR_OPTIONS = [
    { label: 'Stock Kegs', key: 'stockKegs' },
    { label: 'Stock Microdraught', key: 'stockMicrodraught' },
    { label: 'Stock GDIC', key: 'stockGdic' },
    { label: 'Stock Smooth Pint 330', key: 'stockSmoothPint330' },
    { label: 'Stock Smooth Can 330', key: 'stockSmoothCan330' },
    { label: 'Stock GFES Pint 330', key: 'stockGfesPint330' },
    { label: 'Stock GFES Can 330', key: 'stockGfesCan330' },
    { label: 'Stock GFES 620', key: 'stockGfes620' },
    { label: 'Stock GFES Can Big 500', key: 'stockGfesCanBig500' },
  ];

  function parseNum(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val) || 0;
    return 0;
  }

  function monthlySumByKey(docs: Doc[], key: string, months: number) {
    const map = new Map<string, number>();
    const since = monthsAgoDate(months);
    for (const d of docs) {
      const dt = d.createdAt?.toDate ? d.createdAt.toDate() : undefined;
      if (!dt || dt < since) continue;
      const label = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const cur = map.get(label) || 0;
      map.set(label, cur + parseNum(d[key]));
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const last = entries.slice(-months);
    return last.map(([label, value]) => ({ label, value }));
  }

  function monthlySumByKeys(docs: Doc[], keys: string[], months: number) {
    const map = new Map<string, number>();
    const since = monthsAgoDate(months);
    for (const d of docs) {
      const dt = d.createdAt?.toDate ? d.createdAt.toDate() : undefined;
      if (!dt || dt < since) continue;
      const label = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      const cur = map.get(label) || 0;
      const add = keys.reduce((sum, k) => sum + parseNum(d[k]), 0);
      map.set(label, cur + add);
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const last = entries.slice(-months);
    return last.map(([label, value]) => ({ label, value }));
  }

  function summaryByKey(docs: Doc[], key: string, months: number) {
    const since = monthsAgoDate(months);
    const values: number[] = [];
    for (const d of docs) {
      if (!inRange(d.createdAt, since)) continue;
      const v = parseNum(d[key]);
      if (!Number.isNaN(v)) values.push(v);
    }
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length ? total / values.length : 0;
    return { total, avg, count: values.length };
  }

  function summaryByKeys(docs: Doc[], keys: string[], months: number) {
    const since = monthsAgoDate(months);
    const values: number[] = [];
    for (const d of docs) {
      if (!inRange(d.createdAt, since)) continue;
      const v = keys.reduce((sum, k) => sum + parseNum(d[k]), 0);
      if (!Number.isNaN(v)) values.push(v);
    }
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length ? total / values.length : 0;
    return { total, avg, count: values.length };
  }

  const currentSrdOptions = useMemo(() => {
    switch (srdGroup) {
      case 'selling':
        return SRD_SELLING_OPTIONS;
      case 'calls':
        return SRD_CALLS_OPTIONS;
      case 'promos':
        return SRD_PROMO_OPTIONS as any[];
      case 'tables':
        return SRD_TABLES_OPTIONS;
      case 'competitor':
        return SRD_COMPETITOR_OPTIONS;
      case 'programs':
        return SRD_PROGRAM_OPTIONS;
      case 'visitors':
      default:
        return SRD_VISITORS_OPTIONS;
    }
  }, [srdGroup]);

  useEffect(() => {
    // Reset metric when group changes
    setSrdVarIndex(0);
  }, [srdGroup]);

  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}> 
        <ActivityIndicator />
      </View>
    );
  }

  const title = outletName ? `History • ${String(outletName)}` : 'Outlet History';

  return (
    <View style={styles.screen}>
      <FilterHeader
        title={title}
        search={search}
        status={''}
        statusOptions={[]}
        storageKey={`filters:outlet-history:${outletId}`}
        sortAsc={sortAsc}
        onApply={({ search: s }) => setSearch(s)}
        onClear={() => setSearch('')}
      />
      <View style={styles.filtersRow}>
        <Text style={styles.filtersLabel}>Timeframe</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={monthsBack} onValueChange={(v) => setMonthsBack(Number(v))}>
            <Picker.Item label="Last 3 months" value={3} />
            <Picker.Item label="Last 6 months" value={6} />
            <Picker.Item label="Last 12 months" value={12} />
          </Picker>
        </View>
      </View>
      <View style={styles.segmentRow}>
        <SecondaryButton title="QR" onPress={() => setActive('QR')} style={[styles.segmentBtn, active === 'QR' ? styles.segmentActive : undefined].filter(Boolean) as any} />
        <SecondaryButton title="SRD" onPress={() => setActive('SRD')} style={[styles.segmentBtn, active === 'SRD' ? styles.segmentActive : undefined].filter(Boolean) as any} />
        <SecondaryButton title="Assessment" onPress={() => setActive('EA')} style={[styles.segmentBtn, active === 'EA' ? styles.segmentActive : undefined].filter(Boolean) as any} />
        <SecondaryButton title="Attendance" onPress={() => setActive('ATT')} style={[styles.segmentBtn, active === 'ATT' ? styles.segmentActive : undefined].filter(Boolean) as any} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing(12) }}>
        {active === 'QR' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Sales Report (Monthly)</Text>
            <SimpleBarChart data={qrMonthly} color={palette.primary} />
            <Text style={styles.meta}>Total: <Text style={styles.metaStrong}>{qrMonthly.reduce((a, b) => a + (b.value || 0), 0)}</Text></Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>Guinness Selling</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={qrVar} onValueChange={(v) => setQrVar(String(v))}>
                {QR_VAR_OPTIONS.map(opt => (
                  <Picker.Item key={opt.key} label={opt.label} value={opt.key} />
                ))}
              </Picker>
            </View>
            {(() => {
              const m = monthlySumByKey(qr, qrVar, monthsBack);
              const s = summaryByKey(qr, qrVar, monthsBack);
              return (
                <>
                  <SimpleBarChart data={m} color={palette.primary} />
                  <Text style={styles.meta}>Total {qrVar}: <Text style={styles.metaStrong}>{Math.round(s.total)}</Text> • Avg per report: <Text style={styles.metaStrong}>{s.avg.toFixed(2)}</Text></Text>
                </>
              );
            })()}
          </View>
        )}
        {active === 'SRD' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sales Report Detail (Monthly)</Text>
            <SimpleBarChart data={srdMonthly} color={palette.info} />
            <Text style={styles.meta}>Total: <Text style={styles.metaStrong}>{srdMonthly.reduce((a, b) => a + (b.value || 0), 0)}</Text></Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>SRD Group</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={srdGroup} onValueChange={(v) => setSrdGroup(v)}>
                {SRD_GROUPS.map(g => (
                  <Picker.Item key={g.key} label={g.label} value={g.key} />
                ))}
              </Picker>
            </View>
            <Text style={[styles.cardTitle, { marginTop: spacing(2) }]}>Metric</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={srdVarIndex} onValueChange={(v) => setSrdVarIndex(Number(v))}>
                {currentSrdOptions.map((opt, idx) => (
                  <Picker.Item key={(opt.key || (opt.keys || []).join('+')) + ':' + idx} label={opt.label} value={idx} />
                ))}
              </Picker>
            </View>
            {(() => {
              const opt = currentSrdOptions[srdVarIndex] || currentSrdOptions[0];
              const color = palette.info;
              if (!opt) return null;
              if (opt.keys && Array.isArray(opt.keys)) {
                const m = monthlySumByKeys(srd, opt.keys, monthsBack);
                const s = summaryByKeys(srd, opt.keys, monthsBack);
                return (
                  <>
                    <SimpleBarChart data={m} color={color} />
                    <Text style={styles.meta}>Total {opt.label}: <Text style={styles.metaStrong}>{Math.round(s.total)}</Text> • Avg per report: <Text style={styles.metaStrong}>{s.avg.toFixed(2)}</Text></Text>
                  </>
                );
              } else if (opt.key) {
                const m = monthlySumByKey(srd, opt.key, monthsBack);
                const s = summaryByKey(srd, opt.key, monthsBack);
                return (
                  <>
                    <SimpleBarChart data={m} color={color} />
                    <Text style={styles.meta}>Total {opt.label}: <Text style={styles.metaStrong}>{Math.round(s.total)}</Text> • Avg per report: <Text style={styles.metaStrong}>{s.avg.toFixed(2)}</Text></Text>
                  </>
                );
              }
              return null;
            })()}
          </View>
        )}
        {active === 'EA' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Early Assessment (Monthly)</Text>
            <SimpleBarChart data={eaMonthly} color={palette.warning} />
            <Text style={styles.meta}>Total: <Text style={styles.metaStrong}>{eaMonthly.reduce((a, b) => a + (b.value || 0), 0)}</Text></Text>
            <View style={styles.divider} />
            <Text style={styles.cardTitle}>Stocks</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={eaVar} onValueChange={(v) => setEaVar(String(v))}>
                {EA_VAR_OPTIONS.map(opt => (
                  <Picker.Item key={opt.key} label={opt.label} value={opt.key} />
                ))}
              </Picker>
            </View>
            {(() => {
              const m = monthlySumByKey(ea, eaVar, monthsBack);
              const s = summaryByKey(ea, eaVar, monthsBack);
              return (
                <>
                  <SimpleBarChart data={m} color={palette.warning} />
                  <Text style={styles.meta}>Total {eaVar}: <Text style={styles.metaStrong}>{Math.round(s.total)}</Text> • Avg per report: <Text style={styles.metaStrong}>{s.avg.toFixed(2)}</Text></Text>
                </>
              );
            })()}
          </View>
        )}
        {active === 'ATT' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attendance (Monthly)</Text>
            <SimpleBarChart data={attMonthly} color={palette.success} />
            <Text style={styles.meta}>Total: <Text style={styles.metaStrong}>{attMonthly.reduce((a, b) => a + (b.value || 0), 0)}</Text></Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, padding: spacing(4) },
  segmentRow: { flexDirection: 'row', gap: spacing(2), marginBottom: spacing(3) },
  segmentBtn: { flex: 1 },
  segmentActive: { borderColor: palette.primary },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(4), marginBottom: spacing(3), borderWidth: 1, borderColor: palette.border, ...shadow.card },
  cardTitle: { fontSize: 16, fontWeight: '700', color: palette.text, marginBottom: spacing(2) },
  meta: { fontSize: 13, color: palette.textMuted, marginTop: spacing(2) },
  metaStrong: { color: palette.text },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: spacing(3) },
  filtersRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(3), gap: spacing(3) },
  filtersLabel: { fontSize: 12, color: palette.textMuted },
  pickerWrapper: { borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, backgroundColor: palette.surfaceAlt },
});
