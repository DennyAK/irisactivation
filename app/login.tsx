import { useState } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { FormField } from '../components/ui/FormField';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { palette, radius, shadow, spacing, typography } from '../constants/Design';
import { useEffectiveScheme } from '../components/ThemePreference';
import { useI18n } from '../components/I18n';

export default function Login() {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (!email.trim() || !password) {
      Alert.alert(t('missing_info') || 'Missing Info', t('enter_email_password') || 'Please enter email and password.');
      return;
    }
    setSubmitting(true);
    signInWithEmailAndPassword(auth, email.trim(), password)
      .then(() => router.replace('/(tabs)'))
      .catch((error) => {
        Alert.alert(t('login_failed') || 'Login Failed', error.message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.outer, isDark && { backgroundColor: '#0b1220' }]}>
        <Text style={[styles.brand, isDark && { color: '#e5e7eb' }]}>IRIS ACTIVATION</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>          
          <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('welcome_back') || 'Welcome Back'}</Text>
          <Text style={[styles.subtitle, isDark && { color: '#94a3b8' }]}>{t('sign_in_continue') || 'Sign in to continue'}</Text>
          <FormField
            label={t('email') || 'Email'}
            icon="mail-outline"
            placeholder={t('email_placeholder') || 'you@example.com'}
            isDark={isDark}
            placeholderTextColor={isDark ? '#64748b' : undefined}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            setValue={setEmail}
          />
          <FormField
            label={t('password') || 'Password'}
            icon="lock-closed-outline"
            placeholder={t('password_placeholder') || '••••••••'}
            isDark={isDark}
            placeholderTextColor={isDark ? '#64748b' : undefined}
            secureToggle
            returnKeyType="done"
            value={password}
            setValue={setPassword}
            onSubmitEditing={handleLogin}
          />
          <PrimaryButton title={t('login') || 'Login'} onPress={handleLogin} loading={submitting} style={{ marginTop: spacing(1) }} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/signup')}>
            <Text style={[styles.linkText, isDark && { color: '#94a3b8' }]}>{t('no_account') || "Don't have an account?"} <Text style={styles.linkStrong}>{t('sign_up') || 'Sign Up'}</Text></Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.footer, isDark && { color: '#94a3b8' }]}>© {new Date().getFullYear()} Iris Activation</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outer: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(6), backgroundColor: palette.bg },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', letterSpacing: 1, color: palette.text, marginBottom: spacing(4.5) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(6), ...shadow.card, borderWidth: 1, borderColor: palette.border },
  title: { ...typography.h1, color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginTop: spacing(1), marginBottom: spacing(4.5) },
  linkRow: { marginTop: spacing(5), alignItems: 'center' },
  linkText: { color: '#475569', fontSize: 13 },
  linkStrong: { color: palette.primary, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: spacing(8), fontSize: 12, color: '#94a3b8' }
});
