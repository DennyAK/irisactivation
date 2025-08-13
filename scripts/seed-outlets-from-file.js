// Seeds outlets from a JSON file into Firestore collection `outlets`.
// Usage:
//   node scripts/seed-outlets-from-file.js [pathToJson] [credPath] [projectId] [--dry] [--upsert]
// Requires: serviceAccountKey.json in project root or set GOOGLE_APPLICATION_CREDENTIALS.

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

(async () => {
  // Basic argv parsing with flags: --cred <path>, --project <id>, --dry, --upsert
  const argv = process.argv.slice(2);
  let inputPath = path.join('data', 'seed_outlets.json');
  let credPathArg = undefined;
  let projectIdArg = process.env.FIREBASE_PROJECT_ID || undefined;
  let isDry = false;
  let isUpsert = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry') { isDry = true; continue; }
    if (a === '--upsert') { isUpsert = true; continue; }
    if (a === '--cred' || a === '--serviceAccount' || a === '--sa') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { credPathArg = next; i++; }
      continue;
    }
    if (a.startsWith('--cred=')) { credPathArg = a.split('=')[1]; continue; }
    if (a === '--project') {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { projectIdArg = next; i++; }
      continue;
    }
    if (a.startsWith('--project=')) { projectIdArg = a.split('=')[1]; continue; }
    // First non-flag argument is the input JSON path
    if (!a.startsWith('--') && inputPath === path.join('data', 'seed_outlets.json')) {
      inputPath = a;
      continue;
    }
  }

  try {
  const filePath = path.resolve(__dirname, '..', inputPath);
    if (!fs.existsSync(filePath)) {
      console.error(`JSON not found at ${filePath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.error('JSON must be an array of outlets.');
      process.exit(1);
    }

    // Initialize Firebase Admin
    let initialized = false;
    if (credPathArg && fs.existsSync(credPathArg)) {
      try {
        const sa = require(path.resolve(process.cwd(), credPathArg));
        admin.initializeApp({
          credential: admin.credential.cert(sa),
          projectId: projectIdArg || sa.project_id,
        });
        initialized = true;
      } catch (e) {
        console.warn('Failed to load provided credentials, falling back. Error:', e && e.message ? e.message : e);
      }
    }
    // Prefer explicit --cred
    // Fallback: Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
    if (!initialized) {
      admin.initializeApp({ projectId: projectIdArg });
    }

    const db = admin.firestore();

    // Preload existing outlets for upsert by name (case-insensitive)
    const existingByName = {};
    if (isUpsert) {
      const snap = await db.collection('outlets').get();
      snap.forEach(doc => {
        const o = doc.data();
        const name = (o.outletName || '').toString().trim().toLowerCase();
        if (name) existingByName[name] = doc.id;
      });
    }

    const normalized = data
      .map((o, idx) => {
        if (!o || typeof o !== 'object') return null;
        const outletName = (o.outletName ?? o.name ?? '').toString().trim();
        const outletProvince = (o.outletProvince ?? o.province ?? '').toString().trim();
        if (!outletName) return null;
        return {
          idx,
          outletName,
          outletProvince,
        };
      })
      .filter(Boolean);

    if (isDry) {
      console.log(`[DRY RUN] ${normalized.length} outlets would be ${isUpsert ? 'upserted' : 'created'} into 'outlets'. Example:`, normalized.slice(0, 5));
      process.exit(0);
    }

    const chunkSize = 400; // under 500 writes per batch
    let processed = 0;
    let created = 0;
    let updated = 0;

    for (let i = 0; i < normalized.length; i += chunkSize) {
      const batch = db.batch();
      const slice = normalized.slice(i, i + chunkSize);
      for (const item of slice) {
        const payload = {
          outletName: item.outletName,
          outletProvince: item.outletProvince || '',
          // Add mirror field for legacy use in some views
          province: item.outletProvince || '',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        let ref;
        if (isUpsert) {
          const key = item.outletName.toLowerCase();
          const existingId = existingByName[key];
          ref = existingId ? db.collection('outlets').doc(existingId) : db.collection('outlets').doc();
          if (existingId) updated++; else created++;
          batch.set(ref, payload, { merge: true });
        } else {
          ref = db.collection('outlets').doc();
          created++;
          batch.set(ref, payload);
        }
        processed++;
      }
      await batch.commit();
    }

  console.log(`Seed complete. Processed: ${processed}. Created: ${created}. Updated: ${updated}. Source: ${path.basename(inputPath)}.`);
    process.exit(0);
  } catch (err) {
    console.error('Outlets seeding failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
