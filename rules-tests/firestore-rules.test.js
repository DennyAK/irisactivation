const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc } = require('firebase/firestore');

jest.setTimeout(120000);

let testEnv;

beforeAll(async () => {
  const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.uid-only.rules'), 'utf8');
  // Rely on firebase emulators:exec to set FIRESTORE_EMULATOR_HOST
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: { rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore UID-only rules', () => {
  test('BA assigned can set Attendance to pending, TL approves, AM approves', async () => {
    const ba = testEnv.authenticatedContext('ba-uid', { role: 'Iris - BA' });
    const tl = testEnv.authenticatedContext('tl-uid', { role: 'Iris - TL' });
    const am = testEnv.authenticatedContext('am-uid', { role: 'area manager' });

    const baDb = ba.firestore();
    const tlDb = tl.firestore();
    const amDb = am.firestore();

  const ref = doc(baDb, 'task_attendance/att-1');
    // Seed as admin via withSecurityRulesDisabled
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      // seed users
      await setDoc(doc(adminDb, 'users/ba-uid'), { role: 'Iris - BA' });
      await setDoc(doc(adminDb, 'users/tl-uid'), { role: 'Iris - TL' });
      await setDoc(doc(adminDb, 'users/am-uid'), { role: 'area manager' });
      await setDoc(doc(adminDb, 'task_attendance/att-1'), {
        taskAttendanceStatus: '',
        assignedToBA: 'ba-uid',
        assignedToTL: 'tl-uid',
      });
    });

    await assertSucceeds(updateDoc(ref, { taskAttendanceStatus: 'pending' }));
    await assertSucceeds(updateDoc(doc(tlDb, 'task_attendance/att-1'), { taskAttendanceStatus: 'approved by TL' }));
    await assertSucceeds(updateDoc(doc(amDb, 'task_attendance/att-1'), { taskAttendanceStatus: 'approved by AM' }));
  });

  test('Unassigned BA cannot update Attendance', async () => {
    const ba = testEnv.authenticatedContext('ba2', { role: 'Iris - BA' });
    const baDb = ba.firestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'users/ba2'), { role: 'Iris - BA' });
      await setDoc(doc(adminDb, 'users/ba-uid'), { role: 'Iris - BA' });
      await setDoc(doc(adminDb, 'users/tl-uid'), { role: 'Iris - TL' });
      await setDoc(doc(adminDb, 'task_attendance/att-2'), {
        taskAttendanceStatus: '',
        assignedToBA: 'ba-uid',
        assignedToTL: 'tl-uid',
      });
    });
    await assertFails(updateDoc(doc(baDb, 'task_attendance/att-2'), { taskAttendanceStatus: 'pending' }));
  });

  test('BA assigned can update Attendance check-in fields without changing status', async () => {
    const ba = testEnv.authenticatedContext('ba-uid', { role: 'Iris - BA' });
    const baDb = ba.firestore();
    // Seed data with assignment and empty status
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'users/ba-uid'), { role: 'Iris - BA' });
      await setDoc(doc(adminDb, 'task_attendance/att-geo'), {
        taskAttendanceStatus: '',
        assignedToBA: 'ba-uid',
      });
    });
    // Update geolocation + checkIn timestamp without touching status
    await assertSucceeds(updateDoc(doc(baDb, 'task_attendance/att-geo'), {
      checkIn: { '.sv': 'timestamp' }, // emu-friendly placeholder, not strictly required
      checkInLatitude: 1.23,
      checkInLongitude: 4.56,
      updatedBy: 'ba-uid',
    }));
  });

  test('SRD: BA -> TL -> AM happy path', async () => {
    const ba = testEnv.authenticatedContext('ba-uid', { role: 'Iris - BA' });
    const tl = testEnv.authenticatedContext('tl-uid', { role: 'Iris - TL' });
    const am = testEnv.authenticatedContext('am-uid', { role: 'area manager' });

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'users/ba-uid'), { role: 'Iris - BA' });
      await setDoc(doc(adminDb, 'users/tl-uid'), { role: 'Iris - TL' });
      await setDoc(doc(adminDb, 'users/am-uid'), { role: 'area manager' });
      await setDoc(doc(adminDb, 'sales_report_detail/srd-1'), {
        salesReportDetailStatus: '',
        assignedToBA: 'ba-uid',
        assignedToTL: 'tl-uid',
    createdBy: 'ba-uid'
      });
    });

  await assertSucceeds(updateDoc(doc(ba.firestore(), 'sales_report_detail/srd-1'), { salesReportDetailStatus: 'Done By BA', updatedBy: 'ba-uid' }));
  await assertSucceeds(updateDoc(doc(tl.firestore(), 'sales_report_detail/srd-1'), { salesReportDetailStatus: 'Done by TL', updatedBy: 'tl-uid' }));
  await assertSucceeds(updateDoc(doc(am.firestore(), 'sales_report_detail/srd-1'), { salesReportDetailStatus: 'Done by AM', updatedBy: 'am-uid' }));
  });
});
