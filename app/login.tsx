import { useState } from 'react';
import { StyleSheet, View, Alert, Text, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { FormField } from '../components/ui/FormField';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { palette, radius, shadow, spacing, typography } from '../constants/Design';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Info', 'Please enter email and password.');
      return;
    }
    setSubmitting(true);
    signInWithEmailAndPassword(auth, email.trim(), password)
      .then(() => router.replace('/(tabs)'))
      .catch((error) => {
        Alert.alert('Login Failed', error.message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.outer}>
        <Text style={styles.brand}>IRIS ACTIVATION</Text>
        <View style={styles.card}>          
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          <FormField
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            setValue={setEmail}
          />
          <FormField
            label="Password"
            icon="lock-closed-outline"
            placeholder="••••••••"
            secureToggle
            returnKeyType="done"
            value={password}
            setValue={setPassword}
            onSubmitEditing={handleLogin}
          />
          <PrimaryButton title="Login" onPress={handleLogin} loading={submitting} style={{ marginTop: spacing(1) }} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/signup')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkStrong}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>© {new Date().getFullYear()} Iris Activation</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outer: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing(6), backgroundColor: palette.bg },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', letterSpacing: 1, color: palette.text, marginBottom: spacing(4.5) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(6), ...shadow.card },
  title: { ...typography.h1, color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginTop: spacing(1), marginBottom: spacing(4.5) },
  linkRow: { marginTop: spacing(5), alignItems: 'center' },
  linkText: { color: '#475569', fontSize: 13 },
  linkStrong: { color: palette.primary, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: spacing(8), fontSize: 12, color: '#94a3b8' }
});
