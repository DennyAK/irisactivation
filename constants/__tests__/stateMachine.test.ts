import { canTransitionSRD, canTransitionQR, canTransitionAttendance, canTransitionEA } from '../stateMachine';
import { SRDStatus, QRStatus, AttendanceStatus, EAStatus } from '../status';

describe('state machine transitions (TS)', () => {
  test('SRD BA/TL/AM flows', () => {
    expect(canTransitionSRD('Iris - BA', SRDStatus.Empty, SRDStatus.DoneByBA)).toBe(true);
    expect(canTransitionSRD('Iris - TL', SRDStatus.DoneByBA, SRDStatus.DoneByTL)).toBe(true);
    expect(canTransitionSRD('area manager', SRDStatus.DoneByTL, SRDStatus.DoneByAM)).toBe(true);
    // not allowed: BA jumping to TL
    expect(canTransitionSRD('Iris - BA', SRDStatus.DoneByBA, SRDStatus.DoneByTL)).toBe(false);
  });

  test('QR BA/TL/AM flows with review-back', () => {
    expect(canTransitionQR('Iris - BA', QRStatus.Empty, QRStatus.DoneByBA)).toBe(true);
    expect(canTransitionQR('Iris - TL', QRStatus.DoneByBA, QRStatus.DoneByTL)).toBe(true);
    expect(canTransitionQR('area manager', QRStatus.DoneByTL, QRStatus.ReviewByAM)).toBe(true);
    expect(canTransitionQR('area manager', QRStatus.DoneByTL, QRStatus.ReviewBackToTL)).toBe(true);
    // disallow BA hopping after TL
    expect(canTransitionQR('Iris - BA', QRStatus.DoneByTL, QRStatus.ReviewByAM)).toBe(false);
  });

  test('Attendance approvals', () => {
    expect(canTransitionAttendance('Iris - TL', AttendanceStatus.Pending, AttendanceStatus.ApprovedByTL)).toBe(true);
    expect(canTransitionAttendance('area manager', AttendanceStatus.ApprovedByTL, AttendanceStatus.ApprovedByAM)).toBe(true);
    expect(canTransitionAttendance('Iris - BA', AttendanceStatus.Pending, AttendanceStatus.ApprovedByTL)).toBe(false);
  });

  test('EA assess and reassess', () => {
    expect(canTransitionEA('Iris - BA', EAStatus.Empty, EAStatus.AssessByBA)).toBe(true);
    expect(canTransitionEA('Iris - TL', EAStatus.AssessByBA, EAStatus.AssessByTL)).toBe(true);
    expect(canTransitionEA('area manager', EAStatus.AssessByTL, EAStatus.AssessByAM)).toBe(true);
    expect(canTransitionEA('area manager', EAStatus.AssessByTL, EAStatus.ReassessByTL)).toBe(true);
    // BA cannot jump to TL
    expect(canTransitionEA('Iris - BA', EAStatus.AssessByBA, EAStatus.AssessByTL)).toBe(false);
  });
});
