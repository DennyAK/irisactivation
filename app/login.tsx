import { useState } from 'react';
import { StyleSheet, TextInput, View, Alert, Text, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#6b7280" style={styles.leftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.leftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
            disabled={submitting}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Login</Text>}
          </TouchableOpacity>
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
  outer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#f1f5f9' },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', letterSpacing: 1, color: '#0f172a', marginBottom: 18 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 18 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, letterSpacing: 0.3 },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 44, height: 50 },
  textInput: { flex: 1, fontSize: 15, color: '#111827' },
  leftIcon: { position: 'absolute', left: 16 },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#475569', fontSize: 13 },
  linkStrong: { color: '#2563eb', fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94a3b8' }
});
