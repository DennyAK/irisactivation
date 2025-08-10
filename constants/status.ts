// Centralized status constants and helpers for Sales Report Detail (SRD) and Quick Report (QR)

export type UserRole = 'admin' | 'superadmin' | 'area manager' | 'Iris - BA' | 'Iris - TL' | '';

export const SRDStatus = {
  Empty: '',
  DoneByBA: 'Done By BA',
  ReviewBackToBA: 'Review back to BA',
  DoneByTL: 'Done by TL',
  ReviewBackToTL: 'Review back to TL',
  DoneByAM: 'Done by AM',
} as const;
export type SRDStatusValue = typeof SRDStatus[keyof typeof SRDStatus];

export const QRStatus = {
  Empty: '',
  DoneByBA: 'QR Done by BA',
  ReviewBackToTL: 'Review back to TL',
  DoneByTL: 'QR Done by TL',
  ReviewByAM: 'QR Review by AM',
} as const;
export type QRStatusValue = typeof QRStatus[keyof typeof QRStatus];

export const SRD_STATUS_OPTIONS: Array<{ label: string; value: SRDStatusValue }> = [
  { label: '', value: SRDStatus.Empty },
  { label: SRDStatus.DoneByBA, value: SRDStatus.DoneByBA },
  { label: SRDStatus.ReviewBackToBA, value: SRDStatus.ReviewBackToBA },
  { label: SRDStatus.DoneByTL, value: SRDStatus.DoneByTL },
  { label: SRDStatus.ReviewBackToTL, value: SRDStatus.ReviewBackToTL },
  { label: SRDStatus.DoneByAM, value: SRDStatus.DoneByAM },
];

export const QR_STATUS_OPTIONS: Array<{ label: string; value: QRStatusValue }> = [
  { label: '', value: QRStatus.Empty },
  { label: QRStatus.DoneByBA, value: QRStatus.DoneByBA },
  { label: QRStatus.ReviewBackToTL, value: QRStatus.ReviewBackToTL },
  { label: QRStatus.DoneByTL, value: QRStatus.DoneByTL },
  { label: QRStatus.ReviewByAM, value: QRStatus.ReviewByAM },
];

// Tone mapping used by StatusPill
export type Tone = 'neutral' | 'warning' | 'info' | 'success' | 'primary';

export function getToneForSRDStatus(status: string | undefined | null): Tone {
  const s = status || '';
  if (!s) return 'neutral';
  if (s.includes('Review')) return 'warning';
  if (s === SRDStatus.DoneByTL) return 'info';
  if (s === SRDStatus.DoneByAM) return 'success';
  return 'primary';
}

export function getToneForQRStatus(status: string | undefined | null): Tone {
  const s = status || '';
  if (!s) return 'neutral';
  // Specific cases first
  if (s === QRStatus.ReviewByAM || s === QRStatus.DoneByTL) return 'info';
  if (s.includes('Review')) return 'warning';
  return 'primary';
}

// Next-status helpers for submit flows
export function nextStatusOnSubmitSRD(role: UserRole, prev: SRDStatusValue): SRDStatusValue {
  if (role === 'Iris - BA' && (prev === SRDStatus.Empty || prev === SRDStatus.ReviewBackToBA)) return SRDStatus.DoneByBA;
  if (role === 'Iris - TL' && (prev === SRDStatus.DoneByBA || prev === SRDStatus.ReviewBackToTL)) return SRDStatus.DoneByTL;
  return prev;
}

export function nextStatusOnSubmitQR(role: UserRole, prev: QRStatusValue): QRStatusValue {
  if (role === 'Iris - BA' && (prev === QRStatus.Empty)) return QRStatus.DoneByBA;
  if (role === 'Iris - TL' && (prev === QRStatus.DoneByBA)) return QRStatus.DoneByTL;
  return prev;
}

// Attendance statuses
export const AttendanceStatus = {
  Empty: '',
  Pending: 'pending',
  ApprovedByTL: 'approved by TL',
  ApprovedByAM: 'approved by AM',
} as const;
export type AttendanceStatusValue = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export function getToneForAttendanceStatus(status: string | undefined | null): Tone {
  const s = (status || '').toLowerCase();
  if (!s) return 'neutral';
  if (s.includes('pending')) return 'warning';
  if (s.includes('approved by tl')) return 'info';
  if (s.includes('approved by am')) return 'success';
  return 'neutral';
}

export const ATTENDANCE_STATUS_OPTIONS: Array<{ label: string; value: AttendanceStatusValue }> = [
  { label: '', value: AttendanceStatus.Empty },
  { label: AttendanceStatus.Pending, value: AttendanceStatus.Pending },
  { label: AttendanceStatus.ApprovedByTL, value: AttendanceStatus.ApprovedByTL },
  { label: AttendanceStatus.ApprovedByAM, value: AttendanceStatus.ApprovedByAM },
];

// Early Assessment statuses
export const EAStatus = {
  Empty: '',
  AssessByBA: 'ASSESS BY BA',
  AssessByTL: 'ASSESS BY TL',
  AssessByAM: 'ASSESS BY AM',
  ReassessByTL: 'RE ASSESS BY TL',
} as const;
export type EAStatusValue = typeof EAStatus[keyof typeof EAStatus];

export function getToneForEAStatus(status: string | undefined | null): Tone {
  const s = status || '';
  if (!s) return 'neutral';
  if (s === EAStatus.AssessByBA || s === EAStatus.ReassessByTL) return 'warning';
  if (s === EAStatus.AssessByTL) return 'info';
  if (s === EAStatus.AssessByAM) return 'success';
  return 'neutral';
}

export function nextStatusOnSubmitEA(role: UserRole, prev: EAStatusValue): EAStatusValue {
  if (role === 'Iris - BA' && (prev === EAStatus.Empty)) return EAStatus.AssessByBA;
  if (role === 'Iris - TL' && (prev === EAStatus.AssessByBA || prev === EAStatus.ReassessByTL)) return EAStatus.AssessByTL;
  return prev;
}

export const EA_STATUS_OPTIONS: Array<{ label: string; value: EAStatusValue }> = [
  { label: '', value: EAStatus.Empty },
  { label: EAStatus.AssessByBA, value: EAStatus.AssessByBA },
  { label: EAStatus.ReassessByTL, value: EAStatus.ReassessByTL },
  { label: EAStatus.AssessByTL, value: EAStatus.AssessByTL },
  { label: EAStatus.AssessByAM, value: EAStatus.AssessByAM },
];
