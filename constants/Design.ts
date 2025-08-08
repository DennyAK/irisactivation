// Central design tokens
export const palette = {
  bg: '#f1f5f9',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  primary: '#2563eb',
  primarySoft: '#e3f0ff',
  accent: '#007aff',
  border: '#e2e8f0',
  borderStrong: '#d1d5db',
  text: '#111827',
  textMuted: '#6b7280',
  danger: '#dc2626',
  success: '#059669',
  warning: '#d97706',
  info: '#0369a1',
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
};

export const spacing = (n: number) => n * 4;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.3 },
};

export const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
