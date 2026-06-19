/**
 * QuestFit — Firebase Yapılandırması
 * Auth + Firestore bağlantısı
 */
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'questfit-8e4c0.firebaseapp.com',
  projectId: 'questfit-8e4c0',
  storageBucket: 'questfit-8e4c0.firebasestorage.app',
  messagingSenderId: '938521197910',
  appId: '1:938521197910:web:1aa51d5f9c343959d12af7',
  measurementId: 'G-CVNP4BYEFN',
};

// Firebase başlat
const app = initializeApp(firebaseConfig);

// Auth — oturum persistansı için AsyncStorage kullanılıyor
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore
const db = getFirestore(app);

export { app, auth, db };
