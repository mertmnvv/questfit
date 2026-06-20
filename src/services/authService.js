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
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../config/firebase';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '938521197910-ls88q2l9l7m3nqs2jrhsfkot8j6cf2dl.apps.googleusercontent.com',
  offlineAccess: false,
});

/**
 * Yeni kullanıcı kaydı
 * @param {string} email
 * @param {string} password
 * @param {string} nickname
 * @param {string} photoURL
 * @returns {Promise<UserCredential>}
 */
export const registerUser = async (email, password, nickname, photoURL) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const updateObj = {};
  if (nickname) updateObj.displayName = nickname;
  if (photoURL) updateObj.photoURL = photoURL;
  if (Object.keys(updateObj).length > 0) {
    await updateProfile(userCredential.user, updateObj);
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
  try {
    await GoogleSignin.signOut();
  } catch (error) {
    // If user is not signed in with Google, it throws. We can safely ignore it.
  }
  return await signOut(auth);
};

/**
 * Google ile Giriş Yap / Kayıt Ol
 */
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Get the users ID token
    const signInResult = await GoogleSignin.signIn();
    
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(signInResult.data.idToken);

    // Sign-in the user with the credential
    return await signInWithCredential(auth, googleCredential);
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

/**
 * Auth durumu dinleyicisi
 * @param {function} callback - (user) => void
 * @returns {function} unsubscribe fonksiyonu
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Kullanıcının profil fotoğrafını günceller
 */
export const updateUserAvatar = async (photoURL) => {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL });
    return true;
  }
  return false;
};
