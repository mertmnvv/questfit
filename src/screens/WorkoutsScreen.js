import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme';
import MuscleHeatmap from '../components/MuscleHeatmap';
import { EXERCISE_DATABASE } from '../data/exercises';
import HorizontalSlider from '../components/HorizontalSlider';
import { searchWorkout } from '../services/workoutService';

const { width } = Dimensions.get('window');

export default function WorkoutsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);

  const {
    profile,
    customRoutines,
    getMuscleFatigue,
    addWorkout,
    updateProfileField,
    workoutHistory,
    consumedToday,
    removeCustomRoutine,
  } = useUserStore();

  // Component States
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [quickLogName, setQuickLogName] = useState('');
  const [quickLogDuration, setQuickLogDuration] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  // 1. Muscle Fatigue Calculation
  const fatigueData = useMemo(() => getMuscleFatigue() || { chest: 0, back: 0, legs: 0, arms: 0, core: 0 }, [getMuscleFatigue, workoutHistory]);

  // 2. Location Preference Selection
  const workoutLocation = profile?.workoutLocation || 'Gym';

  // 3. AI Recommendation Engine
  const aiWorkout = useMemo(() => {
    // Filter by location
    const exercisesForLocation = EXERCISE_DATABASE.filter(ex => ex.category === workoutLocation);

    // Calculate average fatigue
    const fatigueValues = Object.values(fatigueData);
    const avgFatigue = fatigueValues.reduce((sum, val) => sum + val, 0) / fatigueValues.length;

    let selectedExercises = [];
    let isRecovery = false;

    // Check if average fatigue is extremely high — recommend recovery
    if (avgFatigue > 0.65) {
      isRecovery = true;
      // Filter light/core exercises (mostly Abs/Core or Kardiyo)
      selectedExercises = EXERCISE_DATABASE.filter(ex =>
        ex.category === 'Evde Antrenman' &&
        (ex.muscleGroup.toLowerCase() === 'karın' ||
         ex.subGroup.toLowerCase().includes('core') ||
         ex.subGroup.toLowerCase().includes('kardiyo'))
      ).slice(0, 4);
    } else {
      // Find and rank muscles by fatigue ascending (least fatigued first)
      const rankedMuscles = Object.entries(fatigueData).sort((a, b) => a[1] - b[1]);
      const targetMuscles = rankedMuscles.slice(0, 3).map(m => m[0]); // Top 3 recovered groups

      // Map fatigue keys to database muscle names
      const mapFatigueKeyToDb = (key) => {
        switch (key) {
          case 'chest': return ['Göğüs'];
          case 'back': return ['Sırt'];
          case 'legs': return ['Bacak'];
          case 'arms': return ['Kollar', 'Omuz'];
          case 'core': return ['Karın'];
          default: return [];
        }
      };

      const dbMuscleGroups = targetMuscles.flatMap(m => mapFatigueKeyToDb(m));

      // Candidates matching locations and target muscles
      let candidates = exercisesForLocation.filter(ex => dbMuscleGroups.includes(ex.muscleGroup));

      if (candidates.length === 0) {
        candidates = exercisesForLocation; // Fallback
      }

      // Shuffle and pick 4-5 exercises
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const selected = [];
      const countByMuscle = {};

      const userGoal = profile?.goal || 'Maintain Weight';

      for (const ex of shuffled) {
        if (selected.length >= 5) break;
        countByMuscle[ex.muscleGroup] = (countByMuscle[ex.muscleGroup] || 0) + 1;
        // Limit chest/legs to max 2 exercises in AI workout to ensure balance
        if (countByMuscle[ex.muscleGroup] <= 2) {
          let modifiedEx = { ...ex };
          // Hedefe göre antrenman sistemini adapte et
          if (userGoal === 'Lose Weight') {
            modifiedEx.defaultReps = (modifiedEx.defaultReps || 12) + 3; // Daha yüksek tekrar (Kardiyovasküler/Kalori Yakımı)
          } else if (userGoal === 'Build Muscle') {
            modifiedEx.defaultReps = Math.max(6, (modifiedEx.defaultReps || 10) - 2); // Daha düşük tekrar, hipertrofi odaklı
            modifiedEx.defaultSets = (modifiedEx.defaultSets || 3) + 1; // Daha fazla set (Hacim)
          }
          selected.push(modifiedEx);
        }
      }

      // Fill up to 5 if needed
      if (selected.length < 5) {
        for (const ex of shuffled) {
          if (selected.length >= 5) break;
          if (!selected.find(s => s.id === ex.id)) {
            let modifiedEx = { ...ex };
            if (userGoal === 'Lose Weight') {
              modifiedEx.defaultReps = (modifiedEx.defaultReps || 12) + 3;
            } else if (userGoal === 'Build Muscle') {
              modifiedEx.defaultReps = Math.max(6, (modifiedEx.defaultReps || 10) - 2);
              modifiedEx.defaultSets = (modifiedEx.defaultSets || 3) + 1;
            }
            selected.push(modifiedEx);
          }
        }
      }

      selectedExercises = selected;
    }

    // Return final workout package
    return {
      title: isRecovery ? t('workouts.activeRecovery') : `${getLocationLabel(workoutLocation)} AI Routine`,
      isRecovery,
      exercises: selectedExercises,
      totalCalories: selectedExercises.reduce((sum, ex) => sum + ((ex.defaultSets || 3) * (ex.burnedCalsPerSet || 10)), 0),
    };
  }, [workoutLocation, fatigueData, t, profile?.goal]);

  // Translate Location labels helper
  function getLocationLabel(loc) {
    if (loc === 'Gym') return 'Gym';
    if (loc === 'Evde Antrenman') return t('workouts.homeWorkouts') || 'Home';
    if (loc === 'Calisthenics') return 'Calisthenics';
    return loc;
  }

  // Fatigue advice helper text
  const fatigueFeedback = useMemo(() => {
    const bodyType = profile?.bodyType || 'mesomorph';
    const isTr = t('common.back') === 'Geri';
    
    let bodyTypeAdvice = '';
    if (isTr) {
      if (bodyType === 'ectomorph') bodyTypeAdvice = 'Ektomorf olduğun için toparlanman biraz uzun sürer, bolca dinlen.';
      else if (bodyType === 'mesomorph') bodyTypeAdvice = 'Mezomorf olduğun için hızlı toparlanıyorsun, antrenman sıklığını artırabilirsin.';
      else if (bodyType === 'endomorph') bodyTypeAdvice = 'Endomorf genetiğin sayesinde dengeli toparlanıyorsun.';
    } else {
      if (bodyType === 'ectomorph') bodyTypeAdvice = 'As an ectomorph, your recovery takes longer, rest well.';
      else if (bodyType === 'mesomorph') bodyTypeAdvice = 'As a mesomorph, you recover quickly, you can train more often.';
      else if (bodyType === 'endomorph') bodyTypeAdvice = 'Endomorph genetics have balanced recovery.';
    }

    const fatiguedMuscles = Object.entries(fatigueData)
      .filter(([_, val]) => val > 0.6)
      .map(([key]) => {
        if (key === 'chest') return isTr ? 'Göğüs' : 'Chest';
        if (key === 'back') return isTr ? 'Sırt' : 'Back';
        if (key === 'legs') return isTr ? 'Bacak' : 'Legs';
        if (key === 'arms') return isTr ? 'Kollar/Omuz' : 'Arms/Shoulders';
        if (key === 'core') return isTr ? 'Karın' : 'Core';
        return key;
      });

    if (fatiguedMuscles.length === 0) {
      return isTr
        ? `Tüm kaslarınız tamamen dinlenmiş durumda! Antrenman için harika bir gün.\n\n💡 ${bodyTypeAdvice}`
        : `All your muscles are fully recovered! Great day for a workout.\n\n💡 ${bodyTypeAdvice}`;
    }

    return isTr
      ? `${fatiguedMuscles.join(', ')} kaslarınızda yorgunluk yüksek. Dinlenmiş bölgeleri çalıştırmayı tercih edin.\n\n💡 ${bodyTypeAdvice}`
      : `High fatigue detected in: ${fatiguedMuscles.join(', ')}. Focus on rested groups.\n\n💡 ${bodyTypeAdvice}`;
  }, [fatigueData, profile?.bodyType, t]);

  // Starts active workout flow
  const handleStartWorkout = (routine) => {
    if (!routine.exercises || routine.exercises.length === 0) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Routine has no exercises!',
        position: 'top',
        topOffset: 60,
      });
      return;
    }
    navigation.navigate('ActiveWorkout', {
      exercises: routine.exercises,
      title: routine.title,
      isAi: routine.isAi,
    });
  };

  // Quick log activity via AI
  const handleQuickLog = async () => {
    if (!quickLogName.trim() || !quickLogDuration) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('workouts.fillRequiredFields'),
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    const duration = parseInt(quickLogDuration);

    if (isNaN(duration) || duration <= 0) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Lütfen geçerli bir süre girin.',
        position: 'top',
        topOffset: 60,
      });
      return;
    }

    setIsLogging(true);
    try {
      const query = `${duration} Dk ${quickLogName.trim()}`;
      const weight = profile?.weight || 75;
      const results = await searchWorkout(query, weight);
      
      const bestResult = results && results.length > 0 ? results[0] : null;
      const calculatedCalories = bestResult ? Math.round(bestResult.burnedCalories) : duration * 6; // fallback
      
      addWorkout({
        name: quickLogName.trim(),
        burnedCalories: calculatedCalories,
        exercises: [{ name: quickLogName.trim(), muscleGroup: 'Kardiyo/Aktif', defaultSets: 1, defaultReps: duration, burnedCalsPerSet: calculatedCalories }],
      });

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: `${quickLogName.trim()} kaydedildi! AI Tahmini: ~${calculatedCalories} kcal.`,
        position: 'top',
        topOffset: 60,
      });

      setQuickLogName('');
      setQuickLogDuration('');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Yapay Zeka kalori hesaplarken bir hata oluştu.',
        position: 'top',
        topOffset: 60,
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS_THEME.background, COLORS_THEME.card, COLORS_THEME.background]} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>{t('workouts.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('common.back') === 'Geri' ? 'Günlük egzersizlerini ve planlarını yönet' : 'Manage your routines & daily fitness plan'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.locationPill, { marginRight: SPACING.sm }]}
              onPress={() => setLocationModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name={workoutLocation === 'Gym' ? 'barbell' : 'home'} size={14} color={COLORS_THEME.primary} />
              <Text style={styles.locationText}>{getLocationLabel(workoutLocation)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS_THEME.primary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.historyBtn} 
              onPress={() => navigation.navigate('WorkoutHistory')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="history" size={24} color={COLORS_THEME.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. AI Recommendation Card */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="robot" size={20} color={COLORS_THEME.primary} style={{ marginRight: SPACING.xs }} />
              <Text style={styles.sectionTitle}>{t('workouts.aiRecommendation')}</Text>
            </View>

            <LinearGradient
              colors={aiWorkout.isRecovery ? ['rgba(64,192,87,0.08)', 'rgba(64,192,87,0.02)'] : ['rgba(43,138,62,0.08)', 'rgba(43,138,62,0.02)']}
              style={[styles.aiCard, { borderColor: aiWorkout.isRecovery ? COLORS_THEME.success : COLORS_THEME.primary }]}
            >
              <View style={styles.aiCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.aiCardTitle, { color: aiWorkout.isRecovery ? COLORS_THEME.success : COLORS_THEME.text }]}>
                    {aiWorkout.title}
                  </Text>
                  <Text style={styles.aiCardSubtitle}>{t('workouts.aiRecommendationDesc')}</Text>
                </View>
                {aiWorkout.isRecovery && (
                  <View style={[styles.recoveryBadge, { backgroundColor: COLORS_THEME.success }]}>
                    <Text style={styles.recoveryBadgeText}>RECOVERY</Text>
                  </View>
                )}
              </View>

              {/* Exercises List inside AI Card */}
              <View style={styles.exercisesList}>
                {aiWorkout.exercises.map((ex, idx) => (
                  <View key={ex.id || idx} style={styles.exerciseItem}>
                    <View style={styles.exerciseIndexContainer}>
                      <Text style={styles.exerciseIndex}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <Text style={styles.exerciseTarget}>{ex.muscleGroup} • {ex.subGroup}</Text>
                    </View>
                    <View style={styles.exerciseSpecs}>
                      <Text style={styles.exerciseSets}>{ex.defaultSets} {t('workouts.sets')}</Text>
                      <Text style={styles.exerciseReps}>{ex.defaultReps} {t('workouts.reps')}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Start Workout Button */}
              {consumedToday?.aiWorkoutCompletedToday ? (
                <View style={[styles.startButton, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Text style={[styles.startButtonText, { color: COLORS_THEME.textSecondary }]}>{t('workouts.aiWorkoutCompletedToday')}</Text>
                  <MaterialCommunityIcons name="check-circle" size={18} color={COLORS_THEME.textSecondary} />
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: aiWorkout.isRecovery ? COLORS_THEME.success : COLORS_THEME.primary }]}
                  onPress={() => handleStartWorkout({ ...aiWorkout, isAi: true })}
                  activeOpacity={0.9}
                >
                  <Text style={styles.startButtonText}>{t('workouts.startNow')}</Text>
                  <MaterialCommunityIcons name="play" size={18} color="#0D1117" />
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>

          {/* 2. Muscle Heatmap Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="human" size={20} color={COLORS_THEME.primary} style={{ marginRight: SPACING.xs }} />
              <Text style={styles.sectionTitle}>{t('workouts.muscleStatus')}</Text>
            </View>

            <View style={styles.heatmapCard}>
              <View style={styles.heatmapLeft}>
                <MuscleHeatmap fatigueData={fatigueData} size={150} />
              </View>

              <View style={styles.heatmapRight}>
                <Text style={styles.adviceTitle}>
                  {t('common.back') === 'Geri' ? 'Yapay Zeka Durum Analizi:' : 'AI Recovery Status:'}
                </Text>
                <Text style={styles.adviceText}>{fatigueFeedback}</Text>
                
                {/* Heatmap Legend */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#4ade80' }]} />
                    <Text style={styles.legendText}>{t('workouts.muscleRested')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#facc15' }]} />
                    <Text style={styles.legendText}>{t('workouts.muscleRecovering')}</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
                    <Text style={styles.legendText}>{t('workouts.muscleFatigued')}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>



          {/* 3. Custom Routines Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="notebook-outline" size={20} color={COLORS_THEME.primary} style={{ marginRight: SPACING.xs }} />
              <Text style={styles.sectionTitle}>{t('workouts.customPrograms')}</Text>
              <TouchableOpacity
                style={styles.addRoutineBtn}
                onPress={() => navigation.navigate('CustomWorkout')}
              >
                <Text style={styles.addRoutineText}>+ {t('common.add')}</Text>
              </TouchableOpacity>
            </View>

            {customRoutines && customRoutines.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routinesScroll}>
                {customRoutines.map((routine) => (
                  <TouchableOpacity
                    key={routine.id}
                    style={styles.routineCard}
                    onPress={() => handleStartWorkout({ title: routine.name, exercises: routine.exercises })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.routineCardHeader}>
                      <Text style={styles.routineCardName} numberOfLines={1}>{routine.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => removeCustomRoutine(routine.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginRight: 8 }}>
                          <MaterialCommunityIcons name="delete-outline" size={20} color="#FA5252" />
                        </TouchableOpacity>
                        <MaterialCommunityIcons name="play-circle" size={24} color={COLORS_THEME.primary} />
                      </View>
                    </View>
                    <Text style={styles.routineCardDetails}>
                      {t('workouts.exercisesCount', { count: routine.exercises?.length || 0 })}
                    </Text>
                    <View style={styles.routineExercisesList}>
                      {routine.exercises?.slice(0, 3).map((ex, i) => (
                        <Text key={ex.id || i} style={styles.routineExerciseMini} numberOfLines={1}>
                          • {ex.name}
                        </Text>
                      ))}
                      {(routine.exercises?.length || 0) > 3 && (
                        <Text style={styles.routineExerciseMiniMuted}>...</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyRoutinesCard}>
                <Text style={styles.emptyRoutinesText}>{t('workouts.noCustom')}</Text>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => navigation.navigate('CustomWorkout')}
                >
                  <Text style={styles.createBtnText}>{t('workouts.createCustom')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 4. Quick Log Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="square-edit-outline" size={20} color={COLORS_THEME.primary} style={{ marginRight: SPACING.xs }} />
              <Text style={styles.sectionTitle}>{t('workouts.quickLogTitle')}</Text>
            </View>

            <View style={styles.logCard}>
              <Text style={styles.logCardDesc}>{t('workouts.quickLogDesc')}</Text>
              
              <TextInput
                style={styles.input}
                placeholder={t('workouts.activityName')}
                placeholderTextColor={COLORS_THEME.textSecondary}
                value={quickLogName}
                onChangeText={setQuickLogName}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <HorizontalSlider
                    title={t('workouts.durationMin')}
                    value={parseInt(quickLogDuration, 10) || 30}
                    min={5} max={180} step={5}
                    onChange={(val) => setQuickLogDuration(val.toString())}
                    color="#4DABF7" unit="dk" showButtons={true}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.logSubmitButton, isLogging && { opacity: 0.7 }]}
                onPress={handleQuickLog}
                activeOpacity={0.8}
                disabled={isLogging}
              >
                {isLogging ? (
                  <ActivityIndicator size="small" color={COLORS_THEME.primary} />
                ) : (
                  <Text style={styles.logSubmitText}>{t('workouts.aiCalculateAndSave')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Padding bottom for safe scrolling past bottom tab bar */}
          <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />

        </ScrollView>
      </LinearGradient>

      {/* Location Selector Modal */}
      <Modal
        visible={locationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {t('common.back') === 'Geri' ? 'Antrenman Konumu' : 'Workout Location'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {t('common.back') === 'Geri'
                ? 'Seçiminize göre günlük antrenman programı yapay zeka tarafından güncellenir.'
                : 'Select your preferred location. The AI workout recommendation will update instantly.'}
            </Text>
            
            <TouchableOpacity 
              style={[styles.modalItem, { borderColor: workoutLocation === 'Gym' ? COLORS_THEME.primary : COLORS_THEME.border, borderWidth: workoutLocation === 'Gym' ? 2 : 1 }]}
              onPress={() => { updateProfileField('workoutLocation', 'Gym'); setLocationModalVisible(false); }}
            >
              <Text style={[styles.modalItemText, { color: COLORS_THEME.text }]}>Gym</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalItem, { borderColor: workoutLocation === 'Evde Antrenman' ? COLORS_THEME.primary : COLORS_THEME.border, borderWidth: workoutLocation === 'Evde Antrenman' ? 2 : 1 }]}
              onPress={() => { updateProfileField('workoutLocation', 'Evde Antrenman'); setLocationModalVisible(false); }}
            >
              <Text style={[styles.modalItemText, { color: COLORS_THEME.text }]}>{t('workouts.homeWorkouts')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalItem, { borderColor: workoutLocation === 'Calisthenics' ? COLORS_THEME.primary : COLORS_THEME.border, borderWidth: workoutLocation === 'Calisthenics' ? 2 : 1, marginBottom: SPACING.lg }]}
              onPress={() => { updateProfileField('workoutLocation', 'Calisthenics'); setLocationModalVisible(false); }}
            >
              <Text style={[styles.modalItemText, { color: COLORS_THEME.text }]}>Calisthenics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setLocationModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (COLORS_THEME) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS_THEME.background,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS_THEME.border,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS_THEME.text,
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_THEME.card,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.card,
  },
  locationText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 11,
    color: COLORS_THEME.text,
    marginHorizontal: 4,
  },
  historyBtn: {
    backgroundColor: COLORS_THEME.card,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.card,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS_THEME.text,
    flex: 1,
  },
  addRoutineBtn: {
    backgroundColor: 'rgba(64,192,87,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS_THEME.primary,
  },
  addRoutineText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.primary,
  },
  
  // AI Recommended Card Styles
  aiCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: SPACING.sm,
  },
  aiCardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
  },
  aiCardSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    marginTop: 2,
  },
  recoveryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  recoveryBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 8,
    color: '#0D1117',
  },
  exercisesList: {
    marginBottom: SPACING.lg,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  exerciseIndexContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  exerciseIndex: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
  },
  exerciseName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.text,
  },
  exerciseTarget: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.textSecondary,
    marginTop: 2,
  },
  exerciseSpecs: {
    alignItems: 'flex-end',
  },
  exerciseSets: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.primary,
  },
  exerciseReps: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.textSecondary,
    marginTop: 1,
  },
  startButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.button,
  },
  startButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#0D1117',
    fontSize: FONT_SIZE.md,
    marginRight: 6,
  },

  // Heatmap styles
  heatmapCard: {
    flexDirection: 'row',
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  heatmapLeft: {
    width: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapRight: {
    flex: 1,
    paddingLeft: SPACING.md,
  },
  adviceTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.text,
    marginBottom: SPACING.xs,
  },
  adviceText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  legendContainer: {
    marginTop: SPACING.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  legendText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.textSecondary,
  },

  // Custom routines styles
  routinesScroll: {
    paddingRight: SPACING.lg,
  },
  routineCard: {
    width: width * 0.45,
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    ...SHADOWS.card,
  },
  routineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  routineCardName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.text,
    flex: 1,
    marginRight: SPACING.xs,
  },
  routineCardDetails: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.primary,
    marginBottom: SPACING.sm,
  },
  routineExercisesList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: SPACING.xs,
  },
  routineExerciseMini: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.textSecondary,
    marginBottom: 2,
  },
  routineExerciseMiniMuted: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.textMuted,
    paddingLeft: 4,
  },
  emptyRoutinesCard: {
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  emptyRoutinesText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  createBtn: {
    backgroundColor: COLORS_THEME.cardLight,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  createBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.primary,
  },

  // Quick Log Card
  logCard: {
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    ...SHADOWS.card,
  },
  logCardDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS_THEME.cardLight,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.text,
    marginBottom: SPACING.md,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  logSubmitButton: {
    backgroundColor: 'rgba(43,138,62,0.1)',
    borderWidth: 1,
    borderColor: COLORS_THEME.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  logSubmitText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.primary,
  },

  // Location selector modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS_THEME.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalView: {
    width: '100%',
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS_THEME.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 16,
  },
  modalItem: {
    backgroundColor: COLORS_THEME.cardLight,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalItemText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
  },
  modalCloseBtn: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS_THEME.textSecondary,
  },
});
