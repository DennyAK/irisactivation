import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppSettings = {
  debugHeaderEnabled: boolean;
  setDebugHeaderEnabled: (v: boolean) => void;
};

const Ctx = createContext<AppSettings | undefined>(undefined);
const STORAGE_KEY = 'app.debugHeaderEnabled';

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [debugHeaderEnabled, setDebugHeaderEnabledState] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (v === 'true' || v === 'false') setDebugHeaderEnabledState(v === 'true');
      } catch {}
    })();
  }, []);

  const setDebugHeaderEnabled = useCallback((v: boolean) => {
    setDebugHeaderEnabledState(v);
    AsyncStorage.setItem(STORAGE_KEY, String(v)).catch(() => {});
  }, []);

  const value = useMemo(() => ({ debugHeaderEnabled, setDebugHeaderEnabled }), [debugHeaderEnabled, setDebugHeaderEnabled]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}
