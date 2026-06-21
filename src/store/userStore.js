import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateAllStats } from '../utils/mathEngine';
import { updateUserStats } from '../services/userService';
import { getRandomQuests } from '../data/questPool';

/**
 * Global User Store (GameManager mantığı)
 * Kullanıcının profil verilerini ve anlık hesaplanan stat'larını tutar.
 */
export const useUserStore = create(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHydrated: (state) => set({ _hasHydrated: state }),

      // Raw profile data from Firestore
      profile: null,
      
      // Calculated stats (BMR, TDEE, Macros)
      stats: null,

      // Custom Routines
      customRoutines: [],

      // Günlük toplanan ödüller (Daily claimed rewards)
      claimedGoals: [],
      dailyQuests: [],

      // Geçmiş
      recentSearches: [],
      recentFoods: [],

      // Kalori ve Makro Tarihçesi (Grafikler için)
      calorieHistory: [],

      // Adım Tarihçesi
      stepHistory: [],

      // Günlük kayıtlar (Loglar)
      dailyLog: { foods: [], workouts: [] },

      // Dinamik Tüketim (Günlük)
      consumedToday: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
        fiber: 0,
        burnedCalories: 0,
        aiWorkoutCompletedToday: false,
      },

      // RPG Mekanikleri
      level: 1,
      xp: 0,
      streak: 0,
      stepStreak: 0,
      weightHistory: [],
      workoutHistory: [],
      lastActiveDate: null, // Son giriş (streak) tarihi

      // Uygulama Ayarları
      appTheme: 'light', // 'light' | 'dark'
      appLanguage: null, // null = cihaz dili, 'en' | 'tr'
      tutorialSeen: false,
      notificationsEnabled: true,
      aiCustomPromptEnabled: false,

      // Aralıklı Oruç (Intermittent Fasting) State
      fastingState: {
        isActive: false,
        startTime: null,
        durationHours: 16, // Default 16:8 planı
      },

      setFastingState: (newState) => {
        set((state) => {
          const updatedFasting = { ...state.fastingState, ...newState };
          if (state.profile?.id) {
            updateUserStats(state.profile.id, { fastingState: updatedFasting }).catch(console.error);
          }
          return { fastingState: updatedFasting };
        });
      },

      setAppTheme: (theme) => {
        set({ appTheme: theme });
        if (get().profile?.id) {
          updateUserStats(get().profile.id, { appTheme: theme }).catch(console.error);
        }
      },

      setAppLanguage: (lang) => {
        set({ appLanguage: lang });
        if (get().profile?.id) {
          updateUserStats(get().profile.id, { appLanguage: lang }).catch(console.error);
        }
      },

      setNotificationsEnabled: (enabled) => {
        set({ notificationsEnabled: enabled });
        if (get().profile?.id) {
          updateUserStats(get().profile.id, { notificationsEnabled: enabled }).catch(console.error);
        }
      },

      setAiCustomPromptEnabled: (enabled) => {
        set({ aiCustomPromptEnabled: enabled });
        if (get().profile?.id) {
          updateUserStats(get().profile.id, { aiCustomPromptEnabled: enabled }).catch(console.error);
        }
      },

      setTutorialSeen: (seen) => {
        set({ tutorialSeen: seen });
      },

      // Gün değişimi ve Streak kontrolü
      checkDailyReset: () => {
        const state = get();
        if (!state.profile) return;

        // Local timezone date calculation
        const tzOffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, -1);
        const today = localISOTime.split('T')[0];
        const lastActive = state.lastActiveDate;

        if (lastActive === today) {
          if ((state.streak || 0) === 0) {
            set({ streak: 1 });
            if (state.profile?.id) {
              updateUserStats(state.profile.id, { streak: 1 }).catch(console.log);
            }
          }
          return;
        }

        if (!lastActive) {
          set({ lastActiveDate: today, streak: 1, stepStreak: 0, dailyQuests: getRandomQuests(4) });
          if (state.profile.id) {
            updateUserStats(state.profile.id, { lastActiveDate: today, streak: 1, stepStreak: 0, dailyQuests: get().dailyQuests }).catch(console.log);
          }
          return;
        }

        let newStreak = state.streak || 0;

        if (lastActive) {
          const lastDateObj = new Date(lastActive);
          const todayObj = new Date(today);
          const diffTime = Math.abs(todayObj - lastDateObj);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Sadece girmesi (aktif olması) seriyi devam ettirir (Kalori şartı kalktı)
            newStreak += 1;
          } else if (diffDays > 1) {
            // 1 günden fazla boşluk, seri bozulur ve 1'den başlar
            newStreak = 1;
          }
        }
        
        // Pedometer streak logic will be handled by healthService to ensure accurate steps from OS.
        let newStepStreak = state.stepStreak || 0;


        // Dünün değerlerini geçmişe kaydet
        let newCalorieHistory = [...(state.calorieHistory || [])];
        if (lastActive) {
          newCalorieHistory.push({
            date: lastActive,
            calories: state.consumedToday?.calories || 0,
            protein: state.consumedToday?.protein || 0,
            carbs: state.consumedToday?.carbs || 0,
            fat: state.consumedToday?.fat || 0,
            burnedCalories: state.consumedToday?.burnedCalories || 0,
          });
        }

        // Günlük değerleri sıfırla ve yeni tarihi kaydet
        set({
          lastActiveDate: today,
          streak: newStreak,
          stepStreak: newStepStreak,
          calorieHistory: newCalorieHistory,
          consumedToday: { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, fiber: 0, burnedCalories: 0, aiWorkoutCompletedToday: false, boxesEarnedToday: 0 },
          dailyLog: { foods: [], workouts: [] },
          claimedGoals: [],
          dailyQuests: getRandomQuests(4)
        });

        // Firebase'e yeni streak ve geçmiş bilgisini yolla
        if (state.profile.id) {
          updateUserStats(state.profile.id, { 
            streak: newStreak,
            stepStreak: newStepStreak,
            calorieHistory: newCalorieHistory,
            claimedGoals: [],
            lastActiveDate: today,
            consumedToday: { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, fiber: 0, burnedCalories: 0, aiWorkoutCompletedToday: false },
            dailyLog: { foods: [], workouts: [] },
            dailyQuests: get().dailyQuests
          }).catch(err => console.log(err));
        }
      },

      // Firebase'den veri çekildiğinde veya güncellendiğinde çağrılır
      setProfile: (profileData) => {
        if (!profileData) {
          set({ profile: null, stats: null });
          return;
        }

        const calculatedStats = calculateAllStats(profileData);
        
        const localState = get();
        
        // Firebase senkronizasyon gecikmelerine karşı yerel veriyi koruma (Persistence Fix)
        // Eğer yerel hafızadaki kalori veya yenen yemek sayısı Firebase'den fazlaysa yerel olanı kullan.
        const mergedConsumedToday = (localState.consumedToday?.calories > (profileData.consumedToday?.calories || 0)) 
          ? localState.consumedToday 
          : (profileData.consumedToday || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, fiber: 0, burnedCalories: 0, aiWorkoutCompletedToday: false });
          
        const mergedDailyLog = (localState.dailyLog?.foods?.length > (profileData.dailyLog?.foods?.length || 0))
          ? localState.dailyLog
          : (profileData.dailyLog || { foods: [], workouts: [] });

        set({
          profile: {
            ...profileData,
            workoutLocation: profileData.workoutLocation || 'Gym'
          },
          stats: calculatedStats,
          level: profileData.level || 1,
          xp: profileData.exp || 0,
          streak: profileData.streak || 0,
          stepStreak: profileData.stepStreak || 0,
          customRoutines: profileData.customRoutines || [],
          weightHistory: profileData.weightHistory || [],
          calorieHistory: profileData.calorieHistory || [],
          stepHistory: profileData.stepHistory || [],
          workoutHistory: profileData.workoutHistory || [],
          recentSearches: profileData.recentSearches || [],
          recentFoods: profileData.recentFoods || [],
          claimedGoals: profileData.claimedGoals || [],
          dailyQuests: profileData.dailyQuests && profileData.dailyQuests.length > 0 ? profileData.dailyQuests : getRandomQuests(4),
          lastActiveDate: profileData.lastActiveDate || null,
          consumedToday: mergedConsumedToday,
          dailyLog: mergedDailyLog,
          fastingState: profileData.fastingState || { isActive: false, startTime: null, durationHours: 16 },
          // Persistence fix: Hydrate settings from Firebase if available, otherwise keep local state
          appTheme: profileData.appTheme || localState.appTheme || 'light',
          appLanguage: profileData.appLanguage || localState.appLanguage,
          notificationsEnabled: profileData.notificationsEnabled !== undefined ? profileData.notificationsEnabled : (localState.notificationsEnabled ?? true),
          aiCustomPromptEnabled: profileData.aiCustomPromptEnabled !== undefined ? profileData.aiCustomPromptEnabled : (localState.aiCustomPromptEnabled ?? false),
        });
        
        // Profil yüklenince otomatik günlük reset kontrolü yap
        get().checkDailyReset();
      },

      // Profilin sadece belirli bir alanını güncelleme
      updateProfileField: (field, value) => {
        const { profile } = get();
        if (!profile) return;

        const updatedProfile = { ...profile, [field]: value };
        const calculatedStats = calculateAllStats(updatedProfile);

        set({ profile: updatedProfile, stats: calculatedStats });

        if (profile.id) {
          updateUserStats(profile.id, { [field]: value }).catch(err => console.log(err));
        }
      },

      // XP Ekleme ve Level Atlama Mantığı
      addXp: (amount) => {
        const state = get();
        let currentXp = (state.xp || 0) + amount;
        let currentLevel = state.level || 1;
        let maxXp = 200 * Math.pow(2, currentLevel - 1); 

        let leveledUp = false;
        while (currentXp >= maxXp) {
          currentXp -= maxXp;
          currentLevel += 1;
          maxXp = 200 * Math.pow(2, currentLevel - 1);
          leveledUp = true;
        }

        set({ xp: currentXp, level: currentLevel });

        if (state.profile?.id) {
          updateUserStats(state.profile.id, { exp: currentXp, level: currentLevel }).catch(err => console.log(err));
        }
        return leveledUp; 
      },

      // Su Ekleme
      addWater: (amount) => {
        const { consumedToday } = get();
        const currentWater = consumedToday?.water || 0;
        
        set({
          consumedToday: {
            ...consumedToday,
            water: Math.max(0, currentWater + amount)
          }
        });

        if (get().profile?.id) {
          updateUserStats(get().profile.id, { consumedToday: get().consumedToday }).catch(err => console.log(err));
        }

        // Su eklemesinden doğrudan XP verilmesi engellendi (XP farming fix)
        // get().addXp(10);
      },

      // Adım Geçmişini Güncelleme
      updateStepHistory: (history) => {
        set({ stepHistory: history });
        if (get().profile?.id) {
          updateUserStats(get().profile.id, { stepHistory: history }).catch(console.error);
        }
      },
      
      setStepStreak: (streak) => {
        set({ stepStreak: streak });
        if (get().profile?.id) {
          updateUserStats(get().profile.id, { stepStreak: streak }).catch(console.error);
        }
      },

      // Kilo Güncelleme ve Geçmişe Ekleme
      updateWeight: (newWeight) => {
        const { profile, weightHistory } = get();
        if (!profile) return;

        const timestamp = new Date().toISOString(); 
        
        let newHistory = [...(weightHistory || [])];
        newHistory.push({ date: timestamp, weight: newWeight });

        const updatedProfile = { ...profile, weight: newWeight.toString() };
        const calculatedStats = calculateAllStats(updatedProfile);

        set({
          profile: updatedProfile,
          stats: calculatedStats,
          weightHistory: newHistory,
        });

        if (profile.id) {
          updateUserStats(profile.id, { 
            weight: newWeight.toString(),
            weightHistory: newHistory
          }).catch(console.error);
        }

        get().addXp(20);
      },

      // Antrenman Ekleme İşlemi
      addWorkout: (workout) => {
        const state = get();
        const consumedToday = state.consumedToday || {
          calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, fiber: 0, burnedCalories: 0, aiWorkoutCompletedToday: false
        };
        const dailyLog = state.dailyLog || { foods: [], workouts: [] };

        const burned = workout.burnedCalories || 0;
        const title = workout.name || workout.title || 'Antrenman';
        const exercises = workout.exercises || []; // Egzersiz detaylarını da kaydediyoruz

        const newConsumed = {
          ...consumedToday,
          burnedCalories: (consumedToday.burnedCalories || 0) + burned,
          ...(workout.isAi ? { aiWorkoutCompletedToday: true } : {})
        };

        const newDailyLog = {
          ...dailyLog,
          workouts: [
            ...dailyLog.workouts,
            { id: Date.now().toString(), name: title, calories: burned, exercises }
          ]
        };

        const newWorkoutHistory = [
          ...(state.workoutHistory || []),
          { id: Date.now().toString(), date: new Date().toISOString(), name: title, calories: burned, exercises }
        ].slice(-50); // Keep last 50 workouts

        set({ consumedToday: newConsumed, dailyLog: newDailyLog, workoutHistory: newWorkoutHistory });
        
        if (state.profile?.id) {
          updateUserStats(state.profile.id, { 
            consumedToday: newConsumed, 
            dailyLog: newDailyLog, 
            workoutHistory: newWorkoutHistory 
          }).catch(err => console.log(err));
        }

        get().addXp(150);
      },

      getMuscleFatigue: () => {
        const state = get();
        const history = state.workoutHistory || [];
        const bodyType = state.profile?.bodyType || 'mesomorph';
        const now = new Date();
        
        let recoveryDays = 4;
        if (bodyType === 'ectomorph') recoveryDays = 5;
        else if (bodyType === 'mesomorph') recoveryDays = 3;
        else if (bodyType === 'endomorph') recoveryDays = 4;
        
        // Fatigue state: 0 (rested) to 1 (fatigued)
        const fatigue = { chest: 0, back: 0, legs: 0, arms: 0, core: 0 };
        
        history.forEach(workout => {
          if (!workout.date || !workout.exercises) return;
          const workoutDate = new Date(workout.date);
          const diffDays = (now - workoutDate) / (1000 * 60 * 60 * 24);
          
          if (diffDays > recoveryDays) return; // Recovered
          
          // Recovery formula: 1.0 -> 0.0 over recoveryDays
          const remainingFatigue = Math.max(0, 1 - (diffDays / recoveryDays));
          
          workout.exercises.forEach(ex => {
            if (!ex.muscleGroup) return;
            const group = ex.muscleGroup.toLowerCase();
            
            // Map Turkish/English groups to heatmap keys
            let key = null;
            if (group.includes('göğüs') || group.includes('chest')) key = 'chest';
            else if (group.includes('sırt') || group.includes('back')) key = 'back';
            else if (group.includes('bacak') || group.includes('legs') || group.includes('kalça')) key = 'legs';
            else if (group.includes('kol') || group.includes('arm') || group.includes('omuz') || group.includes('shoulder')) key = 'arms';
            else if (group.includes('karın') || group.includes('core') || group.includes('abs')) key = 'core';
            
            if (key) {
              fatigue[key] = Math.min(1, fatigue[key] + (remainingFatigue * 0.3)); // Each exercise adds 30% fatigue relative to day
            }
          });
        });
        
        return fatigue;
      },

      // Özel Antrenman Kaydetme İşlemi
      saveCustomRoutine: async (name, exercises) => {
        const { profile, customRoutines } = get();
        const newRoutine = {
          id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
          name,
          exercises
        };
        const updatedRoutines = [...(customRoutines || []), newRoutine];
        
        set({ customRoutines: updatedRoutines });
        
        if (profile?.id) {
          try {
            await updateUserStats(profile.id, { customRoutines: updatedRoutines });
          } catch (err) {
            console.error("Özel program Firebase'e kaydedilemedi:", err);
          }
        }
      },

      // Özel Antrenman Silme İşlemi
      removeCustomRoutine: async (routineId) => {
        const { profile, customRoutines } = get();
        const updatedRoutines = (customRoutines || []).filter(r => r.id !== routineId);
        
        set({ customRoutines: updatedRoutines });
        
        if (profile?.id) {
          try {
            await updateUserStats(profile.id, { customRoutines: updatedRoutines });
          } catch (err) {
            console.error("Özel program silinirken hata:", err);
          }
        }
      },

      // Besin Ekleme İşlemi
      addFood: (foodEntry) => {
        const state = get();
        const consumedToday = state.consumedToday || {
          calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, fiber: 0, burnedCalories: 0
        };
        const dailyLog = state.dailyLog || { foods: [], workouts: [] };

        const calories = foodEntry.calories || 0;
        const protein = foodEntry.protein || 0;
        const carbs = foodEntry.carbs || 0;
        const fat = foodEntry.fat || 0;
        const name = foodEntry.name || 'Bilinmeyen Yemek';
        const mealType = foodEntry.mealType || 'unknown';

        const newConsumed = {
          ...consumedToday,
          calories: (consumedToday.calories || 0) + calories,
          protein: (consumedToday.protein || 0) + protein,
          carbs: (consumedToday.carbs || 0) + carbs,
          fat: (consumedToday.fat || 0) + fat,
        };

        const newDailyLog = {
          ...dailyLog,
          foods: [
            ...dailyLog.foods,
            { id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9), name, calories, protein, carbs, fat, mealType }
          ]
        };

        // recentFoods'a ekle (son 15 ürünü tutalım)
        let updatedRecentFoods = state.recentFoods ? [...state.recentFoods] : [];
        if (foodEntry.originalFood) {
          updatedRecentFoods = updatedRecentFoods.filter(f => f.name !== foodEntry.originalFood.name);
          updatedRecentFoods.unshift(foodEntry.originalFood);
          if (updatedRecentFoods.length > 15) updatedRecentFoods.pop();
        }

        set({ consumedToday: newConsumed, dailyLog: newDailyLog, recentFoods: updatedRecentFoods });
        
        if (state.profile?.id) {
          updateUserStats(state.profile.id, { 
            recentFoods: updatedRecentFoods,
            consumedToday: newConsumed,
            dailyLog: newDailyLog
          }).catch(err => console.log(err));
        }

        // Yemek eklemesinden doğrudan XP verilmesi engellendi (XP farming fix)
        // get().addXp(30);
      },

      // Besin Silme İşlemi
      removeFood: (foodId) => {
        const state = get();
        const foodToRemove = state.dailyLog?.foods?.find(f => f.id === foodId);
        if (!foodToRemove) return;

        const currentConsumed = state.consumedToday || { calories: 0, protein: 0, carbs: 0, fat: 0 };
        
        const newConsumed = {
          ...currentConsumed,
          calories: Math.max(0, currentConsumed.calories - (foodToRemove.calories || 0)),
          protein: Math.max(0, currentConsumed.protein - (foodToRemove.protein || 0)),
          carbs: Math.max(0, currentConsumed.carbs - (foodToRemove.carbs || 0)),
          fat: Math.max(0, currentConsumed.fat - (foodToRemove.fat || 0)),
        };

        const newDailyLog = {
          ...state.dailyLog,
          foods: state.dailyLog.foods.filter(f => f.id !== foodId)
        };

        set({ consumedToday: newConsumed, dailyLog: newDailyLog });

        if (state.profile?.id) {
          updateUserStats(state.profile.id, { 
            consumedToday: newConsumed,
            dailyLog: newDailyLog
          }).catch(err => console.log(err));
        }
      },

      addRecentSearch: (query) => {
        const state = get();
        if (!query.trim()) return;
        let searches = state.recentSearches ? [...state.recentSearches] : [];
        searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
        searches.unshift(query);
        if (searches.length > 10) searches.pop();
        
        set({ recentSearches: searches });
        if (state.profile?.id) {
          updateUserStats(state.profile.id, { recentSearches: searches }).catch(err => console.log(err));
        }
      },

      // Ödül toplama mekanizması
      claimGoal: (goalId, xpAmount) => {
        const state = get();
        const claimed = state.claimedGoals || [];
        if (claimed.includes(goalId)) return false; // Zaten alınmış

        const newClaimed = [...claimed, goalId];
        set({ claimedGoals: newClaimed });

        if (state.profile?.id) {
          updateUserStats(state.profile.id, { claimedGoals: newClaimed }).catch(console.error);
        }

        // XP ekle ve level atlama durumunu döndür
        return get().addXp(xpAmount);
      },

      // Çıkış yapıldığında store'u temizle
      clearStore: () => {
        set({ 
          profile: null, 
          stats: null, 
          xp: 0,
          level: 1,
          streak: 0,
          weightHistory: [],
          stepHistory: [],
          customRoutines: [],
          consumedToday: { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, fiber: 0, burnedCalories: 0 },
          dailyLog: { foods: [], workouts: [] },
          claimedGoals: [],
          fastingState: { isActive: false, startTime: null, durationHours: 16 },
          inventory: [],
          equippedItems: { head: null, chest: null, weapon: null, pet: null },
          boxes: { wood: 0, silver: 0, gold: 0 },
        });
      },
    }),
    {
      name: 'questfit-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      }
    }
  )
);
