import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { palette, spacing, typography, radius } from '../../constants/Design';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { trackEvent, trackScreen } from '../../components/analytics';
import { useThemePreference, useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function AboutTabScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useEffectiveScheme();
  const manifest = Constants.manifest2 as any;
  const appVersion = Constants.expoConfig?.version || manifest?.extra?.expoClient?.version || 'unknown';
  const buildNumber = Constants.expoConfig?.android?.versionCode || Constants.expoConfig?.ios?.buildNumber || 'unknown';
  const channel = Updates.channel || 'unknown';
  const runtimeVersion = Updates.runtimeVersion || 'unknown';
  const updateId = Updates.updateId || 'none';
  const [checking, setChecking] = useState(false);
  const { preference, setPreference } = useThemePreference();
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    trackScreen('About', { version: appVersion, channel });
  }, []);

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert(t('error') || 'Error', t('unable_open_link') || 'Unable to open link'));

  const checkForUpdate = useCallback(async () => {
    try {
      setChecking(true);
      trackEvent('update_check');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        trackEvent('update_fetched');
        Alert.alert(t('update_ready') || 'Update Ready', t('app_reload_apply') || 'App will reload to apply the latest update.', [
          { text: t('reload') || 'Reload', onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        trackEvent('update_not_available');
  Alert.alert(t('up_to_date') || 'Up-to-date', t('latest_version') || 'You have the latest version.');
      }
    } catch (e: any) {
      trackEvent('update_check_failed', { message: e?.message });
  Alert.alert(t('update_check_failed') || 'Update Check Failed', e?.message || String(e));
    } finally {
      setChecking(false);
    }
  }, []);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: scheme === 'dark' ? '#0b1220' : palette.bg }]}
      contentContainerStyle={{ paddingTop: spacing(10), paddingHorizontal: spacing(6), paddingBottom: insets.bottom + spacing(12) }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: scheme === 'dark' ? '#e5e7eb' : palette.text }]}>{t('about_title')} • OTA v1</Text>
      <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#111827' : palette.surface, borderColor: scheme === 'dark' ? '#1f2937' : palette.border }]}>
        <Line label="App Version" value={String(appVersion)} />
        <Line label="Build" value={String(buildNumber)} />
        <Line label="Channel" value={String(channel)} />
        <Line label="Runtime" value={String(runtimeVersion)} />
        <Line label="Update ID" value={String(updateId)} />
        <Line label="Theme" value={preference === 'system' ? 'System' : preference} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton title={checking ? t('checking') : t('check_update')} onPress={checkForUpdate} />
        <SecondaryButton title={t('privacy_policy')} onPress={() => open('https://example.com/privacy')} />
        <SecondaryButton title={t('terms')} onPress={() => open('https://example.com/terms')} />
        <SecondaryButton title={t('support')} onPress={() => open('mailto:support@example.com')} />
        <SecondaryButton title={t('rate_app')} onPress={() => open('market://details?id=com.example.app')} />
        <View style={{ height: spacing(3) }} />
        <View style={[styles.card, { backgroundColor: scheme === 'dark' ? '#111827' : palette.surface, borderColor: scheme === 'dark' ? '#1f2937' : palette.border }]}>
          <Text style={{ color: scheme === 'dark' ? '#e5e7eb' : palette.text, fontWeight: '700', marginBottom: spacing(3) }}>{t('app_settings')}</Text>
          <Text style={{ color: scheme === 'dark' ? '#cbd5e1' : palette.text, fontWeight: '700' }}>{t('appearance')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) }}>
            <SecondaryButton title={t('system')} onPress={() => setPreference('system')} selected={preference === 'system'} />
            <SecondaryButton title={t('light')} onPress={() => setPreference('light')} selected={preference === 'light'} />
            <SecondaryButton title={t('dark')} onPress={() => setPreference('dark')} selected={preference === 'dark'} />
          </View>
          <View style={{ height: spacing(3) }} />
          <Text style={{ color: scheme === 'dark' ? '#cbd5e1' : palette.text, fontWeight: '700' }}>{t('language')}</Text>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) }}>
            <SecondaryButton title={t('english')} onPress={() => setLocale('en')} selected={locale === 'en'} />
            <SecondaryButton title={t('bahasa')} onPress={() => setLocale('id')} selected={locale === 'id'} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  const scheme = useEffectiveScheme();
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: scheme === 'dark' ? '#94a3b8' : '#6b7280' }]}>{label}</Text>
      <Text style={[styles.lineValue, { color: scheme === 'dark' ? '#e5e7eb' : palette.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { ...typography.h1, marginBottom: spacing(6) },
  card: { borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(6), borderWidth: 1 },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2) },
  lineLabel: { color: palette.textMuted },
  lineValue: { color: palette.text, fontWeight: '600' },
  actions: { gap: spacing(3) },
});
