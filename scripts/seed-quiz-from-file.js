// Seeds quiz questions from a JSON file into Firestore collection `quiz_questions`.
// Usage: node scripts/seed-quiz-from-file.js [pathToJson]
// Requires: serviceAccountKey.json in project root or set GOOGLE_APPLICATION_CREDENTIALS.

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function resolveServiceAccount() {
  // Prefer GOOGLE_APPLICATION_CREDENTIALS if set
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    return null; // will use application default creds
  }
  const saPath = path.resolve(__dirname, '..', 'serviceAccountKey.json');
  if (fs.existsSync(saPath)) return require(saPath);
  return null;
}

(async () => {
  try {
  const argPath = process.argv[2] || 'seedQuizQuestionsNew.json';
  const credPathArg = process.argv[3];
  const projectIdArg = process.argv[4];

  const filePath = path.resolve(__dirname, '..', argPath);
    if (!fs.existsSync(filePath)) {
      console.error(`JSON not found at ${filePath}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      console.error('JSON must be an array of questions.');
      process.exit(1);
    }

    let initialized = false;
    if (credPathArg && fs.existsSync(credPathArg)) {
      try {
        const sa = require(credPathArg);
        admin.initializeApp({
          credential: admin.credential.cert(sa),
          projectId: projectIdArg || sa.project_id,
        });
        initialized = true;
      } catch (e) {
        console.warn('Failed to load provided credentials path, falling back. Error:', e && e.message ? e.message : e);
      }
    }
    if (!initialized) {
      const serviceAccount = resolveServiceAccount();
      if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: projectIdArg || serviceAccount.project_id });
        initialized = true;
      }
    }
    if (!initialized) {
      // Fallback: application default credentials (ADC)
      admin.initializeApp({ projectId: projectIdArg });
    }

    const db = admin.firestore();

    const chunkSize = 400; // under 500 writes per batch limit
    let added = 0;

    for (let i = 0; i < data.length; i += chunkSize) {
      const batch = db.batch();
      const slice = data.slice(i, i + chunkSize);
      for (const q of slice) {
        // Basic validation/normalization
        if (!q || typeof q !== 'object' || !q.question || !q.answer || !q.options) continue;
        const ref = db.collection('quiz_questions').doc();
        batch.set(ref, {
          question: String(q.question),
          answer: String(q.answer),
          options: q.options,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        added++;
      }
      await batch.commit();
    }

  console.log(`Seeded ${added} quiz questions from ${path.basename(filePath)} into quiz_questions.`);
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
