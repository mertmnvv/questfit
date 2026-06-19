/**
 * QuestFit — Auth Servisi
 * Firebase Authentication fonksiyonları
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

/**
 * Yeni kullanıcı kaydı
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const registerUser = async (email, password, nickname) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (nickname) {
    await updateProfile(userCredential.user, { displayName: nickname });
  }
  return userCredential;
};

/**
 * Mevcut kullanıcı girişi
 * @param {string} email
 * @param {string} password
 * @returns {Promise<UserCredential>}
 */
export const loginUser = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Çıkış yap
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  return await signOut(auth);
};

/**
 * Auth durumu dinleyicisi
 * @param {function} callback - (user) => void
 * @returns {function} unsubscribe fonksiyonu
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
