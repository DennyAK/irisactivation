#!/usr/bin/env node
/*
 Backfill actorName and actorEmail into audit_logs by looking up users/{actorId}.

 Usage (PowerShell examples):
   node scripts/backfill-audit-actors.js --serviceAccount C:\path\to\svc.json --project activation-d6f75 --sinceDays 180 --apply

 Flags:
   --serviceAccount  Path to a service account JSON file (required in CI or when ADC not set)
   --project         Firebase project ID (required if not derivable)
   --sinceDays       Only process logs with timestamp in the last N days (default 180)
   --limit           Max docs to process (default 2000)
   --apply           Perform updates. Without this flag, the script runs a dry run.
*/

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { apply: false, sinceDays: 180, limit: 2000 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--apply') out.apply = true;
    else if (a === '--serviceAccount') out.serviceAccount = args[++i];
    else if (a === '--project') out.projectId = args[++i];
    else if (a === '--sinceDays') out.sinceDays = parseInt(args[++i], 10) || out.sinceDays;
    else if (a === '--limit') out.limit = parseInt(args[++i], 10) || out.limit;
  }
  return out;
}

async function initAdmin({ serviceAccount, projectId }) {
  if (serviceAccount) {
    const p = path.resolve(serviceAccount);
    const content = JSON.parse(fs.readFileSync(p, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(content), projectId: projectId || content.project_id });
  } else {
    admin.initializeApp({ projectId });
  }
}

function deriveActor(u) {
  const email = (u.email) || null;
  const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
  const displayName = u.displayName || '';
  const actorName = fullName || displayName || email || null;
  return { actorName, actorEmail: email };
}

async function run() {
  const opts = parseArgs();
  await initAdmin(opts);
  const db = admin.firestore();
  const start = new Date();
  start.setDate(start.getDate() - (opts.sinceDays || 180));

  console.log(`Scanning audit_logs since ${start.toISOString()} (limit=${opts.limit})...`);
  let processed = 0;
  let updated = 0;

  const q = db.collection('audit_logs')
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(start))
    .orderBy('timestamp', 'desc')
    .limit(opts.limit || 2000);

  const snap = await q.get();
  const docs = snap.docs;
  console.log(`Fetched ${docs.length} log docs`);

  const byActor = new Map();
  for (const d of docs) {
    const data = d.data() || {};
    const actorId = data.actorId || null;
    const hasNames = !!(data.actorName || data.actorEmail);
    if (!actorId || hasNames) continue;
    byActor.set(actorId, true);
  }

  const actorInfo = new Map();
  for (const actorId of byActor.keys()) {
    try {
      const u = await db.collection('users').doc(actorId).get();
      if (u.exists) actorInfo.set(actorId, deriveActor(u.data() || {}));
      else actorInfo.set(actorId, { actorName: null, actorEmail: null });
    } catch (e) {
      console.warn(`Failed to load user ${actorId}:`, e.message || e);
      actorInfo.set(actorId, { actorName: null, actorEmail: null });
    }
  }

  const batchSize = 400;
  let batch = db.batch();
  let inBatch = 0;

  for (const d of docs) {
    const data = d.data() || {};
    const actorId = data.actorId || null;
    const hasNames = !!(data.actorName || data.actorEmail);
    processed++;
    if (!actorId || hasNames) continue;
    const info = actorInfo.get(actorId);
    if (!info) continue;
    batch.update(d.ref, info);
    inBatch++;
    updated++;
    if (inBatch >= batchSize) {
      if (opts.apply) await batch.commit();
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0 && opts.apply) await batch.commit();

  console.log(`Processed ${processed} docs. Will update ${updated} docs.`);
  if (!opts.apply) console.log('Dry run complete. Re-run with --apply to write changes.');
}

run().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
