// Centralized role constants and helpers

export const Roles = {
  Admin: 'admin',
  Superadmin: 'superadmin',
  AreaManager: 'area manager',
  IrisBA: 'Iris - BA',
  IrisTL: 'Iris - TL',
} as const;

export type Role = typeof Roles[keyof typeof Roles] | '' | null | undefined;

export const isAdminRole = (role: Role) => role === Roles.Admin || role === Roles.Superadmin;
export const isAreaManager = (role: Role) => role === Roles.AreaManager;
export const isBA = (role: Role) => role === Roles.IrisBA;
export const isTL = (role: Role) => role === Roles.IrisTL;
