/**
 * QuestFit — Auth Context
 * Global auth state yönetimi (kullanıcı oturum durumu + profil)
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../services/authService';
import { getUserProfile } from '../services/userService';
import { useUserStore } from '../store/userStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);         // Firebase Auth user
  const [profile, setProfile] = useState(null);    // Firestore profil verisi
  const [loading, setLoading] = useState(true);    // İlk yükleme durumu

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Firestore'dan profil verisini çekmeden önce user'ı set etmiyoruz,
        // böylece 'user' var ama 'profile' yok durumundan dolayı anlık Onboarding ekranı sekmez.
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          // Tüm state'leri aynı anda güncelliyoruz
          setUser(firebaseUser);
          setProfile(userProfile);
          useUserStore.getState().setProfile(userProfile);
        } catch (error) {
          console.error('Profil yüklenirken hata:', error);
          setUser(firebaseUser);
          setProfile(null);
          useUserStore.getState().clearStore();
        }
      } else {
        setUser(null);
        setProfile(null);
        useUserStore.getState().clearStore();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Profil verisini güncelle (Onboarding sonrası çağrılır)
   */
  const refreshProfile = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      useUserStore.getState().setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Auth hook — tüm ekranlardan erişim
 * @returns {{ user, profile, loading, refreshProfile }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
