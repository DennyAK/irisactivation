import { useState } from 'react';
import { StyleSheet, TextInput, View, Alert, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FormField } from '../components/ui/FormField';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { palette, radius, shadow, spacing, typography } from '../constants/Design';
import { useEffectiveScheme } from '../components/ThemePreference';
import { useI18n } from '../components/I18n';


export default function SignUp() {
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSignUp = () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert(t('missing_fields') || 'Missing Fields', t('first_last_phone_required') || 'First Name, Last Name, and Phone are required.');
      return;
    }
    if (!password) {
      Alert.alert(t('password_required') || 'Password Required', t('enter_password') || 'Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t('password_mismatch') || 'Password Mismatch', t('passwords_do_not_match') || 'Passwords do not match.');
      return;
    }
    // Always ensure phone starts with +62
    let phoneValue = phone;
    if (phoneValue.startsWith('0')) {
      phoneValue = '+62' + phoneValue.slice(1);
    } else if (!phoneValue.startsWith('+62')) {
      phoneValue = '+62' + phoneValue.replace(/^\+?/, '');
    }
    if (!/^\+62\d{9,13}$/.test(phoneValue)) {
      Alert.alert(t('invalid_phone') || 'Invalid Phone', t('enter_valid_phone') || 'Please enter a valid Indonesian phone number, e.g. 81234567890');
      return;
    }
  setSubmitting(true);
  createUserWithEmailAndPassword(auth, email.trim(), password)
      .then((userCredential) => {
        const user = userCredential.user;
        // Add a new document in collection "users"
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          role: "guest",
          createdAt: new Date(),
          timestamp: serverTimestamp(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneValue.trim(),
          province: "",
          city: "",
          photoURL: ""
        })
        .then(() => {
          router.replace('/(tabs)');
        })
        .catch((error) => {
          Alert.alert(t('signup_failed') || 'Sign Up Failed', t('failed_create_user_data') || 'Failed to create user data.');
        });
      })
      .catch((error) => {
        Alert.alert(t('signup_failed') || 'Sign Up Failed', error.message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.outer, isDark && { backgroundColor: '#0b1220' }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.brand, isDark && { color: '#e5e7eb' }]}>{t('create_account') || 'CREATE ACCOUNT'}</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}>
          <Text style={[styles.title, isDark && { color: '#e5e7eb' }]}>{t('get_started') || 'Get Started'}</Text>
          <Text style={[styles.subtitle, isDark && { color: '#94a3b8' }]}>{t('fill_information_below') || 'Fill in the information below'}</Text>
          <View style={styles.rowGap}>
            <View style={{ flex: 1 }}>
              <FormField
                label={t('first_name') || 'First Name'}
                icon="person-outline"
                placeholder={t('first_name_placeholder') || 'John'}
                isDark={isDark}
                placeholderTextColor={isDark ? '#64748b' : undefined}
                returnKeyType="next"
                value={firstName}
                setValue={setFirstName}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label={t('last_name') || 'Last Name'}
                icon="person-outline"
                placeholder={t('last_name_placeholder') || 'Doe'}
                isDark={isDark}
                placeholderTextColor={isDark ? '#64748b' : undefined}
                returnKeyType="next"
                value={lastName}
                setValue={setLastName}
              />
            </View>
          </View>
          <View style={{ marginBottom: spacing(4) }}>
            <Text style={[styles.label, isDark && { color: '#e5e7eb' }]}>{t('phone_indonesia') || 'Phone (Indonesia)'}</Text>
            <View style={[styles.inputWrapper, isDark && { backgroundColor: '#0f172a', borderColor: '#1f2937' }]}> 
              <Text style={[styles.prefix, isDark && { color: '#94a3b8' }]}>+62</Text>
              <TextInput
                style={[styles.textInput, { paddingLeft: 44 }, isDark && { color: '#e5e7eb' }]}
                placeholder={t('phone_placeholder') || '81234567890'}
                placeholderTextColor={isDark ? '#64748b' : undefined}
                value={phone.startsWith('+62') ? phone.slice(3) : (phone.startsWith('0') ? phone.slice(1) : phone)}
                onChangeText={(text) => {
                  let clean = text.replace(/^0+/, '');
                  setPhone('+62' + clean);
                }}
                keyboardType="phone-pad"
                maxLength={13}
                returnKeyType="next"
              />
            </View>
            <Text style={[styles.helper, isDark && { color: '#94a3b8' }]}>{t('phone_format_hint') || 'Format: +6281234567890'}</Text>
          </View>
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
            placeholder={t('create_password') || 'Create a password'}
            isDark={isDark}
            placeholderTextColor={isDark ? '#64748b' : undefined}
            secureToggle
            returnKeyType="next"
            value={password}
            setValue={setPassword}
          />
          <FormField
            label={t('confirm_password') || 'Confirm Password'}
            icon="lock-closed-outline"
            placeholder={t('repeat_password') || 'Repeat password'}
            isDark={isDark}
            placeholderTextColor={isDark ? '#64748b' : undefined}
            secureToggle
            returnKeyType="done"
            value={confirmPassword}
            setValue={setConfirmPassword}
            onSubmitEditing={handleSignUp}
            error={!!confirmPassword && password !== confirmPassword ? (t('passwords_do_not_match') || 'Passwords do not match') : undefined}
          />
          <PrimaryButton
            title={t('create_account_cta') || 'Create Account'}
            onPress={handleSignUp}
            loading={submitting}
            disabled={!!confirmPassword && password !== confirmPassword}
            style={{ marginTop: spacing(1) }}
          />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/login')}>
            <Text style={[styles.linkText, isDark && { color: '#94a3b8' }]}>{t('already_have_account') || 'Already have an account?'} <Text style={styles.linkStrong}>{t('login') || 'Login'}</Text></Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.footer, isDark && { color: '#94a3b8' }]}>© {new Date().getFullYear()} Iris Activation</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing(6), paddingVertical: spacing(10), backgroundColor: palette.bg },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', letterSpacing: 1, color: palette.text, marginBottom: spacing(4.5) },
  card: { backgroundColor: palette.surface, borderRadius: radius.lg, padding: spacing(6), ...shadow.card, borderWidth: 1, borderColor: palette.border },
  title: { ...typography.h1, color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginTop: spacing(1), marginBottom: spacing(4.5) },
  rowGap: { flexDirection: 'row', gap: spacing(3.5) },
  label: { ...typography.label, color: palette.text },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surfaceAlt, borderWidth: 1, borderColor: palette.border, borderRadius: radius.md, paddingHorizontal: spacing(11), height: 50 },
  textInput: { flex: 1, fontSize: 15, color: palette.text },
  prefix: { position: 'absolute', left: spacing(4), color: '#334155', fontWeight: '600', fontSize: 14 },
  helper: { fontSize: 11, color: palette.textMuted, marginTop: spacing(1) },
  linkRow: { marginTop: spacing(5), alignItems: 'center' },
  linkText: { color: '#475569', fontSize: 13 },
  linkStrong: { color: palette.primary, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: spacing(8), fontSize: 12, color: '#94a3b8' },
});
