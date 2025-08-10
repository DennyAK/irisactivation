const { canTransition, nextOptionsForRole } = require('../stateMachine');
const { SRDStatus, QRStatus, AttendanceStatus, EAStatus } = require('../status');

describe('stateMachine', () => {
  test('SRD transitions by role', () => {
    // BA: Empty -> Done By BA
    expect(canTransition('SRD', 'Iris - BA', SRDStatus.Empty, SRDStatus.DoneByBA)).toBe(true);
    // BA cannot jump to TL/AM
    expect(canTransition('SRD', 'Iris - BA', SRDStatus.Empty, SRDStatus.DoneByTL)).toBe(false);
    expect(canTransition('SRD', 'Iris - BA', SRDStatus.Empty, SRDStatus.DoneByAM)).toBe(false);

    // TL: Done By BA -> Done by TL
    expect(canTransition('SRD', 'Iris - TL', SRDStatus.DoneByBA, SRDStatus.DoneByTL)).toBe(true);

    // AM: Done by TL -> Done by AM or Review back to TL
    expect(canTransition('SRD', 'area manager', SRDStatus.DoneByTL, SRDStatus.DoneByAM)).toBe(true);
    expect(canTransition('SRD', 'area manager', SRDStatus.DoneByTL, SRDStatus.ReviewBackToTL)).toBe(true);

    // TL cannot approve to AM
    expect(canTransition('SRD', 'Iris - TL', SRDStatus.DoneByTL, SRDStatus.DoneByAM)).toBe(false);
  });

  test('QR transitions by role', () => {
    expect(canTransition('QR', 'Iris - BA', QRStatus.Empty, QRStatus.DoneByBA)).toBe(true);
    expect(canTransition('QR', 'Iris - TL', QRStatus.DoneByBA, QRStatus.DoneByTL)).toBe(true);
    expect(canTransition('QR', 'area manager', QRStatus.DoneByTL, QRStatus.ReviewByAM)).toBe(true);
    expect(canTransition('QR', 'area manager', QRStatus.DoneByTL, QRStatus.ReviewBackToTL)).toBe(true);
  });

  test('Attendance transitions by role', () => {
    expect(canTransition('Attendance', 'Iris - TL', AttendanceStatus.Pending, AttendanceStatus.ApprovedByTL)).toBe(true);
    expect(canTransition('Attendance', 'area manager', AttendanceStatus.ApprovedByTL, AttendanceStatus.ApprovedByAM)).toBe(true);
    // BA cannot change status
    expect(canTransition('Attendance', 'Iris - BA', AttendanceStatus.Pending, AttendanceStatus.ApprovedByTL)).toBe(false);
    // Admin override allowed
    expect(canTransition('Attendance', 'admin', AttendanceStatus.Pending, AttendanceStatus.ApprovedByTL)).toBe(true);
  });

  test('EA transitions by role', () => {
    expect(canTransition('EA', 'Iris - BA', EAStatus.Empty, EAStatus.AssessByBA)).toBe(true);
    expect(canTransition('EA', 'Iris - TL', EAStatus.AssessByBA, EAStatus.AssessByTL)).toBe(true);
    expect(canTransition('EA', 'Iris - TL', EAStatus.ReassessByTL, EAStatus.AssessByTL)).toBe(true);
    expect(canTransition('EA', 'area manager', EAStatus.AssessByTL, EAStatus.AssessByAM)).toBe(true);
    expect(canTransition('EA', 'area manager', EAStatus.AssessByTL, EAStatus.ReassessByTL)).toBe(true);
  });

  test('nextOptionsForRole returns valid next statuses', () => {
  const optsTL = nextOptionsForRole('SRD', 'Iris - TL', SRDStatus.DoneByBA);
  expect(optsTL).toEqual(expect.arrayContaining([SRDStatus.DoneByTL, SRDStatus.ReviewBackToBA]));

    const optsAM = nextOptionsForRole('SRD', 'area manager', SRDStatus.DoneByTL);
    expect(optsAM).toEqual(expect.arrayContaining([SRDStatus.DoneByAM, SRDStatus.ReviewBackToTL]));
  });
});
