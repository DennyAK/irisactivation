import { useState } from 'react';
import { StyleSheet, TextInput, Button, View, Alert } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from 'expo-router';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignUp = () => {
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
          firstName: "",
          lastName: "",
          phone: "",
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
