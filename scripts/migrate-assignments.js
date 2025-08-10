#!/usr/bin/env node
/*
  Normalize assignment fields to UID-only across collections.
  - Reads users collection to build email -> uid map
  - Scans target collections and updates assignedToBA/assignedToTL if they currently store an email

  Usage:
    node scripts/migrate-assignments.js            # dry run (no writes)
    node scripts/migrate-assignments.js --apply    # perform writes

  Requires Firebase Admin credentials. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON or otherwise initialize default creds.
*/
const admin = require('firebase-admin');

function initAdmin() {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    return admin.firestore();
  } catch (e) {
    console.error('Failed to initialize firebase-admin. Ensure credentials are configured.');
    console.error(e && e.message ? e.message : e);
    process.exit(1);
  }
}

function looksLikeEmail(v) {
  return typeof v === 'string' && v.includes('@');
}

async function buildEmailUidMap(db) {
  const snap = await db.collection('users').get();
  const map = new Map();
  snap.forEach(doc => {
    const d = doc.data() || {};
    const email = d.email || d.userEmail || d.personnelEmail;
    if (email && typeof email === 'string') {
      map.set(email, doc.id);
    }
  });
  return map;
}

async function migrateCollection(db, emailToUid, collName, apply) {
  const snap = await db.collection(collName).get();
  let updates = 0;
  let scanned = 0;
  for (const doc of snap.docs) {
    scanned++;
    const d = doc.data() || {};
    const fields = ['assignedToBA', 'assignedToTL'];
    const update = {};
    for (const f of fields) {
      const val = d[f];
      if (looksLikeEmail(val) && emailToUid.has(val)) {
        update[f] = emailToUid.get(val);
        const legacyField = `${f}EmailLegacy`;
        if (!d[legacyField]) update[legacyField] = val;
      }
    }
    if (Object.keys(update).length) {
      updates++;
      if (apply) {
        await doc.ref.update(update);
        process.stdout.write(`Updated ${collName}/${doc.id}\n`);
      } else {
        process.stdout.write(`[dry-run] Would update ${collName}/${doc.id}: ${JSON.stringify(update)}\n`);
      }
    }
  }
  return { scanned, updates };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const db = initAdmin();
  const emailToUid = await buildEmailUidMap(db);
  const targets = [
    'sales_report_detail',
    'sales_report_quick',
    'task_attendance',
    'task_early_assessment',
  ];
  let totalScanned = 0;
  let totalUpdates = 0;
  for (const coll of targets) {
    const { scanned, updates } = await migrateCollection(db, emailToUid, coll, apply);
    totalScanned += scanned;
    totalUpdates += updates;
  }
  console.log(`Done. Scanned: ${totalScanned}, ${apply ? 'Updated' : 'Would update'}: ${totalUpdates}`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
