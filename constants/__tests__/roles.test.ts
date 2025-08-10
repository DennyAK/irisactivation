import { Roles, isAdminRole, isAreaManager, isBA, isTL } from '../roles';

/// <reference types="jest" />

describe('roles helpers', () => {
  test('constants present', () => {
    expect(Roles.Admin).toBe('admin');
    expect(Roles.Superadmin).toBe('superadmin');
    expect(Roles.AreaManager).toBe('area manager');
    expect(Roles.IrisBA).toBe('Iris - BA');
    expect(Roles.IrisTL).toBe('Iris - TL');
  });
  test('helper predicates', () => {
    expect(isAdminRole(Roles.Admin)).toBe(true);
    expect(isAdminRole(Roles.Superadmin)).toBe(true);
    expect(isAdminRole(Roles.AreaManager)).toBe(false);
    expect(isAreaManager(Roles.AreaManager)).toBe(true);
    expect(isBA(Roles.IrisBA)).toBe(true);
    expect(isTL(Roles.IrisTL)).toBe(true);
  });
});
