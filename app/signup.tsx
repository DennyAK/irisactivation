import { useState } from 'react';
import { StyleSheet, TextInput, View, Alert, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'expo-router';
import Ionicons from 'react-native-vector-icons/Ionicons';


export default function SignUp() {
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
      Alert.alert('Missing Fields', 'First Name, Last Name, and Phone are required.');
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter a password.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
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
      Alert.alert('Invalid Phone', 'Please enter a valid Indonesian phone number, e.g. 81234567890');
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
          Alert.alert("Sign Up Failed", "Failed to create user data.");
        });
      })
      .catch((error) => {
        Alert.alert("Sign Up Failed", error.message);
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.outer} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>CREATE ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Fill in the information below</Text>
          <View style={styles.rowGap}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#6b7280" style={styles.leftIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="John"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                  returnKeyType="next"
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#6b7280" style={styles.leftIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Doe"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                  returnKeyType="next"
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Phone (Indonesia)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.prefix}>+62</Text>
              <TextInput
                style={[styles.textInput, { paddingLeft: 44 }]}
                placeholder="81234567890"
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
            <Text style={styles.helper}>Format: +6281234567890</Text>
          </View>
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
                placeholder="Create a password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(p => !p)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.leftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Repeat password"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(p => !p)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {!!confirmPassword && password !== confirmPassword && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, (submitting || (!!confirmPassword && password !== confirmPassword)) && { opacity: 0.6 }]} onPress={handleSignUp} disabled={submitting || (!!confirmPassword && password !== confirmPassword)} activeOpacity={0.85}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkStrong}>Login</Text></Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>© {new Date().getFullYear()} Iris Activation</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  outer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40, backgroundColor: '#f1f5f9' },
  brand: { textAlign: 'center', fontSize: 18, fontWeight: '800', letterSpacing: 1, color: '#0f172a', marginBottom: 18 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4, marginBottom: 18 },
  rowGap: { flexDirection: 'row', gap: 14 },
  fieldGroup: { flex: 1, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, letterSpacing: 0.3 },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 44, height: 50 },
  textInput: { flex: 1, fontSize: 15, color: '#111827' },
  leftIcon: { position: 'absolute', left: 16 },
  prefix: { position: 'absolute', left: 16, color: '#334155', fontWeight: '600', fontSize: 14 },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  helper: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  primaryBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  linkRow: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#475569', fontSize: 13 },
  linkStrong: { color: '#2563eb', fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94a3b8' },
  errorText: { marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: '500' }
});
