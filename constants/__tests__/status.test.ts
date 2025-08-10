/// <reference types="jest" />
import { SRDStatus, getToneForSRDStatus, nextStatusOnSubmitSRD, QRStatus, getToneForQRStatus, nextStatusOnSubmitQR, AttendanceStatus, getToneForAttendanceStatus, EAStatus, getToneForEAStatus, nextStatusOnSubmitEA } from '../status';

describe('SRD status helpers', () => {
  test('tone mapping', () => {
    expect(getToneForSRDStatus('')).toBe('neutral');
    expect(getToneForSRDStatus(SRDStatus.ReviewBackToBA)).toBe('warning');
    expect(getToneForSRDStatus(SRDStatus.DoneByTL)).toBe('info');
    expect(getToneForSRDStatus(SRDStatus.DoneByAM)).toBe('success');
  });
  test('next status on submit', () => {
    expect(nextStatusOnSubmitSRD('Iris - BA', SRDStatus.Empty)).toBe(SRDStatus.DoneByBA);
    expect(nextStatusOnSubmitSRD('Iris - BA', SRDStatus.ReviewBackToBA)).toBe(SRDStatus.DoneByBA);
    expect(nextStatusOnSubmitSRD('Iris - TL', SRDStatus.DoneByBA)).toBe(SRDStatus.DoneByTL);
    expect(nextStatusOnSubmitSRD('Iris - TL', SRDStatus.ReviewBackToTL)).toBe(SRDStatus.DoneByTL);
    expect(nextStatusOnSubmitSRD('area manager', SRDStatus.DoneByTL)).toBe(SRDStatus.DoneByTL);
  });
});

describe('QR status helpers', () => {
  test('tone mapping', () => {
    expect(getToneForQRStatus('')).toBe('neutral');
    expect(getToneForQRStatus(QRStatus.ReviewBackToTL)).toBe('warning');
    expect(getToneForQRStatus(QRStatus.DoneByTL)).toBe('info');
    expect(getToneForQRStatus(QRStatus.ReviewByAM)).toBe('info');
  });
  test('next status on submit', () => {
    expect(nextStatusOnSubmitQR('Iris - BA', QRStatus.Empty)).toBe(QRStatus.DoneByBA);
    expect(nextStatusOnSubmitQR('Iris - TL', QRStatus.DoneByBA)).toBe(QRStatus.DoneByTL);
    expect(nextStatusOnSubmitQR('area manager', QRStatus.DoneByTL)).toBe(QRStatus.DoneByTL);
  });
});

describe('Attendance status helpers', () => {
  test('tone mapping', () => {
    expect(getToneForAttendanceStatus('')).toBe('neutral');
    expect(getToneForAttendanceStatus(AttendanceStatus.Pending)).toBe('warning');
    expect(getToneForAttendanceStatus(AttendanceStatus.ApprovedByTL)).toBe('info');
    expect(getToneForAttendanceStatus(AttendanceStatus.ApprovedByAM)).toBe('success');
  });
});

describe('Early Assessment status helpers', () => {
  test('tone mapping', () => {
    expect(getToneForEAStatus('')).toBe('neutral');
    expect(getToneForEAStatus(EAStatus.AssessByBA)).toBe('warning');
    expect(getToneForEAStatus(EAStatus.ReassessByTL)).toBe('warning');
    expect(getToneForEAStatus(EAStatus.AssessByTL)).toBe('info');
    expect(getToneForEAStatus(EAStatus.AssessByAM)).toBe('success');
  });
  test('next status on submit', () => {
    expect(nextStatusOnSubmitEA('Iris - BA', EAStatus.Empty)).toBe(EAStatus.AssessByBA);
    expect(nextStatusOnSubmitEA('Iris - TL', EAStatus.AssessByBA)).toBe(EAStatus.AssessByTL);
    expect(nextStatusOnSubmitEA('Iris - TL', EAStatus.ReassessByTL)).toBe(EAStatus.AssessByTL);
    expect(nextStatusOnSubmitEA('area manager', EAStatus.AssessByTL)).toBe(EAStatus.AssessByTL);
  });
});
