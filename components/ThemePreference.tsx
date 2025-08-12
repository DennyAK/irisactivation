import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Scheme = 'light' | 'dark';
type Preference = 'system' | Scheme;

type Ctx = {
  systemScheme: Scheme;
  preference: Preference;
  setPreference: (p: Preference) => void;
};

const ThemeCtx = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = 'theme.preference';

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const [systemScheme, setSystemScheme] = useState<Scheme>((Appearance.getColorScheme?.() || 'light') as Scheme);
  const [preference, setPreferenceState] = useState<Preference>('system');

  // watch system changes
  useEffect(() => {
    const sub = Appearance.addChangeListener?.(({ colorScheme }) => {
      setSystemScheme((colorScheme || 'light') as Scheme);
    });
    return () => {
      // @ts-ignore
      sub?.remove?.();
    };
  }, []);

  // load stored preference
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v);
      } catch {}
    })();
  }, []);

  const setPreference = useCallback((p: Preference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
  }, []);

  const value = useMemo(() => ({ systemScheme, preference, setPreference }), [systemScheme, preference, setPreference]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useThemePreference() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  return ctx;
}

// Convenience hook to get the effective scheme that respects the user preference
export function useEffectiveScheme(): 'light' | 'dark' {
  const { systemScheme, preference } = useThemePreference();
  return preference === 'system' ? systemScheme : preference;
}
