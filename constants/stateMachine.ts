import { SRDStatus, QRStatus, AttendanceStatus, EAStatus, UserRole } from './status';

export type TaskType = 'SRD' | 'QR' | 'Attendance' | 'EA';
export type StatusValue = string;

type Transition = { from: StatusValue; to: StatusValue };
type RoleTransitions = Record<UserRole | 'any', Transition[]>;

// Allowed transitions per task type and role, mirroring current UI and server rules intent.
const transitionsByType: Record<TaskType, RoleTransitions> = {
  SRD: {
    any: [],
    'Iris - BA': [
      { from: SRDStatus.Empty, to: SRDStatus.DoneByBA },
      { from: SRDStatus.ReviewBackToBA, to: SRDStatus.DoneByBA },
    ],
    'Iris - TL': [
      { from: SRDStatus.DoneByBA, to: SRDStatus.DoneByTL },
      { from: SRDStatus.ReviewBackToTL, to: SRDStatus.DoneByTL },
      // TL can send back to BA after review
      { from: SRDStatus.DoneByBA, to: SRDStatus.ReviewBackToBA },
    ],
    'area manager': [
      { from: SRDStatus.DoneByTL, to: SRDStatus.DoneByAM },
      { from: SRDStatus.DoneByTL, to: SRDStatus.ReviewBackToTL },
    ],
    admin: [
      // Admin override: allow any hop among known statuses
      { from: SRDStatus.Empty, to: SRDStatus.DoneByBA },
      { from: SRDStatus.DoneByBA, to: SRDStatus.DoneByTL },
      { from: SRDStatus.DoneByTL, to: SRDStatus.DoneByAM },
      { from: SRDStatus.DoneByTL, to: SRDStatus.ReviewBackToTL },
      { from: SRDStatus.DoneByBA, to: SRDStatus.ReviewBackToBA },
    ],
    superadmin: [
      { from: SRDStatus.Empty, to: SRDStatus.DoneByBA },
      { from: SRDStatus.DoneByBA, to: SRDStatus.DoneByTL },
      { from: SRDStatus.DoneByTL, to: SRDStatus.DoneByAM },
      { from: SRDStatus.DoneByTL, to: SRDStatus.ReviewBackToTL },
      { from: SRDStatus.DoneByBA, to: SRDStatus.ReviewBackToBA },
    ],
    '': [],
  },
  QR: {
    any: [],
    'Iris - BA': [
      { from: QRStatus.Empty, to: QRStatus.DoneByBA },
    ],
    'Iris - TL': [
      { from: QRStatus.DoneByBA, to: QRStatus.DoneByTL },
      // TL can re-submit after AM review back
      { from: QRStatus.ReviewBackToTL, to: QRStatus.DoneByTL },
    ],
    'area manager': [
      { from: QRStatus.DoneByTL, to: QRStatus.ReviewByAM },
      { from: QRStatus.DoneByTL, to: QRStatus.ReviewBackToTL },
    ],
    admin: [
      { from: QRStatus.Empty, to: QRStatus.DoneByBA },
      { from: QRStatus.DoneByBA, to: QRStatus.DoneByTL },
      { from: QRStatus.DoneByTL, to: QRStatus.ReviewByAM },
      { from: QRStatus.DoneByTL, to: QRStatus.ReviewBackToTL },
    ],
    superadmin: [
      { from: QRStatus.Empty, to: QRStatus.DoneByBA },
      { from: QRStatus.DoneByBA, to: QRStatus.DoneByTL },
      { from: QRStatus.DoneByTL, to: QRStatus.ReviewByAM },
      { from: QRStatus.DoneByTL, to: QRStatus.ReviewBackToTL },
    ],
    '': [],
  },
  Attendance: {
    any: [],
    'Iris - BA': [], // BA edits set to Pending elsewhere; no explicit status hop here
    'Iris - TL': [
      { from: AttendanceStatus.Pending, to: AttendanceStatus.ApprovedByTL },
    ],
    'area manager': [
      { from: AttendanceStatus.ApprovedByTL, to: AttendanceStatus.ApprovedByAM },
    ],
    admin: [
      { from: AttendanceStatus.Pending, to: AttendanceStatus.ApprovedByTL },
      { from: AttendanceStatus.ApprovedByTL, to: AttendanceStatus.ApprovedByAM },
    ],
    superadmin: [
      { from: AttendanceStatus.Pending, to: AttendanceStatus.ApprovedByTL },
      { from: AttendanceStatus.ApprovedByTL, to: AttendanceStatus.ApprovedByAM },
    ],
    '': [],
  },
  EA: {
    any: [],
    'Iris - BA': [
      { from: EAStatus.Empty, to: EAStatus.AssessByBA },
    ],
    'Iris - TL': [
      { from: EAStatus.AssessByBA, to: EAStatus.AssessByTL },
      { from: EAStatus.ReassessByTL, to: EAStatus.AssessByTL },
    ],
    'area manager': [
      { from: EAStatus.AssessByTL, to: EAStatus.AssessByAM },
      { from: EAStatus.AssessByTL, to: EAStatus.ReassessByTL },
    ],
    admin: [
      { from: EAStatus.Empty, to: EAStatus.AssessByBA },
      { from: EAStatus.AssessByBA, to: EAStatus.AssessByTL },
      { from: EAStatus.AssessByTL, to: EAStatus.AssessByAM },
      { from: EAStatus.AssessByTL, to: EAStatus.ReassessByTL },
    ],
    superadmin: [
      { from: EAStatus.Empty, to: EAStatus.AssessByBA },
      { from: EAStatus.AssessByBA, to: EAStatus.AssessByTL },
      { from: EAStatus.AssessByTL, to: EAStatus.AssessByAM },
      { from: EAStatus.AssessByTL, to: EAStatus.ReassessByTL },
    ],
    '': [],
  },
};

export function canTransition(type: TaskType, role: UserRole, from: StatusValue, to: StatusValue): boolean {
  const table = transitionsByType[type];
  if (!table) return false;
  const allowed: Transition[] = [
    ...(table['any'] || []),
    ...(table[role] || []),
  ];
  return allowed.some(t => t.from === from && t.to === to);
}

export function nextOptionsForRole(type: TaskType, role: UserRole, current: StatusValue): StatusValue[] {
  const table = transitionsByType[type];
  if (!table) return [];
  const allowed = [
    ...(table['any'] || []),
    ...(table[role] || []),
  ];
  return allowed.filter(t => t.from === current).map(t => t.to);
}

// Convenience helpers by task type
export const canTransitionSRD = (role: UserRole, from: StatusValue, to: StatusValue) => canTransition('SRD', role, from, to);
export const canTransitionQR = (role: UserRole, from: StatusValue, to: StatusValue) => canTransition('QR', role, from, to);
export const canTransitionAttendance = (role: UserRole, from: StatusValue, to: StatusValue) => canTransition('Attendance', role, from, to);
export const canTransitionEA = (role: UserRole, from: StatusValue, to: StatusValue) => canTransition('EA', role, from, to);

export default {
  canTransition,
  nextOptionsForRole,
  canTransitionSRD,
  canTransitionQR,
  canTransitionAttendance,
  canTransitionEA,
};
