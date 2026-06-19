import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Modal, 
  Dimensions, Animated, Platform, Vibration
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useKeepAwake } from 'expo-keep-awake';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { useUserStore } from '../store/userStore';
import { COLORS, SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Dinamik Dinlenme Süresi Hesaplayıcı
const getDynamicRestSeconds = (exercise) => {
  const name = exercise.name.toLowerCase();
  const group = exercise.muscleGroup.toLowerCase();
  
  if (name.includes('squat') || name.includes('deadlift') || name.includes('bench press') || name.includes('leg press')) {
    return 90;
  }
  if (group.includes('bacak') || group.includes('sırt') || group.includes('göğüs')) {
    return 60;
  }
  if (group.includes('kollar') || group.includes('karın') || group.includes('omuz')) {
    return 45;
  }
  return 60;
};

// Hareket Talimatları
const getExerciseInstructions = (exercise) => {
  const name = exercise.name.toLowerCase();
  let text = "1. Başlangıç pozisyonunu alın ve postürünüzü dik tutun.\n2. Ağırlığı kontrollü bir şekilde hareket ettirin.\n3. Kaslarınızı tepe noktasında sıkarak nefes verin.\n4. Başlangıç pozisyonuna yavaşça dönerken nefes alın.";
  
  if (name.includes('squat') || name.includes('bacak')) {
    text = "1. Ayaklarınızı omuz hizasında açın.\n2. Dizleriniz ayak parmak ucunuzu geçmeyecek şekilde kalçanızı geriye doğru iterek çömelin.\n3. Topuklarınızdan güç alarak yukarı kalkın ve nefes verin.\n4. Omurganızı dik tutmayı unutmayın.";
  } else if (name.includes('bench') || name.includes('göğüs')) {
    text = "1. Sehpaya sırt üstü uzanın, belinizde hafif bir kavis bırakın.\n2. Barı veya dambılları göğüs hizanıza kontrollü şekilde indirin.\n3. Göğüs kaslarınızı sıkarak ağırlığı yukarı itin.\n4. Dirseklerinizi tamamen kilitlemeden hareketi tekrarlayın.";
  } else if (name.includes('curl') || name.includes('kol')) {
    text = "1. Dirseklerinizi gövdenize sabitleyin ve hareket ettirmeyin.\n2. Sadece ön kolunuzu kullanarak ağırlığı yukarı kaldırın.\n3. Tepe noktasında biceps kasınızı 1 saniye kadar sıkın.\n4. Ağırlığı yavaşça indirerek hareketi tamamlayın.";
  } else if (name.includes('plank') || name.includes('karın') || name.includes('mekik')) {
    text = "1. Karın kaslarınızı sürekli sıkı (aktif) tutun.\n2. Belinize yük binmemesi için bel kavisini düzleştirin.\n3. Hareketi boynunuzdan değil, karın kaslarınızdan güç alarak yapın.\n4. Her tekrarda nefes vererek kasılmayı maksimuma çıkarın.";
  }
  return text;
};

// Asil ve Mat Timer Çemberi
const TimerRing = ({ size = 260, strokeWidth = 10, progress = 0, currentSeconds }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference - (circumference * Math.max(0, Math.min(100, progress))) / 100],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle stroke="rgba(255,255,255,0.03)" fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <AnimatedCircle
          stroke={COLORS.primary} // QuestFit Yeşili
          fill="none"
          cx={size / 2} cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 80, color: COLORS.text, height: 90, includeFontPadding: false }}>
          {currentSeconds}
        </Text>
        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, letterSpacing: 3 }}>
          SANİYE
        </Text>
      </View>
    </View>
  );
};

export default function ActiveWorkoutScreen() {
  useKeepAwake();
  const navigation = useNavigation();
  const route = useRoute();
  const { addWorkout } = useUserStore();
  
  const { exercises, title, isAi } = route.params || { exercises: [] };

  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [exerciseSets, setExerciseSets] = useState(Array(exercises.length).fill(1));
  const [isResting, setIsResting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [totalRestTime, setTotalRestTime] = useState(60);
  
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentExercise = exercises[currentExIndex];
  const totalSets = currentExercise?.defaultSets || 3;
  const reps = currentExercise?.defaultReps || 10;
  const currentSet = exerciseSets[currentExIndex];

  useEffect(() => {
    let timer;
    if (isResting && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isResting && timeLeft <= 0) {
      handleRestComplete();
    }
    return () => clearInterval(timer);
  }, [isResting, timeLeft]);

  const handleRestComplete = () => {
    Vibration.vibrate(100);
    setIsResting(false);
    if (currentSet < totalSets) {
      const newSets = [...exerciseSets];
      newSets[currentExIndex] += 1;
      setExerciseSets(newSets);
    } else {
      goToNextExercise();
    }
  };

  const goToNextExercise = () => {
    if (currentExIndex < exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
      setIsResting(false);
    } else {
      triggerFinishFlow();
    }
  };

  const goToPrevExercise = () => {
    if (currentExIndex > 0) {
      setCurrentExIndex(prev => prev - 1);
      setIsResting(false);
    }
  };

  const completeSet = () => {
    Vibration.vibrate(50);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
    ]).start();

    if (currentExIndex === exercises.length - 1 && currentSet === totalSets) {
      triggerFinishFlow();
    } else {
      const targetRest = getDynamicRestSeconds(currentExercise);
      setTotalRestTime(targetRest);
      setTimeLeft(targetRest);
      setIsResting(true);
    }
  };

  const triggerFinishFlow = () => {
    Vibration.vibrate(100);
    setFinishModalVisible(true);
  };

  const finishWorkout = () => {
    setFinishModalVisible(false);
    const totalCals = exercises.reduce((sum, ex) => sum + ((ex.defaultSets || 3) * (ex.burnedCalsPerSet || 10)), 0);
    
    addWorkout({
      name: title,
      burnedCalories: totalCals,
      isAi: isAi,
      exercises: exercises
    });

    Toast.show({
      type: 'success',
      text1: 'Antrenman Tamamlandı!',
      text2: `${totalCals} kcal yakıldı ve XP kazanıldı!`,
      position: 'top',
      topOffset: 60,
    });

    navigation.navigate('MainTabs', { screen: 'WorkoutsTab' });
  };

  const addTime = (seconds) => {
    Vibration.vibrate(30);
    setTimeLeft(prev => prev + seconds);
    setTotalRestTime(prev => prev + seconds); 
  };

  if (!currentExercise) return null;

  return (
    <View style={styles.container}>
      {/* QuestFit Orijinal Teması */}
      <LinearGradient colors={[COLORS.background, COLORS.card, COLORS.background]} style={styles.gradient}>
        
        {/* Header & Progress */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="close" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressTextTitle}>HAREKET {currentExIndex + 1} / {exercises.length}</Text>
            </View>
            <TouchableOpacity onPress={() => setInfoModalVisible(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialCommunityIcons name="information-outline" size={26} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((currentExIndex) / exercises.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.content}>
          {isResting ? (
            // DİNLENME EKRANI
            <View style={styles.restContainer}>
              <Text style={styles.restTitle}>DİNLENME</Text>
              
              <View style={styles.timerWrapper}>
                <TimerRing 
                  size={280} 
                  strokeWidth={8} 
                  progress={(timeLeft / totalRestTime) * 100} 
                  currentSeconds={timeLeft}
                  totalSeconds={totalRestTime}
                />
              </View>

              <View style={styles.timerControls}>
                <TouchableOpacity style={styles.timeControlBtn} onPress={() => addTime(-15)}>
                  <MaterialCommunityIcons name="minus" size={20} color={COLORS.text} />
                  <Text style={styles.timeControlText}>15s</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipBtn} onPress={handleRestComplete}>
                  <Text style={styles.skipBtnText}>ATLA</Text>
                  <MaterialCommunityIcons name="skip-forward" size={18} color="#0D1117" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.timeControlBtn} onPress={() => addTime(15)}>
                  <MaterialCommunityIcons name="plus" size={20} color={COLORS.text} />
                  <Text style={styles.timeControlText}>15s</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.nextExerciseText}>
                Sıradaki Set: {currentSet < totalSets ? `${currentSet + 1}. Set` : 'Yeni Hareket'}
              </Text>
            </View>
          ) : (
            // AKTİF EGZERSİZ EKRANI
            <View style={styles.exerciseContainer}>
              
              <View style={styles.exerciseHeaderRow}>
                <TouchableOpacity onPress={goToPrevExercise} disabled={currentExIndex === 0} style={{ padding: 10, opacity: currentExIndex === 0 ? 0.2 : 1 }}>
                  <MaterialCommunityIcons name="chevron-left" size={32} color={COLORS.textSecondary} />
                </TouchableOpacity>
                
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.exerciseName} adjustsFontSizeToFit numberOfLines={2}>{currentExercise.name}</Text>
                  <View style={styles.muscleBadge}>
                    <Text style={styles.muscleBadgeText}>{currentExercise.muscleGroup.toUpperCase()}</Text>
                  </View>
                </View>

                <TouchableOpacity onPress={goToNextExercise} disabled={currentExIndex === exercises.length - 1} style={{ padding: 10, opacity: currentExIndex === exercises.length - 1 ? 0.2 : 1 }}>
                  <MaterialCommunityIcons name="chevron-right" size={32} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>SET</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.statValueMain}>{Math.min(currentSet, totalSets)}</Text>
                    <Text style={styles.statValueSub}>/{totalSets}</Text>
                  </View>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>TEKRAR</Text>
                  <Text style={styles.statValueMain}>{reps}</Text>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
                {currentSet > totalSets ? (
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]} onPress={goToNextExercise} activeOpacity={0.9}>
                    <Text style={[styles.completeBtnText, { color: COLORS.textSecondary }]}>BU HAREKET BİTTİ, GEÇ</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.completeBtn} onPress={completeSet} activeOpacity={0.9}>
                    <Text style={styles.completeBtnText}>SETİ TAMAMLA</Text>
                    <MaterialCommunityIcons name="check-bold" size={20} color="#0D1117" style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                )}
              </Animated.View>

            </View>
          )}
        </View>

      </LinearGradient>

      {/* NASIL YAPILIR MODALI */}
      <Modal visible={infoModalVisible} transparent animationType="slide" onRequestClose={() => setInfoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={COLORS.accent} style={{ marginRight: 8 }} />
                <Text style={styles.infoModalTitle}>Nasıl Yapılır?</Text>
              </View>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoExerciseName}>{currentExercise?.name}</Text>
            <Text style={styles.infoInstructions}>{getExerciseInstructions(currentExercise)}</Text>
            
            <TouchableOpacity style={styles.infoModalBtn} onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.infoModalBtnText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ANTRENMAN BİTİŞ MODALI */}
      <Modal visible={finishModalVisible} transparent animationType="fade">
        <View style={styles.finishOverlay}>
          <View style={styles.finishCard}>
            <View style={styles.finishIconContainer}>
              <MaterialCommunityIcons name="crown" size={60} color={COLORS.accent} />
            </View>
            <Text style={styles.finishTitle}>ANTRENMAN BİTTİ</Text>
            <Text style={styles.finishSubtitle}>Bugünkü hedefini tamamladın.</Text>
            
            <View style={styles.finishStatsRow}>
              <View style={styles.finishStatBox}>
                <Text style={styles.finishStatVal}>{exercises.length}</Text>
                <Text style={styles.finishStatLabel}>HAREKET</Text>
              </View>
              <View style={styles.finishStatBox}>
                <Text style={[styles.finishStatVal, { color: COLORS.accent }]}>+300</Text>
                <Text style={styles.finishStatLabel}>XP</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout} activeOpacity={0.8}>
              <Text style={styles.finishBtnText}>BİTİR VE ÇIK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  gradient: { flex: 1 },
  
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  progressTextContainer: { alignItems: 'center' },
  progressTextTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 11, letterSpacing: 2 },
  progressBarBg: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BORDER_RADIUS.full },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full },

  content: { flex: 1, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },

  restContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  restTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.primary, fontSize: FONT_SIZE.lg, letterSpacing: 4, marginBottom: 40 },
  timerWrapper: { marginBottom: 50 },
  timerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: SPACING.xl, marginBottom: 40 },
  timeControlBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  timeControlText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 10, marginTop: 2 },
  skipBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.full, marginHorizontal: SPACING.lg },
  skipBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: '#0D1117', fontSize: FONT_SIZE.sm, marginRight: 6 },
  nextExerciseText: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },

  exerciseContainer: { flex: 1, alignItems: 'center', paddingTop: 30 },
  exerciseHeaderRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 40 },
  exerciseName: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: 28, textAlign: 'center', lineHeight: 34, marginBottom: SPACING.sm },
  muscleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BORDER_RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  muscleBadgeText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 10, letterSpacing: 1 },

  statsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, width: '100%', borderWidth: 1, borderColor: COLORS.border },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 50, backgroundColor: COLORS.border },
  statLabel: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, fontSize: 11, letterSpacing: 2, marginBottom: 8 },
  statValueMain: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: 52, lineHeight: 56 },
  statValueSub: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 20, marginLeft: 4 },

  completeBtn: { width: '100%', borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.primary, flexDirection: 'row', paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
  completeBtnText: { color: '#0D1117', fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.lg, letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  infoModalContent: { backgroundColor: COLORS.card, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl, borderWidth: 1, borderColor: COLORS.border, borderBottomWidth: 0 },
  infoModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  infoModalTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.lg },
  infoExerciseName: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.accent, fontSize: FONT_SIZE.md, marginBottom: SPACING.md },
  infoInstructions: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 22, marginBottom: SPACING.xl },
  infoModalBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  infoModalBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: FONT_SIZE.sm },

  finishOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  finishCard: { width: '100%', borderRadius: BORDER_RADIUS.xl, backgroundColor: COLORS.card, padding: SPACING.xl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  finishIconContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(232, 194, 141, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg },
  finishTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: 22, letterSpacing: 1, marginBottom: SPACING.xs },
  finishSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xl },
  finishStatsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', marginBottom: SPACING.xl },
  finishStatBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: SPACING.md, borderRadius: BORDER_RADIUS.lg, minWidth: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  finishStatVal: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.text, fontSize: 28 },
  finishStatLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: COLORS.textSecondary, fontSize: 10, letterSpacing: 1, marginTop: 4 },
  finishBtn: { width: '100%', borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.accent, paddingVertical: SPACING.md, alignItems: 'center' },
  finishBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, color: '#0D1117', fontSize: FONT_SIZE.md },
});
