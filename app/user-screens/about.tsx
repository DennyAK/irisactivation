import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { palette, spacing, typography, radius } from '../../constants/Design';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { useEffect } from 'react';
import { trackEvent, trackScreen } from '../../components/analytics';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

export default function AboutScreen() {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
  const manifest = Constants.manifest2 as any;
  const appVersion = Constants.expoConfig?.version || manifest?.extra?.expoClient?.version || 'unknown';
  const buildNumber = Constants.expoConfig?.android?.versionCode || Constants.expoConfig?.ios?.buildNumber || 'unknown';
  const channel = Updates.channel || 'unknown';
  const runtimeVersion = Updates.runtimeVersion || 'unknown';
  const updateId = Updates.updateId || 'none';
  const [checking, setChecking] = useState(false);
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
    <View style={[styles.screen, isDark && { backgroundColor: '#0b1220' }]}>
      <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('about_title') || 'About This App'}</Text>
      <View style={[styles.card, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
        <Line label={t('app_version') || 'App Version'} value={String(appVersion)} />
        <Line label={t('build') || 'Build'} value={String(buildNumber)} />
        <Line label={t('channel') || 'Channel'} value={String(channel)} />
        <Line label={t('runtime') || 'Runtime'} value={String(runtimeVersion)} />
        <Line label={t('update_id') || 'Update ID'} value={String(updateId)} />
      </View>
      <View style={styles.actions}>
        <PrimaryButton title={checking ? (t('checking') || 'Checking…') : (t('check_update') || 'Check for Update')} onPress={checkForUpdate} />
        <SecondaryButton title={t('privacy_policy') || 'Privacy Policy'} onPress={() => open('https://example.com/privacy')} />
        <SecondaryButton title={t('terms') || 'Terms of Service'} onPress={() => open('https://example.com/terms')} />
        <SecondaryButton title={t('support') || 'Support'} onPress={() => open('mailto:support@example.com')} />
        <SecondaryButton title={t('rate_app') || 'Rate App'} onPress={() => open('market://details?id=com.example.app')} />
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
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(5), marginBottom: spacing(6), borderWidth: 1, borderColor: palette.border },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(2) },
  lineLabel: { color: palette.textMuted },
  lineValue: { color: palette.text, fontWeight: '600' },
  actions: { gap: spacing(3) },
});
