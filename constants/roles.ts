// Centralized role constants and helpers

export const Roles = {
  Admin: 'admin',
  Superadmin: 'superadmin',
  AreaManager: 'area manager',
  IrisBA: 'Iris - BA',
  IrisTL: 'Iris - TL',
  Dima: 'Dima',
  Diageo: 'Diageo',
} as const;

export type Role = typeof Roles[keyof typeof Roles] | '' | null | undefined;

export const isAdminRole = (role: Role) => role === Roles.Admin || role === Roles.Superadmin;
export const isAreaManager = (role: Role) => role === Roles.AreaManager;
export const isBA = (role: Role) => role === Roles.IrisBA;
export const isTL = (role: Role) => role === Roles.IrisTL;
export const isDima = (role: Role) => role === Roles.Dima;
export const isDiageo = (role: Role) => role === Roles.Diageo;
export const isBAish = (role: Role) => role === Roles.IrisBA || role === Roles.Dima; // mirror BA
export const isTLish = (role: Role) => role === Roles.IrisTL || role === Roles.Diageo; // mirror TL
