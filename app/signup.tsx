import { useState } from 'react';
import { StyleSheet, TextInput, Button, View, Alert, Text } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'expo-router';


export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const router = useRouter();

  const handleSignUp = () => {
    // Validate required fields
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) {
      Alert.alert('Missing Fields', 'First Name, Last Name, and Phone are required.');
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
    createUserWithEmailAndPassword(auth, email, password)
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
      });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <View style={{ width: '100%', position: 'relative' }}>
        <Text style={{ position: 'absolute', left: 12, top: 12, fontSize: 16, color: '#333', zIndex: 2 }}>+62</Text>
        <TextInput
          style={[styles.input, { paddingLeft: 40 }]}
          placeholder="81234567890"
          value={phone.startsWith('+62') ? phone.slice(3) : (phone.startsWith('0') ? phone.slice(1) : phone)}
          onChangeText={(text) => {
            let clean = text.replace(/^0+/, '');
            setPhone('+62' + clean);
          }}
          keyboardType="phone-pad"
          maxLength={13}
        />
      </View>
      <Text style={{ fontSize: 12, color: '#888', marginBottom: 8, marginTop: 8 }}>
        Format: +6281234567890 (Indonesia)
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
  },
});
