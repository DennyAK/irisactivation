// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
/// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABOtZi5YW6MKI3IXJdkTrffoeJkurZoVo",
  authDomain: "activation-d6f75.firebaseapp.com",
  projectId: "activation-d6f75",
  storageBucket: "activation-d6f75.firebasestorage.app",
  messagingSenderId: "587679509867",
  appId: "1:587679509867:web:0acad168599eaca2c9702e",
  measurementId: "G-REX1E8RVFC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Auth with correct persistence per-platform
let auth: any;
if (Platform.OS === 'web') {
  // Web: use browser persistence
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAuth, setPersistence, browserLocalPersistence } = require('firebase/auth');
  auth = getAuth(app);
  // Ensure persistence is set; ignore if unavailable (e.g., private mode)
  try { setPersistence(auth, browserLocalPersistence); } catch { /* no-op */ }
} else {
  // Native: use React Native persistence (AsyncStorage)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage as any),
  });
}
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
