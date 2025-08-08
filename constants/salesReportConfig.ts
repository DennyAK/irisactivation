// Centralized configuration for Sales Report Detail
export const WEATHER_STATUS_OPTIONS = [
  { label: 'Sunny', value: 'sunny' },
  { label: 'Cloudy', value: 'cloudy' },
  { label: 'Rainy', value: 'rainy' },
  { label: 'Storm', value: 'storm' },
  { label: 'Other', value: 'other' }
];

export const STATUS_OPTIONS = [
  { label: '', value: '' },
  { label: 'Done By BA', value: 'Done By BA' },
  { label: 'Review back to BA', value: 'Review back to BA' },
  { label: 'Done by TL', value: 'Done by TL' },
  { label: 'Review back to TL', value: 'Review back to TL' },
  { label: 'Done by AM', value: 'Done by AM' },
  { label: 'Review back to AM', value: 'Review back to AM' },
  { label: 'Done by Admin', value: 'Done by Admin' }
];

export const MERCHANDISE_ROWS = [1,2,3,4,5];

export interface ProgramGroupField { k: string; label: string; ph: string; }
export interface ProgramGroup { key: string; label: string; fields: ProgramGroupField[]; participationKey: string; }

export const PROGRAM_GROUPS: ProgramGroup[] = [
  { key: 'stoutieProgram', label: 'MICRODRAUGHT STOUTIE EXPERIENCE', participationKey: 'stoutieProgramParticipation', fields: [
    { k: 'stoutieProgramCallReach', label: 'Call Reach', ph: 'Stoutie Program Call Reach' },
    { k: 'stoutieProgramPacketSold', label: 'Packet Sold', ph: 'Stoutie Program Packet Sold' },
    { k: 'stoutieProgramEngagePeople', label: 'Engage - People', ph: 'Stoutie Program Engage - People' },
  ]},
  { key: 'loyaltyProgram', label: 'LOYALTY PROGRAM PARTICIPATION', participationKey: 'loyaltyProgramParticipation', fields: [
    { k: 'loyaltyProgramCallReach', label: 'Call Reach', ph: 'Loyalty Program Call Reach' },
    { k: 'loyaltyProgramPacketSold', label: 'Packet Sold', ph: 'Loyalty Program Packet Sold' },
    { k: 'loyaltyProgramEngagePeople', label: 'Engage - People', ph: 'Loyalty Program Engage - People' },
  ]},
  { key: 'brightball', label: 'BRIGHTBALL PROGRAM', participationKey: 'brightballParticipation', fields: [
    { k: 'brightballCallReach', label: 'Call Reach', ph: 'Brightball Call Reach' },
    { k: 'brightballPacketSold', label: 'Packet Sold', ph: 'Brightball Packet Sold' },
    { k: 'brightballEngagePeople', label: 'Engage - People', ph: 'Brightball Engage - People' },
  ]},
  { key: 'sovProgram', label: 'SOV PROGRAM', participationKey: 'sovProgramParticipation', fields: [
    { k: 'sovProgramCallReach', label: 'Call Reach', ph: 'SOV Program Call Reach' },
    { k: 'sovProgramPacketSold', label: 'Packet Sold', ph: 'SOV Program Packet Sold' },
    { k: 'sovProgramEngagePeople', label: 'Engage - People', ph: 'SOV Program Engage - People' },
  ]},
];
