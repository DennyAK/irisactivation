import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { db, auth } from '../../firebaseConfig';
import { collection, getDocs, limit, orderBy, query, where, Timestamp, startAfter, doc, getDoc } from 'firebase/firestore';
import * as Clipboard from 'expo-clipboard';
import { palette, spacing, typography, radius, shadow } from '../../constants/Design';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { Roles, isAdminRole } from '../../constants/roles';

type AuditLog = {
  id: string;
  action: 'create' | 'update' | 'delete' | string;
  collection: string;
  docId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  changedFields?: string[];
  before?: any;
  after?: any;
  timestamp?: Timestamp | { seconds: number; nanoseconds: number } | Date | null;
};

const COLLECTIONS = [
  'activations',
  'projects',
  'outlets',
  'sales_report_quick',
  'sales_report_detail',
  'task_attendance',
  'task_early_assessment',
  'tasks',
] as const;

const RANGE_PRESETS = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
] as const;

function toDate(ts?: AuditLog['timestamp']): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  // Firestore Timestamp
  // @ts-ignore
  if (typeof ts.toDate === 'function') return ts.toDate();
  const anyTs = ts as any;
  if (typeof anyTs.seconds === 'number') return new Date(anyTs.seconds * 1000);
  return null;
}

export default function AuditLogsScreen() {
  const params = useLocalSearchParams<{ collection?: string; docId?: string }>();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rangeKey, setRangeKey] = useState<'7d' | '30d' | '90d'>('7d');
  const [collectionFilter, setCollectionFilter] = useState<string>(params.collection ? String(params.collection) : '');
  const [docIdFilter, setDocIdFilter] = useState<string>(params.docId ? String(params.docId) : '');
  const [detail, setDetail] = useState<AuditLog | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [actorIdFilter, setActorIdFilter] = useState<string>('');
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [actorMap, setActorMap] = useState<Record<string, { name?: string; email?: string }>>({});

  const startAt = useMemo(() => {
    const preset = RANGE_PRESETS.find(p => p.key === rangeKey) || RANGE_PRESETS[0];
    const d = new Date();
    d.setDate(d.getDate() - preset.days);
    return d;
  }, [rangeKey]);

  const canView = isAdminRole(userRole as any);

  const fetchRole = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) { setUserRole(null); return; }
      const { doc, getDoc } = await import('firebase/firestore');
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      setUserRole(snap.exists() ? (snap.data() as any).role || '' : '');
    } catch {
      setUserRole('');
    }
  }, []);

  const PAGE_SIZE = 100;

  const load = useCallback(async (reset: boolean = true) => {
    if (reset) {
      setLoading(true);
      setLastDoc(null);
      setHasMore(false);
      setRows([]);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const colRef = collection(db, 'audit_logs');
      let qBase = query(colRef, where('timestamp', '>=', startAt));
      if (collectionFilter) {
        qBase = query(qBase, where('collection', '==', collectionFilter));
      }
      qBase = query(qBase, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
      if (!reset && lastDoc) {
        let q2 = query(colRef, where('timestamp', '>=', startAt));
        if (collectionFilter) {
          q2 = query(q2, where('collection', '==', collectionFilter));
        }
        q2 = query(q2, orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
        qBase = q2;
      }
      const snap = await getDocs(qBase);
      const batch: AuditLog[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setRows(prev => (reset ? batch : [...prev, ...batch]));
      const last = snap.docs[snap.docs.length - 1] || null;
      setLastDoc(last);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [startAt, lastDoc]);

  useEffect(() => { fetchRole(); }, [fetchRole]);
  useEffect(() => { if (canView !== false) load(true); }, [load, canView]);
  
  // Backfill actor names/emails for older logs lacking this info
  useEffect(() => {
    // compute current filtered list locally to avoid referencing a variable before declaration
    const list = rows.filter(r => {
      const byCol = !collectionFilter || r.collection === collectionFilter;
      const byDoc = !docIdFilter || r.docId === docIdFilter;
      const byAction = !actionFilter || r.action === actionFilter;
      const byActor = !actorIdFilter || (r.actorId || '') === actorIdFilter;
      return byCol && byDoc && byAction && byActor;
    });
    const missingIds = new Set<string>();
    for (const r of list) {
      const id = (r.actorId || '') as string;
      if (!id) continue;
      const hasInDoc = !!(r.actorName || r.actorEmail);
      const hasInMap = !!actorMap[id];
      if (!hasInDoc && !hasInMap) missingIds.add(id);
      if (missingIds.size >= 25) break; // cap per pass
    }
    if (missingIds.size === 0) return;
    (async () => {
      const updates: Record<string, { name?: string; email?: string }> = {};
      await Promise.all(Array.from(missingIds).map(async (uid) => {
        try {
          const ref = doc(db, 'users', uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const u = snap.data() as any;
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
            const displayName = u.displayName as string | undefined;
            const email = (u.email as string) || undefined;
            updates[uid] = { name: (fullName || displayName || email), email };
          } else {
            updates[uid] = {};
          }
        } catch {
          updates[uid] = {};
        }
      }));
      if (Object.keys(updates).length) setActorMap(prev => ({ ...prev, ...updates }));
    })();
  }, [rows, collectionFilter, docIdFilter, actionFilter, actorIdFilter, actorMap]);

  const filtered = useMemo(() => {
    const docNeedle = docIdFilter.trim().toLowerCase();
    const actorNeedle = actorIdFilter.trim().toLowerCase();
    return rows.filter(r => {
      const byCol = !collectionFilter || r.collection === collectionFilter;
      const byDoc = !docNeedle || String(r.docId || '').toLowerCase().includes(docNeedle);
      const byAction = !actionFilter || r.action === actionFilter;
      const actorHay = [r.actorId, r.actorName, r.actorEmail].filter(Boolean).join(' ').toLowerCase();
      const byActor = !actorNeedle || actorHay.includes(actorNeedle);
      return byCol && byDoc && byAction && byActor;
    });
  }, [rows, collectionFilter, docIdFilter, actionFilter, actorIdFilter]);

  const toIso = (ts?: AuditLog['timestamp']): string => {
    const d = toDate(ts);
    return d ? d.toISOString() : '';
  };

  const escapeCsv = (v: any) => {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const copyCsv = async () => {
    try {
      const header = ['timestamp', 'collection', 'docId', 'action', 'actorName', 'actorEmail', 'actorId', 'changedFields'];
      const lines = [header.join(',')];
      for (const r of filtered) {
        const row = [
          escapeCsv(toIso(r.timestamp)),
          escapeCsv(r.collection),
          escapeCsv(r.docId),
          escapeCsv(r.action),
          escapeCsv(r.actorName || ''),
          escapeCsv(r.actorEmail || ''),
          escapeCsv(r.actorId || ''),
          escapeCsv((r.changedFields || []).join(';')),
        ];
        lines.push(row.join(','));
      }
      const csv = lines.join('\n');
      await Clipboard.setStringAsync(csv);
      Alert.alert('Copied', `Copied ${filtered.length} rows to clipboard as CSV.`);
    } catch (e: any) {
      Alert.alert('Copy failed', e.message || String(e));
    }
  };

  if (!canView) {
    return (
      <View style={styles.center}>
        <Text style={styles.denied}>Admins only. Your role: {userRole || 'unknown'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Audit Logs</Text>

      <View style={styles.filters}>
        <View style={styles.rangeRow}>
          {RANGE_PRESETS.map(p => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setRangeKey(p.key as any)}
              style={[styles.rangeBtn, rangeKey === p.key && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeBtnText, rangeKey === p.key && styles.rangeBtnTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <SecondaryButton title="Reset" onPress={() => { setCollectionFilter(''); setDocIdFilter(''); setActionFilter(''); setActorIdFilter(''); setRangeKey('7d'); }} />
          <PrimaryButton title="Refresh" onPress={() => load(true)} style={{ marginLeft: spacing(2) }} />
          <SecondaryButton title="Copy CSV" onPress={copyCsv} style={{ marginLeft: spacing(2) }} />
        </View>

        <View style={styles.pillsRow}>
          <ScrollPills
            items={[{ label: 'All', value: '' }, ...COLLECTIONS.map(c => ({ label: c, value: c }))]}
            value={collectionFilter}
            onChange={setCollectionFilter}
          />
        </View>

        <View style={styles.pillsRow}>
          <ScrollPills
            items={[
              { label: 'All actions', value: '' },
              { label: 'create', value: 'create' },
              { label: 'update', value: 'update' },
              { label: 'delete', value: 'delete' },
            ]}
            value={actionFilter}
            onChange={setActionFilter}
          />
        </View>

        <View style={styles.actorRow}>
          <TextInput
            placeholder="Filter by actor (id, name, or email)"
            placeholderTextColor={palette.textMuted}
            value={actorIdFilter}
            onChangeText={setActorIdFilter}
            style={styles.actorInput}
          />
          <TextInput
            placeholder="Filter by docId"
            placeholderTextColor={palette.textMuted}
            value={docIdFilter}
            onChangeText={setDocIdFilter}
            style={[styles.actorInput, { marginTop: spacing(2) }]}
          />
        </View>

        {docIdFilter ? (
          <TouchableOpacity onPress={() => setDocIdFilter('')} style={styles.docFilterChip}>
            <Text style={styles.docFilterText}>docId: {docIdFilter} (tap to clear)</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing(12) }}
          renderItem={({ item }) => {
      const ts = toDate(item.timestamp);
            const when = ts ? ts.toLocaleString() : '-';
            const fields = (item.changedFields || []).join(', ');
      const actorLabel = item.actorName || item.actorEmail || (item.actorId ? (actorMap[item.actorId]?.name || actorMap[item.actorId]?.email || item.actorId) : 'unknown');
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetail(item)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(1) }}>
                  <ActionPill action={item.action} />
                  <Text style={styles.cardTitle}>{item.collection}/{item.docId}</Text>
                </View>
        <Text style={styles.meta}>By {actorLabel} • {when}</Text>
                {item.action === 'update' && fields ? (
                  <Text style={styles.fields}>Changed: {fields}</Text>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={hasMore ? (
            <View style={{ paddingVertical: spacing(3) }}>
              {loadingMore ? (
                <ActivityIndicator />
              ) : (
                <SecondaryButton title="Load more" onPress={() => load(false)} />
              )}
            </View>
          ) : null}
        />
      )}

      <ModalSheet visible={!!detail} onClose={() => setDetail(null)} scroll>
        {detail && (
          <View>
            <Text style={styles.sheetTitle}>{detail.collection}/{detail.docId}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) }}>
              <ActionPill action={detail.action} />
              <Text style={[styles.meta, { marginLeft: spacing(2) }]}>By {detail.actorName || detail.actorEmail || detail.actorId || 'unknown'}</Text>
            </View>
            {detail.changedFields && detail.changedFields.length > 0 && (
              <Text style={styles.fields}>Changed: {detail.changedFields.join(', ')}</Text>
            )}
            {detail.before ? (
              <View style={styles.jsonBlock}>
                <Text style={styles.jsonTitle}>Before</Text>
                <Text style={styles.jsonText}>{pretty(detail.before)}</Text>
              </View>
            ) : null}
            {detail.after ? (
              <View style={styles.jsonBlock}>
                <Text style={styles.jsonTitle}>After</Text>
                <Text style={styles.jsonText}>{pretty(detail.after)}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ModalSheet>
    </View>
  );
}

function pretty(obj: any) {
  return JSON.stringify(obj, (k, v) => {
    if (v && v._seconds) {
      return new Date(v._seconds * 1000).toISOString();
    }
    if (v && v.seconds) {
      return new Date(v.seconds * 1000).toISOString();
    }
    return v;
  }, 2);
}

function ActionPill({ action }: { action?: string }) {
  const color = action === 'create' ? palette.success : action === 'delete' ? palette.danger : palette.info;
  const bg = action === 'create' ? '#ecfdf5' : action === 'delete' ? '#fef2f2' : '#eff6ff';
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: spacing(2), paddingVertical: spacing(1), borderRadius: 999, marginRight: spacing(2) }}>
      <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{(action || '').toUpperCase()}</Text>
    </View>
  );
}

function ScrollPills({ items, value, onChange }: { items: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(i) => i.value || 'all'}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => onChange(item.value)} style={[styles.pill, value === item.value && styles.pillActive]}>
          <Text style={[styles.pillText, value === item.value && styles.pillTextActive]}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  header: { ...typography.h1, color: palette.text, marginBottom: spacing(4) },
  filters: { marginBottom: spacing(3) },
  rangeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(2) },
  rangeBtn: { backgroundColor: palette.surface, borderRadius: radius.md, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), marginRight: spacing(2), borderWidth: 1, borderColor: '#e5e7eb' },
  rangeBtnActive: { backgroundColor: '#111827' },
  rangeBtnText: { fontSize: 12, color: palette.text },
  rangeBtnTextActive: { color: '#fff', fontWeight: '700' },
  pillsRow: { flexDirection: 'row' },
  pill: { backgroundColor: palette.surface, paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: 999, marginRight: spacing(2), borderWidth: 1, borderColor: '#e5e7eb' },
  pillActive: { backgroundColor: '#111827' },
  pillText: { fontSize: 12, color: palette.text },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  docFilterChip: { backgroundColor: '#eef2ff', paddingHorizontal: spacing(3), paddingVertical: spacing(1), alignSelf: 'flex-start', borderRadius: 999, marginTop: spacing(2) },
  docFilterText: { color: '#3730a3', fontWeight: '600', fontSize: 12 },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(4), marginBottom: spacing(3), ...shadow.card },
  cardTitle: { marginLeft: spacing(1), fontWeight: '700', color: palette.text },
  meta: { color: palette.textMuted, fontSize: 12 },
  fields: { marginTop: spacing(1), color: palette.text, fontSize: 12 },
  error: { color: palette.danger, padding: spacing(3) },
  sheetTitle: { ...typography.h2, color: palette.text, marginBottom: spacing(2) },
  jsonBlock: { backgroundColor: palette.surface, borderRadius: radius.md, padding: spacing(3), marginTop: spacing(3), borderWidth: 1, borderColor: '#e5e7eb' },
  jsonTitle: { fontWeight: '700', marginBottom: spacing(1), color: palette.text },
  jsonText: { fontFamily: 'monospace', color: palette.text },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: palette.bg },
  denied: { color: palette.text, opacity: 0.8 },
  actorRow: { marginTop: spacing(2) },
  actorInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    color: palette.text,
    backgroundColor: palette.surface,
  },
});
