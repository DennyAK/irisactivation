import type { Timestamp } from 'firebase/firestore';

function toMillis(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (val instanceof Date) return val.getTime();
  if (typeof val?.toMillis === 'function') return val.toMillis();
  try {
    // Firestore Timestamp has seconds/nanoseconds
    if (typeof (val as Timestamp).seconds === 'number') {
      return ((val as Timestamp).seconds || 0) * 1000 + Math.floor(((val as Timestamp).nanoseconds || 0) / 1e6);
    }
  } catch {}
  return 0;
}

export function compareCreatedAt(a: any, b: any, asc = false): number {
  const at = toMillis(a?.createdAt);
  const bt = toMillis(b?.createdAt);
  return asc ? at - bt : bt - at;
}

export function compareByStringKey<T extends Record<string, any>>(a: T, b: T, key: keyof T, asc = true): number {
  const av = String(a?.[key] ?? '').toLowerCase();
  const bv = String(b?.[key] ?? '').toLowerCase();
  return asc ? av.localeCompare(bv) : bv.localeCompare(av);
}
