/**
 * QuestFit — Kullanıcı Servisi
 * Firestore'da kullanıcı profili CRUD işlemleri
 */
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Kullanıcı profilini Firestore'a kaydet
 * @param {string} uid - Firebase Auth UID
 * @param {object} data - { gender, age, height, weight, goal }
 * @returns {Promise<void>}
 */
export const saveUserProfile = async (uid, data) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    level: 1,
    exp: 0, // Düzeltme: 'xp' yerine 'exp' kullanıyoruz.
    streak: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Kullanıcı profilini Firestore'dan oku
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} kullanıcı verisi veya null
 */
export const getUserProfile = async (uid) => {
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

/**
 * Profil verisini günceller (Örn: EXP ve Level)
 * @param {string} uid - Firebase User ID
 * @param {object} updates - Güncellenecek alanlar objesi
 */
export const updateUserStats = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Veri güncellenirken hata:', error);
    throw error;
  }
};
