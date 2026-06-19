import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { useAuth } from '../context/AuthContext';
import { SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme';
import DietSelectionModal from '../components/DietSelectionModal';
import TutorialModal from '../components/TutorialModal';
import { initNotifications } from '../services/notificationService';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Circular progress for the main calorie display
const CircularProgress = ({
  size = 200,
  strokeWidth = 16,
  progress = 0,
  color,
  backgroundColor,
  title,
  subtitle,
}) => {
  const COLORS = useThemeColors();
  const isDark = COLORS.background === '#0D1117';
  const styles = useMemo(() => getStyles(COLORS, isDark), [COLORS, isDark]);
  const cColor = color || COLORS.primary;
  const cBgColor = backgroundColor || 'rgba(64, 192, 87, 0.1)';

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, circumference - (circumference * Math.min(100, Math.max(0, progress))) / 100],
  });

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle stroke={cBgColor} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <AnimatedCircle
          stroke={cColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={[styles.progressTitle, { color: COLORS.text }]}>{title}</Text>
        <Text style={styles.progressSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

// Sleek horizontal macro indicator
const MacroBar = ({ label, current, target, color }) => {
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);
  const tVal = Math.round(target || 0);
  const cVal = Math.round(current || 0);
  const percentage = tVal > 0 ? Math.min(100, (cVal / tVal) * 100) : 0;

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroBarInfo}>
        <Text style={styles.macroBarLabel}>{label}</Text>
        <Text style={styles.macroBarValues}>{cVal} / {tVal}g</Text>
      </View>
      <View style={styles.macroProgressBg}>
        <View style={[styles.macroProgressFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const COLORS = useThemeColors();
  const isDark = COLORS.background === '#0D1117';
  const styles = useMemo(() => getStyles(COLORS, isDark), [COLORS, isDark]);
  const navigation = useNavigation();

  const { user } = useAuth();
  const {
    profile,
    stats,
    consumedToday,
    dailyLog,
    level,
    xp,
    streak,
    addWater,
    updateWeight,
    weightHistory,
    stepHistory,
    dietPlan,
    removeFood,
    fastingState,
    setFastingState,
    updateProfileField,
  } = useUserStore();

  const [dietModalVisible, setDietModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState(profile?.weight?.toString() || '75');

  // Trigger weight modal if 7 days passed since last update
  useEffect(() => {
    if (!profile) return;
    const checkWeightPrompt = async () => {
      try {
        const lastPrompt = await AsyncStorage.getItem('lastWeightPrompt');
        const today = new Date().toISOString().split('T')[0];
        if (lastPrompt === today) return;

        const history = weightHistory || [];
        if (history.length === 0) {
          setWeightModalVisible(true);
          return;
        }
        const lastEntry = history[history.length - 1];
        if (lastEntry?.date) {
          const lastDate = new Date(lastEntry.date);
          const now = new Date();
          const diffDays = Math.ceil(Math.abs(now - lastDate) / (1000 * 60 * 60 * 24));
          if (diffDays >= 7) {
            setWeightModalVisible(true);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };
    checkWeightPrompt();
  }, [profile]);

  const handleCloseWeightModal = async () => {
    setWeightModalVisible(false);
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('lastWeightPrompt', today);
  };

  // --- Fasting Logic ---
  const [fastingTimeLeft, setFastingTimeLeft] = useState(null);
  const [fastingProgress, setFastingProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (fastingState?.isActive && fastingState?.startTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const start = new Date(fastingState.startTime).getTime();
        const end = start + (fastingState.durationHours || 16) * 60 * 60 * 1000;
        
        const diff = end - now;
        if (diff <= 0) {
          setFastingTimeLeft('00:00:00');
          setFastingProgress(100);
          setFastingState({ isActive: false, startTime: null });
        } else {
          const totalMs = (fastingState.durationHours || 16) * 60 * 60 * 1000;
          const passed = now - start;
          const pct = Math.min(100, Math.max(0, (passed / totalMs) * 100));
          
          const hrs = Math.floor(diff / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          
          setFastingTimeLeft(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
          setFastingProgress(pct);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setFastingTimeLeft(null);
      setFastingProgress(0);
    }
    return () => clearInterval(interval);
  }, [fastingState]);

  const handleToggleFasting = () => {
    if (fastingState?.isActive) {
      setFastingState({ isActive: false });
    } else {
      setFastingState({ isActive: true, startTime: new Date().toISOString() });
    }
  };
  // -------------------

  // Removed handleSaveWeight since we navigate to StatsScreen

  // Calculations
  const targetCals = Math.round(stats?.targetCalories || 2000);
  const consumedCals = Math.round(consumedToday?.calories || 0);
  const burnedCals = Math.round(consumedToday?.burnedCalories || 0);
  const netCals = Math.max(0, consumedCals - burnedCals);

  const isExcess = netCals > targetCals;
  const calsDiff = isExcess ? netCals - targetCals : targetCals - netCals;
  const progressPercent = targetCals > 0 ? (netCals / targetCals) * 100 : 0;

  // Step Calculation
  const todaySteps = useMemo(() => {
    if (!stepHistory || stepHistory.length === 0) return 0;
    const lastEntry = stepHistory[stepHistory.length - 1];
    const todayStr = new Date().toDateString();
    const entryDateStr = new Date(lastEntry.date).toDateString();
    if (todayStr === entryDateStr) {
      return lastEntry.steps || 0;
    }
    return 0;
  }, [stepHistory]);

  // Water Calculation
  const baseWaterTargetL = parseFloat(stats?.micros?.water || profile?.waterTarget || 2.5);
  const extraWaterL = Math.floor(burnedCals / 100) * 0.15; // 150ml for every 100kcal burned
  const waterTargetL = baseWaterTargetL + extraWaterL;
  const waterTargetGlasses = Math.ceil(waterTargetL * 4);
  const waterConsumedGlasses = consumedToday?.water || 0;
  const waterConsumedL = waterConsumedGlasses * 0.25;
  const percentWater = Math.min(100, (waterConsumedGlasses / waterTargetGlasses) * 100);

  // Diet Timing Plan Map
  const rawDietPlan = profile?.dietPlan;
  const dietTimingStr = typeof rawDietPlan === 'object' ? rawDietPlan?.timing : rawDietPlan;
  const safeDietTiming = (typeof dietTimingStr === 'string' ? dietTimingStr : 'standard').toLowerCase();

  // Initialize notifications based on current diet plan and language
  useEffect(() => {
    initNotifications(safeDietTiming);
  }, [safeDietTiming, i18n.language]);

  const mealSlots = useMemo(() => {
    if (safeDietTiming === 'if' || safeDietTiming === 'if168' || safeDietTiming === 'if_16_8') {
      return [
        { key: 'firstMeal', label: t('dashboard.firstMeal') },
        { key: 'lastMeal', label: t('dashboard.lastMeal') },
        { key: 'snack', label: t('dashboard.snack') },
      ];
    } else if (safeDietTiming === 'omad') {
      return [
        { key: 'singleMeal', label: t('dashboard.singleMeal') },
        { key: 'liquidSnack', label: t('dashboard.liquidSnack') },
      ];
    } else {
      return [
        { key: 'breakfast', label: t('dashboard.breakfast') },
        { key: 'lunch', label: t('dashboard.lunch') },
        { key: 'dinner', label: t('dashboard.dinner') },
        { key: 'snack', label: t('dashboard.snack') },
      ];
    }
  }, [safeDietTiming, t]);

  const getMealsForSlot = (slotKey) => {
    return dailyLog?.foods?.filter(food => food.mealType === slotKey) || [];
  };

  const getSlotCals = (slotKey) => {
    return Math.round(getMealsForSlot(slotKey).reduce((sum, f) => sum + (f.calories || 0), 0));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={COLORS.background === '#0D1117' ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.card, COLORS.background]} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {t('common.back') === 'Geri' ? 'Merhaba,' : 'Hello,'} {profile?.nickname || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          
          <View style={styles.headerBadges}>
            {/* Streak Indicator */}
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={16} color="#0D1117" style={{ marginRight: 2 }} />
              <Text style={styles.streakText}>{streak || 0}</Text>
            </View>
            
            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL {level || 1}</Text>
            </View>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Minimalist Daily Steps */}
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => navigation.navigate('Stats')}
            style={{ marginBottom: SPACING.xl, paddingHorizontal: SPACING.xs }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="shoe-print" size={16} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary }}>
                  {t('common.back') === 'Geri' ? 'Adım' : 'Steps'}
                </Text>
              </View>
              <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: COLORS.text }}>
                {todaySteps.toLocaleString()} <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary }}>/ {(profile?.stepTarget || 10000).toLocaleString()}</Text>
              </Text>
            </View>
            <View style={{ height: 3, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: '100%', backgroundColor: COLORS.text, borderRadius: 2, width: `${Math.min(100, (todaySteps / (profile?.stepTarget || 10000)) * 100)}%` }} />
            </View>
          </TouchableOpacity>

          {/* --- RPG ENERGY CORE (Replaces Calorie Section) --- */}
          <View style={styles.rpgEnergyContainer}>
            <View style={styles.rpgEnergyHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.rpgEnergyTitle}>{t('dashboard.energyCore')}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[styles.rpgEnergyStatus, isExcess && { color: COLORS.error }]}>{isExcess ? t('dashboard.overload') : t('dashboard.optimal')}</Text>
            </View>

            <View style={styles.rpgEnergyBarBg}>
              <Animated.View style={[styles.rpgEnergyBarFill, { width: `${Math.min(100, progressPercent)}%`, backgroundColor: isExcess ? COLORS.error : COLORS.primary }]} />
              <View style={styles.rpgEnergyTextOverlay}>
                <Text style={styles.rpgEnergyVal}>{consumedCals} / {targetCals} <Text style={{ fontSize: 10 }}>KCAL</Text></Text>
              </View>
            </View>

            {/* RPG Stats (Macros) */}
            <View style={styles.rpgStatsRow}>
              <View style={styles.rpgStatBox}>
                <Text style={styles.rpgStatLabel}>{t('dashboard.str')}</Text>
                <Text style={styles.rpgStatVal}>{Math.round(consumedToday?.protein || 0)}/{Math.round(stats?.macros?.protein || 120)}g</Text>
                <View style={styles.rpgStatBarBg}><View style={[styles.rpgStatBarFill, { backgroundColor: '#FF6B6B', width: `${Math.min(100, ((consumedToday?.protein || 0)/(stats?.macros?.protein || 120))*100)}%` }]} /></View>
              </View>

              <View style={styles.rpgStatBox}>
                <Text style={styles.rpgStatLabel}>{t('dashboard.agi')}</Text>
                <Text style={styles.rpgStatVal}>{Math.round(consumedToday?.carbs || 0)}/{Math.round(stats?.macros?.carbs || 200)}g</Text>
                <View style={styles.rpgStatBarBg}><View style={[styles.rpgStatBarFill, { backgroundColor: '#4DABF7', width: `${Math.min(100, ((consumedToday?.carbs || 0)/(stats?.macros?.carbs || 200))*100)}%` }]} /></View>
              </View>

              <View style={styles.rpgStatBox}>
                <Text style={styles.rpgStatLabel}>{t('dashboard.vit')}</Text>
                <Text style={styles.rpgStatVal}>{Math.round(consumedToday?.fat || 0)}/{Math.round(stats?.macros?.fat || 70)}g</Text>
                <View style={styles.rpgStatBarBg}><View style={[styles.rpgStatBarFill, { backgroundColor: '#FCC419', width: `${Math.min(100, ((consumedToday?.fat || 0)/(stats?.macros?.fat || 70))*100)}%` }]} /></View>
              </View>
            </View>
          </View>

          {/* --- RPG FASTING AURA (Replaces Fasting Section) --- */}
          {(safeDietTiming === 'if' || safeDietTiming === 'if168' || safeDietTiming === 'if_16_8' || safeDietTiming === 'omad') && (
            <View style={[styles.rpgAuraContainer, fastingState?.isActive && styles.rpgAuraActive]}>
              <View style={styles.rpgAuraIconBox}>
                <MaterialCommunityIcons name="shield-sun" size={28} color={fastingState?.isActive ? '#FCC419' : COLORS.textMuted} />
              </View>
              <View style={styles.rpgAuraInfo}>
                <Text style={[styles.rpgAuraTitle, fastingState?.isActive && { color: '#FCC419' }]}>
                  {fastingState?.isActive ? t('dashboard.activeAura') : t('dashboard.inactiveAura')}
                </Text>
                <Text style={styles.rpgAuraTimer}>
                  {fastingState?.isActive ? fastingTimeLeft : t('dashboard.readyToCast')}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.rpgAuraBtn}
                onPress={handleToggleFasting}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name={fastingState?.isActive ? 'stop-circle-outline' : 'play-circle-outline'} size={36} color={fastingState?.isActive ? COLORS.error : COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* --- RPG INVENTORY (Replaces Diary Section) --- */}
          <View style={styles.rpgInventorySection}>
            <View style={styles.rpgInventoryHeaderRow}>
              <Text style={styles.rpgInventoryTitle}>{t('dashboard.rations')}</Text>
              <TouchableOpacity style={styles.dietPill} onPress={() => setDietModalVisible(true)} activeOpacity={0.8}>
                <Text style={styles.dietPillText}>
                  {safeDietTiming === 'if' || safeDietTiming === 'if168' || safeDietTiming === 'if_16_8' ? t('dashboard.if168') : safeDietTiming === 'omad' ? t('dashboard.omad') : t('dashboard.classic')}
                </Text>
                <MaterialCommunityIcons name="pencil-outline" size={12} color={COLORS.primary} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.rpgInventoryGrid}>
              {mealSlots.map((slot) => {
                const meals = getMealsForSlot(slot.key);
                const slotCals = getSlotCals(slot.key);

                return (
                  <View key={slot.key} style={styles.rpgInventorySlot}>
                    <TouchableOpacity style={styles.rpgInventorySlotAdd} onPress={() => navigation.navigate('Meals', { mealType: slot.key })} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="plus" size={20} color={isDark ? '#0D1117' : '#FFFFFF'} />
                    </TouchableOpacity>
                    
                    <View style={styles.rpgInventorySlotHeader}>
                      <Text style={styles.rpgInventorySlotLabel}>{slot.label.toUpperCase()}</Text>
                      <Text style={styles.rpgInventorySlotCals}>{slotCals > 0 ? `${slotCals} KCAL` : t('dashboard.emptySlot')}</Text>
                    </View>

                    <View style={styles.rpgInventoryItems}>
                      {meals.length === 0 ? (
                        <View style={styles.rpgInventoryEmptyState}>
                          <MaterialCommunityIcons name="flask-empty-outline" size={28} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                        </View>
                      ) : (
                        meals.map((meal) => (
                          <View key={meal.id} style={styles.rpgInventoryItem}>
                            <Text style={styles.rpgInventoryItemName} numberOfLines={1}>{meal.name}</Text>
                            <TouchableOpacity onPress={() => removeFood(meal.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                              <MaterialCommunityIcons name="close" size={14} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 3. Workouts Summary Card */}
          <View style={styles.cardRowContainer}>
            
            {/* Active Burn Card */}
            <TouchableOpacity
              style={styles.halfCard}
              onPress={() => navigation.navigate('WorkoutsTab')}
              activeOpacity={0.8}
            >
              <View style={styles.halfCardHeader}>
                <View style={[styles.halfIconCircle, { backgroundColor: 'rgba(250,82,82,0.1)' }]}>
                  <MaterialCommunityIcons name="run" size={20} color="#FA5252" />
                </View>
                <Text style={styles.halfCardTitle}>
                  {t('common.back') === 'Geri' ? 'Aktif Yakım' : 'Active Burn'}
                </Text>
              </View>
              <Text style={styles.halfCardVal}>{burnedCals} <Text style={styles.halfCardUnit}>kcal</Text></Text>
              <Text style={styles.halfCardSubtitle}>
                {dailyLog?.workouts?.length > 0
                  ? t('common.back') === 'Geri'
                    ? `${dailyLog.workouts.length} antrenman tamamlandı`
                    : `${dailyLog.workouts.length} routine done`
                  : t('dashboard.noWorkout')}
              </Text>
            </TouchableOpacity>

            {/* Hydration Status Card */}
            <View style={styles.halfCard}>
              <View style={styles.halfCardHeader}>
                <View style={[styles.halfIconCircle, { backgroundColor: 'rgba(77,171,247,0.1)' }]}>
                  <MaterialCommunityIcons name="water" size={20} color="#4DABF7" />
                </View>
                <Text style={styles.halfCardTitle}>
                  {t('dashboard.water')}
                </Text>
              </View>

              {/* Animated Glass Wave Illustration */}
              <View style={styles.glassContainer}>
                <View style={styles.glassOuterBorder}>
                  <View style={[styles.glassWaterFill, { height: `${percentWater}%` }]} />
                </View>
                <Text style={styles.glassText}>
                  {waterConsumedL.toFixed(2)}L / {waterTargetL.toFixed(1)}L
                </Text>
                {extraWaterL > 0 && (
                  <Text style={{ fontSize: 9, color: '#4DABF7', fontFamily: TYPOGRAPHY.fontFamily.bold, marginTop: 2, textAlign: 'center' }}>
                    +{extraWaterL.toFixed(2)}L {t('common.back') === 'Geri' ? '(Antrenman)' : '(Workout)'}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: SPACING.md }}>
                <TouchableOpacity
                  style={[styles.waterAddBtn, { width: 40, height: 32, paddingVertical: 0, justifyContent: 'center' }]}
                  onPress={() => {
                    if (waterConsumedGlasses > 0) {
                      addWater(-1);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="minus" size={20} color="#4DABF7" />
                </TouchableOpacity>

                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.waterAddBtnText, { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }]}>
                    {t('common.back') === 'Geri' ? '1 Bardak (250ml)' : '1 Glass (250ml)'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.waterAddBtn, { width: 40, height: 32, paddingVertical: 0, justifyContent: 'center' }]}
                  onPress={() => {
                    addWater(1);
                    Toast.show({
                      type: 'success',
                      text1: '+250ml 💧',
                      text2: t('common.back') === 'Geri' ? 'Su hedefine yaklaşıyorsun!' : 'Getting closer to water goal!',
                      position: 'top',
                      topOffset: 60,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#4DABF7" />
                </TouchableOpacity>
              </View>
            </View>

          </View>

          {/* 4. Daily Goals Quick Access Card */}
          <View style={styles.goalsAccessContainer}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: SPACING.md,
                paddingHorizontal: SPACING.lg,
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: BORDER_RADIUS.full,
                backgroundColor: 'transparent',
              }}
              onPress={() => navigation.navigate('QuestsTab')}
              activeOpacity={0.6}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="bullseye-arrow" size={18} color={COLORS.textSecondary} style={{ marginRight: SPACING.sm }} />
                <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xs, color: COLORS.text, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {t('common.back') === 'Geri' ? 'Günlük Hedefler' : 'Daily Goals'}
                </Text>
              </View>
              <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Bottom padding for tab bar buffer */}
          <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />

        </ScrollView>
      </LinearGradient>

      {/* Diet Plan timings Selector Modal */}
      <DietSelectionModal
        visible={dietModalVisible}
        onClose={() => setDietModalVisible(false)}
        currentPlan={{ timing: profile?.dietPlan, macroSplit: profile?.macroSplit }}
        onSave={(newPlan) => {
          updateProfileField('dietPlan', newPlan.timing);
          updateProfileField('macroSplit', newPlan.macroSplit);
        }}
      />

      {/* Weight Log Modal Alert */}
      <Modal
        visible={weightModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseWeightModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{t('dashboard.weightCheck')}</Text>
            <Text style={styles.modalSubtitle}>{t('dashboard.weightCheckDesc')}</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={handleCloseWeightModal}>
                <Text style={styles.cancelBtnText}>{t('dashboard.weightCheckSkip')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmBtn]} onPress={() => { handleCloseWeightModal(); navigation.navigate('Stats'); }}>
                <Text style={styles.confirmBtnText}>{t('common.back') === 'Geri' ? 'İstatistiklere Git' : 'Go to Stats'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Redesigned Custom Tutorial Walkthrough Modal Overlay */}
      <TutorialModal />

    </View>
  );
}

const getStyles = (COLORS, isDark) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  email: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCC419',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  streakText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 12,
    color: '#0D1117',
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  levelText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 11,
    color: '#0D1117',
  },
  scrollContent: {
    padding: SPACING.lg,
  },

  // --- NEW RPG STYLES ---

  // RPG Energy Core
  rpgEnergyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.border,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
  rpgEnergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  rpgEnergyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    letterSpacing: 2,
  },
  rpgEnergyStatus: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    letterSpacing: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rpgEnergyBarBg: {
    width: '100%',
    height: 36,
    backgroundColor: isDark ? '#0D1117' : '#E9ECEF',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: isDark ? '#30363D' : '#CED4DA',
  },
  rpgEnergyBarFill: {
    height: '100%',
  },
  rpgEnergyTextOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rpgEnergyVal: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: isDark ? '#FFFFFF' : '#000000',
    letterSpacing: 1,
  },
  rpgStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  rpgStatBox: {
    flex: 1,
  },
  rpgStatLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  rpgStatVal: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    marginBottom: 6,
  },
  rpgStatBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: isDark ? '#0D1117' : '#E9ECEF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  rpgStatBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // RPG Fasting Aura
  rpgAuraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#161B22' : '#FFFFFF',
    borderWidth: 1,
    borderColor: isDark ? '#30363D' : '#DEE2E6',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  rpgAuraActive: {
    borderColor: '#FCC419',
    backgroundColor: isDark ? 'rgba(252,196,25,0.05)' : 'rgba(252,196,25,0.05)',
  },
  rpgAuraIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: isDark ? '#0D1117' : '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: isDark ? '#30363D' : '#E9ECEF',
  },
  rpgAuraInfo: {
    flex: 1,
  },
  rpgAuraTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  rpgAuraTimer: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  rpgAuraBtn: {
    padding: SPACING.xs,
  },

  // RPG Inventory Section
  rpgInventorySection: {
    marginBottom: SPACING.xxl,
  },
  rpgInventoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  rpgInventoryTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    letterSpacing: 1.5,
  },
  rpgInventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  rpgInventorySlot: {
    width: (width - (SPACING.lg * 2) - SPACING.md) / 2, // 2 columns
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: isDark ? '#30363D' : '#DEE2E6',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 120,
    position: 'relative',
  },
  rpgInventorySlotAdd: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  rpgInventorySlotHeader: {
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  rpgInventorySlotLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 11,
    color: COLORS.text,
    letterSpacing: 1,
    marginBottom: 2,
  },
  rpgInventorySlotCals: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 9,
    color: COLORS.textMuted,
  },
  rpgInventoryItems: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  rpgInventoryEmptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
    marginTop: 8,
  },
  rpgInventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rpgInventoryItemName: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    flex: 1,
    marginRight: 4,
  },
  
  fastingProgressFill: {
    height: '100%',
    backgroundColor: '#FCC419',
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.glow,
  },
  fastingToggleBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.button,
  },
  fastingToggleBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
  dietPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  dietPillText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 9,
    color: COLORS.primary,
  },
  mealSlotCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.card,
  },
  mealSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealSlotLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  mealSlotCals: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addFoodBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(64,192,87,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedMealsList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: SPACING.sm,
    marginTop: SPACING.sm,
  },
  loggedMealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  loggedMealName: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  loggedMealCals: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cardRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  halfCard: {
    width: width * 0.44,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    justifyContent: 'space-between',
    minHeight: 145,
    ...SHADOWS.card,
  },
  halfCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  halfIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  halfCardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  halfCardVal: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.text,
  },
  halfCardUnit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  halfCardSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 11,
    marginTop: SPACING.xs,
  },
  glassContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  glassOuterBorder: {
    width: 38,
    height: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  glassWaterFill: {
    width: '100%',
    backgroundColor: '#4DABF7',
  },
  glassText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    color: COLORS.text,
    marginTop: 4,
  },
  waterAddBtn: {
    backgroundColor: 'rgba(77,171,247,0.1)',
    borderWidth: 1,
    borderColor: '#4DABF7',
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  waterAddBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 9,
    color: '#4DABF7',
  },
  goalsAccessContainer: {
    marginBottom: SPACING.xl,
  },
  goalsAccessCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  goalsAccessGradient: {
    padding: SPACING.md,
  },
  goalsAccessTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  goalsAccessSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalView: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  modalTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginBottom: SPACING.md,
  },
  modalInput: {
    backgroundColor: COLORS.cardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: COLORS.cardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  cancelBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: '#0D1117',
  },
});
