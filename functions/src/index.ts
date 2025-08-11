import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from 'firebase-functions/v2/firestore';

admin.initializeApp();
const db = admin.firestore();

// Collections to audit
const audited = [
  'activations',
  'projects',
  'outlets',
  'sales_report_quick',
  'sales_report_detail',
  'task_attendance',
  'task_early_assessment',
  'tasks',
];

async function writeLog(entry: any) {
  await db.collection('audit_logs').add({
    ...entry,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function diff(before: FirebaseFirestore.DocumentData, after: FirebaseFirestore.DocumentData) {
  const changed: string[] = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const k of keys) {
    const b = before?.[k];
    const a = after?.[k];
    const bv = b && typeof (b as any).toDate === 'function' ? (b as any).toDate().toISOString() : b;
    const av = a && typeof (a as any).toDate === 'function' ? (a as any).toDate().toISOString() : a;
    if (JSON.stringify(bv) !== JSON.stringify(av)) changed.push(k);
  }
  return changed;
}

function actorFromDoc(data: FirebaseFirestore.DocumentData | undefined) {
  const candidate = (data && (data.updatedBy || data.createdBy)) || null;
  return { actorId: candidate };
}

async function getActorInfo(actorId?: string | null): Promise<{ actorName?: string | null; actorEmail?: string | null }> {
  if (!actorId) return {};
  try {
    const snap = await db.collection('users').doc(actorId).get();
    if (!snap.exists) return {};
    const u = snap.data() || {} as any;
    const actorEmail = (u.email as string) || null;
    const fullName = `${(u.firstName || '')} ${(u.lastName || '')}`.trim();
    const displayName = (u.displayName as string) || '';
    const actorName = (fullName || displayName || actorEmail || null) as string | null;
    return { actorName, actorEmail };
  } catch {
    return {};
  }
}

for (const col of audited) {
  exports[`${col}OnCreate`] = onDocumentCreated(`/${col}/{id}`, async (event) => {
    const snap = event.data;
    if (!snap) return;
    const after = snap.data();
    const { actorId } = actorFromDoc(after);
  const actorInfo = await getActorInfo(actorId || undefined);
  await writeLog({ action: 'create', collection: col, docId: snap.id, actorId, ...actorInfo, after });
  });

  exports[`${col}OnUpdate`] = onDocumentUpdated(`/${col}/{id}`, async (event) => {
    const before = event.data?.before?.data() || {};
    const after = event.data?.after?.data() || {};
    const docId = event.params.id;
    const changedFields = diff(before, after);
    const { actorId } = actorFromDoc(after);
  const actorInfo = await getActorInfo(actorId || undefined);
  await writeLog({ action: 'update', collection: col, docId, actorId, ...actorInfo, before, after, changedFields });
  });

  exports[`${col}OnDelete`] = onDocumentDeleted(`/${col}/{id}`, async (event) => {
    const beforeSnap = event.data;
    if (!beforeSnap) return;
    const before = beforeSnap.data();
    const docId = event.params.id;
    const { actorId } = actorFromDoc(before);
  const actorInfo = await getActorInfo(actorId || undefined);
  await writeLog({ action: 'delete', collection: col, docId, actorId, ...actorInfo, before });
  });
}
