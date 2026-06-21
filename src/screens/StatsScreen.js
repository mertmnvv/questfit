import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { fetchStepHistory } from '../services/healthService';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';
import HorizontalSlider from '../components/HorizontalSlider';

const { width } = Dimensions.get('window');

// Helper to format date strings
const getDayName = (dateStr, lang) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang, { weekday: 'short' });
};
const getDayNumber = (dateStr) => {
  return new Date(dateStr).getDate();
};

// --- Micro-animated Solid Card Component ---
const SolidCard = ({ children, style, delay = 0, variant = 'default' }) => {
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];
  const COLORS_THEME = useThemeColors();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const bgColors = {
    default: COLORS_THEME.card,
    danger: '#FF6B6B',
    success: '#40C057',
    primary: '#845EF7'
  };

  return (
    <Animated.View style={[
      styles.solidContainer, 
      style, 
      { backgroundColor: bgColors[variant] || COLORS_THEME.card },
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
    ]}>
      {children}
    </Animated.View>
  );
};

export default function StatsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const COLORS_THEME = useThemeColors();
  
  const { profile, streak, stepStreak, consumedToday, stepHistory, calorieHistory, updateWeight, updateStepHistory } = useUserStore();
  const [weightInput, setWeightInput] = useState(profile?.weight?.toString() || '75');

  // Time calculations
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const todayStr = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const scrollRef = useRef(null);

  // Generate last 14 days
  const last14Days = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - tzOffset - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [tzOffset]);

  // Load steps on focus
  useFocusEffect(
    React.useCallback(() => {
      const loadSteps = async () => {
        const history = await fetchStepHistory(14);
        if (history && history.length > 0) {
          updateStepHistory(history);
        }
      };
      loadSteps();
    }, [])
  );

  // Auto-scroll to the end of the calendar (today) when mounted
  useEffect(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, []);

  const handleSaveWeight = () => {
    const newWeight = parseFloat(weightInput.replace(',', '.')) || parseFloat(profile?.weight);
    if (newWeight) {
      updateWeight(newWeight);
      Toast.show({
        type: 'success',
        text1: t('common.success') || 'Başarılı',
        text2: t('toasts.weightUpdated') || 'Kilo güncellendi.',
        position: 'top',
        topOffset: 60,
      });
    }
  };

  const isToday = selectedDate === todayStr;

  // --- Get Data for Selected Date ---
  const selectedStepData = useMemo(() => {
    if (isToday && stepHistory && stepHistory.length > 0) {
       // Get newest
       return stepHistory.find(s => s.date === todayStr)?.steps || 0;
    }
    const record = stepHistory?.find(s => s.date === selectedDate);
    return record ? record.steps : 0;
  }, [selectedDate, stepHistory, isToday, todayStr]);

  const selectedCalorieData = useMemo(() => {
    if (isToday) {
      return {
        calories: consumedToday?.calories || 0,
        protein: consumedToday?.protein || 0,
        carbs: consumedToday?.carbs || 0,
        fat: consumedToday?.fat || 0,
        burnedCalories: consumedToday?.burnedCalories || 0,
      };
    }
    const record = calorieHistory?.find(c => c.date === selectedDate);
    return record || { calories: 0, protein: 0, carbs: 0, fat: 0, burnedCalories: 0 };
  }, [selectedDate, calorieHistory, isToday, consumedToday]);

  const dailyStepTarget = profile?.stepTarget || 10000;
  const caloriesTarget = profile?.tdee || 2000;

  const stepProgress = Math.min(100, (selectedStepData / dailyStepTarget) * 100);
  const calProgress = Math.min(100, (selectedCalorieData.calories / caloriesTarget) * 100);

  return (
    <View style={[styles.container, { backgroundColor: COLORS_THEME.background }]}>
      <View style={[styles.gradient, { backgroundColor: COLORS_THEME.background }]}>
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: COLORS_THEME.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS_THEME.text} />
          </TouchableOpacity>
          <View style={{flex: 1}}>
            <Text style={[styles.headerTitle, { color: COLORS_THEME.text }]}>{t('common.back') === 'Geri' ? 'Günlük Kayıtlar' : 'Daily Logs'}</Text>
          </View>
        </View>

        {/* CALENDAR STRIP */}
        <View style={styles.calendarWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.calendarScroll}
            ref={scrollRef}
          >
            {last14Days.map((dateStr) => {
              const selected = dateStr === selectedDate;
              return (
                <TouchableOpacity 
                  key={dateStr} 
                  activeOpacity={0.7}
                  onPress={() => setSelectedDate(dateStr)}
                  style={[
                    styles.dateNode, 
                    selected && { backgroundColor: COLORS_THEME.primary + '33', borderColor: COLORS_THEME.primary }
                  ]}
                >
                  <Text style={[styles.dayNameText, { color: selected ? COLORS_THEME.primary : COLORS_THEME.textSecondary }]}>
                    {getDayName(dateStr, i18n.language)}
                  </Text>
                  <Text style={[styles.dayNumberText, { color: selected ? COLORS_THEME.text : COLORS_THEME.textSecondary }]}>
                    {getDayNumber(dateStr)}
                  </Text>
                  {dateStr === todayStr && (
                    <View style={[styles.todayIndicator, { backgroundColor: COLORS_THEME.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {isToday && (
            <>
              {/* STREAK SHOWCASE (Top 2 Cards) */}
              <View style={styles.streakGrid}>
                <SolidCard style={styles.streakCard} variant="danger" delay={100}>
                  <View style={styles.streakIconBoxWhite}>
                    <FontAwesome5 name="fire-alt" size={28} color="#FF6B6B" />
                  </View>
                  <Text style={[styles.streakNumber, { color: '#FFF' }]}>{streak}</Text>
                  <Text style={[styles.streakLabel, { color: '#FFF' }]}>{t('common.back') === 'Geri' ? 'Giriş Serisi' : 'Login Streak'}</Text>
                </SolidCard>

                <SolidCard style={styles.streakCard} variant="success" delay={200}>
                  <View style={styles.streakIconBoxWhite}>
                    <MaterialCommunityIcons name="shoe-print" size={28} color="#40C057" />
                  </View>
                  <Text style={[styles.streakNumber, { color: '#FFF' }]}>{stepStreak}</Text>
                  <Text style={[styles.streakLabel, { color: '#FFF' }]}>{t('common.back') === 'Geri' ? 'Adım Serisi' : 'Step Streak'}</Text>
                </SolidCard>
              </View>

              {/* WEIGHT PANEL */}
              <Text style={[styles.sectionTitle, { color: COLORS_THEME.text, marginTop: SPACING.sm }]}>{t('common.back') === 'Geri' ? 'Fiziksel Durum' : 'Physical Form'}</Text>

              <SolidCard style={styles.weightCard} variant="default" delay={300}>
                <View style={styles.heroHeader}>
                  <View style={[styles.heroIconBox, { backgroundColor: '#845EF7' }]}>
                    <MaterialCommunityIcons name="scale-bathroom" size={24} color="#FFF" />
                  </View>
                  <View style={{ marginLeft: SPACING.sm }}>
                    <Text style={[styles.heroTitle, { color: COLORS_THEME.text }]}>{t('common.back') === 'Geri' ? 'Kilo Güncelle' : "Update Weight"}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'center', marginTop: SPACING.md }}>
                  <HorizontalSlider
                    value={parseFloat(weightInput.replace(',', '.')) || parseFloat(profile?.weight) || 75}
                    min={30} max={200} step={0.1}
                    onChange={(val) => setWeightInput(val.toString())}
                    color="#845EF7"
                    unit="kg"
                  />
                  
                  <TouchableOpacity style={[styles.heroSaveBtn, { backgroundColor: '#845EF7' }]} onPress={handleSaveWeight} activeOpacity={0.8}>
                    <Text style={styles.heroSaveBtnText}>{t('common.save')}</Text>
                  </TouchableOpacity>
                </View>
              </SolidCard>
            </>
          )}

          {/* TIMELINE LIST FOR SELECTED DATE */}
          <Text style={[styles.sectionTitle, { color: COLORS_THEME.text, marginTop: SPACING.md }]}>
            {isToday ? (t('common.back') === 'Geri' ? "Bugünün Özeti" : "Today's Summary") : getDayNumber(selectedDate) + " " + getDayName(selectedDate, i18n.language) + " Özeti"}
          </Text>

          <SolidCard style={styles.timelineCard} variant="default" delay={400}>
            
            {/* Steps Timeline Item */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIconContainer, { backgroundColor: '#4DABF7' }]}>
                <MaterialCommunityIcons name="run" size={22} color="#FFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: COLORS_THEME.text }]}>{t('common.back') === 'Geri' ? 'Adım Geçmişi' : 'Step History'}</Text>
                <Text style={[styles.timelineData, { color: COLORS_THEME.textSecondary }]}>
                  {selectedStepData} <Text style={{fontSize: 12}}> / {dailyStepTarget}</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${stepProgress}%`, backgroundColor: '#4DABF7' }]} />
                </View>
              </View>
            </View>

            {/* Nutrition Timeline Item */}
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIconContainer, { backgroundColor: '#FCC419' }]}>
                <MaterialCommunityIcons name="food-apple" size={22} color="#FFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: COLORS_THEME.text }]}>{t('common.back') === 'Geri' ? 'Beslenme Özeti' : 'Nutrition'}</Text>
                <Text style={[styles.timelineData, { color: COLORS_THEME.textSecondary }]}>
                  {Math.round(selectedCalorieData.calories)} <Text style={{fontSize: 12}}> / {Math.round(caloriesTarget)} kcal</Text>
                </Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${calProgress}%`, backgroundColor: '#FCC419' }]} />
                </View>

                {/* Macros */}
                <View style={styles.macroRow}>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroLabel, { color: '#FF6B6B' }]}>Protein</Text>
                    <Text style={[styles.macroVal, { color: COLORS_THEME.text }]}>{Math.round(selectedCalorieData.protein)}g</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroLabel, { color: '#339AF0' }]}>Karb</Text>
                    <Text style={[styles.macroVal, { color: COLORS_THEME.text }]}>{Math.round(selectedCalorieData.carbs)}g</Text>
                  </View>
                  <View style={styles.macroBox}>
                    <Text style={[styles.macroLabel, { color: '#FCC419' }]}>Yağ</Text>
                    <Text style={[styles.macroVal, { color: COLORS_THEME.text }]}>{Math.round(selectedCalorieData.fat)}g</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Workout / Burned Calories Timeline Item */}
            <View style={[styles.timelineItem, { borderLeftColor: 'transparent', paddingBottom: 0 }]}>
              <View style={[styles.timelineIconContainer, { backgroundColor: '#FF6B6B' }]}>
                <MaterialCommunityIcons name="fire" size={22} color="#FFF" />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, { color: COLORS_THEME.text }]}>{t('common.back') === 'Geri' ? 'Aktif Yakım' : 'Active Burn'}</Text>
                <Text style={[styles.timelineData, { color: '#FF6B6B', fontSize: 20 }]}>
                  {Math.round(selectedCalorieData.burnedCalories)} <Text style={{fontSize: 14, color: COLORS_THEME.textSecondary}}>kcal</Text>
                </Text>
              </View>
            </View>

          </SolidCard>

          <View style={{height: 100}} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.md },
  headerTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xl },
  
  // Calendar Strip
  calendarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingBottom: SPACING.sm,
  },
  calendarScroll: {
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  dateNode: {
    width: 50,
    height: 65,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayNameText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  dayNumberText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 18,
    marginTop: 2,
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 6,
  },

  scrollContent: { padding: SPACING.lg },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    marginBottom: SPACING.md,
  },

  // Solid System
  solidContainer: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },

  // Streak Grid
  streakGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  streakCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
  },
  streakIconBoxWhite: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  streakNumber: {
    fontFamily: TYPOGRAPHY.fontFamily.black,
    fontSize: 32,
  },
  streakLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },

  // Weight Card
  weightCard: {
    marginBottom: SPACING.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
  },
  heroSaveBtn: {
    width: '100%', 
    alignItems: 'center', 
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  heroSaveBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#FFF',
    fontSize: FONT_SIZE.md,
  },

  // Timeline List
  timelineCard: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingBottom: SPACING.xl,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.1)',
    marginLeft: 20,
    paddingLeft: 20,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: -21, // Center over border
    top: 0,
  },
  timelineContent: {
    flex: 1,
    marginTop: -4,
  },
  timelineTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
  },
  timelineData: {
    fontFamily: TYPOGRAPHY.fontFamily.black,
    fontSize: 24,
    marginTop: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  macroBox: {
    alignItems: 'center',
    flex: 1,
  },
  macroLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
  },
  macroVal: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    marginTop: 2,
  },
});
