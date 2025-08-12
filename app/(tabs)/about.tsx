import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { palette, spacing, typography, radius } from '../../constants/Design';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import { trackEvent, trackScreen } from '../../components/analytics';
import { useThemePreference } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function AboutTabScreen() {
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

  const open = (url: string) => Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open link'));

  const checkForUpdate = useCallback(async () => {
    try {
      setChecking(true);
      trackEvent('update_check');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        trackEvent('update_fetched');
        Alert.alert('Update Ready', 'App will reload to apply the latest update.', [
          { text: 'Reload', onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        trackEvent('update_not_available');
        Alert.alert('Up-to-date', 'You have the latest version.');
      }
    } catch (e: any) {
      trackEvent('update_check_failed', { message: e?.message });
      Alert.alert('Update Check Failed', e?.message || String(e));
    } finally {
      setChecking(false);
    }
  }, []);

  return (
    <View style={styles.screen}>
  <Text style={styles.title}>{t('about_title')} • OTA v1</Text>
      <View style={styles.card}>
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
        <View style={{ height: spacing(2) }} />
        <Text style={{ color: palette.text, fontWeight: '700' }}>{t('appearance')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing(2) }}>
          <SecondaryButton title={t('system')} onPress={() => setPreference('system')} />
          <SecondaryButton title={t('light')} onPress={() => setPreference('light')} />
          <SecondaryButton title={t('dark')} onPress={() => setPreference('dark')} />
        </View>
        <View style={{ height: spacing(2) }} />
        <Text style={{ color: palette.text, fontWeight: '700' }}>{t('language')}</Text>
        <View style={{ flexDirection: 'row', gap: spacing(2) }}>
          <SecondaryButton title={t('english')} onPress={() => setLocale('en')} />
          <SecondaryButton title={t('bahasa')} onPress={() => setLocale('id')} />
        </View>
      </View>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  title: { ...typography.h1, color: palette.text, marginBottom: spacing(6) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(6) },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2) },
  lineLabel: { color: palette.textMuted },
  lineValue: { color: palette.text, fontWeight: '600' },
  actions: { gap: spacing(3) },
});
