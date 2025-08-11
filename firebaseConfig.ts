// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
// Initialize Auth with RN persistence when available; fallback to browser/getAuth
let auth: any;
try {
  // Use RN persistence via the main auth entry; supported in Firebase v12+
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage as any),
  });
} catch (_) {
  // Fallback for web/Expo Go environments
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
