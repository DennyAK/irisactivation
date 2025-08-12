import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Locale = 'en' | 'id';
type Dict = Record<string, string>;

const resources: Record<Locale, Dict> = {
  en: {
    about_title: 'About This App',
    check_update: 'Check for Update',
    checking: 'Checking…',
    privacy_policy: 'Privacy Policy',
    terms: 'Terms of Service',
    support: 'Support',
    rate_app: 'Rate App',
    appearance: 'Appearance',
    language: 'Language',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    bahasa: 'Bahasa',
    // global labels
    profile: 'Profile',
    clicker: 'Clicker',
    about: 'About',
    users_manager: 'Users Manager',
    projects: 'Projects',
    outlets: 'Outlets',
    tasks: 'Tasks',
    menu: 'Menu',
    logout: 'Logout',
    // new
    app_settings: 'App Settings',
    attendance: 'Attendance',
    assessment: 'Assessment',
    quick_quiz: 'Quick Quiz',
    sales_report: 'Sales Report',
    sales_detail: 'Sales Detail',
    provinces: 'Provinces',
    cities: 'Cities',
    activation: 'Activation',
    projects_list: 'Projects List',
    admin_requests: 'Admin Requests',
    user_mgmt: 'User Mgmt',
  },
  id: {
    about_title: 'Tentang Aplikasi Ini',
    check_update: 'Periksa Pembaruan',
    checking: 'Memeriksa…',
    privacy_policy: 'Kebijakan Privasi',
    terms: 'Syarat Layanan',
    support: 'Dukungan',
    rate_app: 'Beri Nilai Aplikasi',
    appearance: 'Tampilan',
    language: 'Bahasa',
    system: 'Sistem',
    light: 'Terang',
    dark: 'Gelap',
    english: 'Inggris',
    bahasa: 'Bahasa',
    // global labels
    profile: 'Profil',
    clicker: 'Clicker',
    about: 'Tentang',
    users_manager: 'Manajer Pengguna',
    projects: 'Proyek',
    outlets: 'Outlet',
    tasks: 'Tugas',
    menu: 'Menu',
    logout: 'Keluar',
    // new
    app_settings: 'Pengaturan Aplikasi',
    attendance: 'Kehadiran',
    assessment: 'Penilaian',
    quick_quiz: 'Kuis Cepat',
    sales_report: 'Laporan Penjualan',
    sales_detail: 'Detail Penjualan',
    provinces: 'Provinsi',
    cities: 'Kota',
    activation: 'Aktivasi',
    projects_list: 'Daftar Proyek',
    admin_requests: 'Permintaan Admin',
    user_mgmt: 'Manajemen Pengguna',
  },
};

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (k: string) => string;
};

const I18nCtx = createContext<Ctx | undefined>(undefined);
const STORAGE_KEY = 'i18n.locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'en' || saved === 'id') setLocaleState(saved);
      } catch {}
    })();
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  };

  const t = (k: string) => (resources[locale] && resources[locale][k]) || resources.en[k] || k;
  const value = useMemo(() => ({ locale, setLocale, t }), [locale]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
