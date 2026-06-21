import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../theme';
import LevelUpModal from '../components/LevelUpModal';

const { width } = Dimensions.get('window');

export default function QuestScreen() {
  const { t } = useTranslation();
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);

  // Store access
  const {
    level,
    xp,
    stats,
    profile,
    consumedToday,
    dailyLog,
    claimedGoals,
    claimGoal,
    equippedItems,
    dailyQuests,
    fastingState,
    streak,
    stepHistory,
  } = useUserStore();

  // Modal Level-Up State
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [newLevel, setNewLevel] = useState(level);

  // Calculate maximum XP for current level
  const maxXp = useMemo(() => {
    return 200 * Math.pow(2, level - 1);
  }, [level]);

  const xpProgress = useMemo(() => {
    return Math.min(100, Math.max(0, (xp / maxXp) * 100));
  }, [xp, maxXp]);

  // Targets and calculations
  const waterTargetL = parseFloat(profile?.waterTarget || 2.0);
  const waterTargetGlasses = Math.ceil(waterTargetL * 4);
  const waterCurrentGlasses = consumedToday?.water || 0;
  const waterCurrentL = waterCurrentGlasses * 0.25;

  const calorieCurrent = Math.round(consumedToday?.calories || 0);
  const calorieTarget = Math.round(stats?.targetCalories || 2000);
  const burnedCalories = Math.round(consumedToday?.burnedCalories || 0);

  const proteinCurrent = Math.round(consumedToday?.protein || 0);
  const proteinTarget = Math.round(stats?.proteinTarget || 120);

  const carbsCurrent = Math.round(consumedToday?.carbs || 0);
  const carbsTarget = Math.round(stats?.macros?.carbs || 200);

  const fatCurrent = Math.round(consumedToday?.fat || 0);
  const fatTarget = Math.round(stats?.macros?.fat || 70);

  const workoutsCompleted = dailyLog?.workouts?.length || 0;
  const aiWorkoutsCompleted = dailyLog?.workouts?.filter(w => w.isAi)?.length || 0;

  const todaySteps = useMemo(() => {
    if (!stepHistory || stepHistory.length === 0) return 0;
    const lastEntry = stepHistory[stepHistory.length - 1];
    if (new Date(lastEntry.date).toDateString() === new Date().toDateString()) {
      return lastEntry.steps || 0;
    }
    return 0;
  }, [stepHistory]);

  const hasLoggedBreakfast = dailyLog?.foods?.some(f => f.mealType === 'breakfast' || f.mealType === 'firstMeal');
  const hasLoggedLunch = dailyLog?.foods?.some(f => f.mealType === 'lunch');
  const hasLoggedDinner = dailyLog?.foods?.some(f => f.mealType === 'dinner' || f.mealType === 'lastMeal' || f.mealType === 'singleMeal');
  const hasLoggedSnack = dailyLog?.foods?.some(f => f.mealType === 'snack' || f.mealType === 'liquidSnack');

  // Goals definition
  const goals = useMemo(() => {
    return (dailyQuests || []).map(qId => {
      let icon = 'star';
      let xpReward = 50;
      let current = 0;
      let target = 1;
      let unit = '';
      let isCompleted = false;

      switch(qId) {
        // WATER
        case 'water_1_5l': icon = 'water'; xpReward = 30; current = waterCurrentL; target = 1.5; unit = 'L'; isCompleted = waterCurrentL >= 1.5; break;
        case 'water_2l': icon = 'water'; xpReward = 40; current = waterCurrentL; target = 2.0; unit = 'L'; isCompleted = waterCurrentL >= 2.0; break;
        case 'water_2_5l': icon = 'water'; xpReward = 50; current = waterCurrentL; target = 2.5; unit = 'L'; isCompleted = waterCurrentL >= 2.5; break;
        case 'water_3l': icon = 'water'; xpReward = 60; current = waterCurrentL; target = 3.0; unit = 'L'; isCompleted = waterCurrentL >= 3.0; break;

        // PROTEIN
        case 'protein_80g': icon = 'arm-flex'; xpReward = 40; current = proteinCurrent; target = 80; unit = 'g'; isCompleted = proteinCurrent >= 80; break;
        case 'protein_100g': icon = 'arm-flex'; xpReward = 50; current = proteinCurrent; target = 100; unit = 'g'; isCompleted = proteinCurrent >= 100; break;
        case 'protein_120g': icon = 'arm-flex'; xpReward = 60; current = proteinCurrent; target = 120; unit = 'g'; isCompleted = proteinCurrent >= 120; break;
        case 'protein_150g': icon = 'arm-flex'; xpReward = 80; current = proteinCurrent; target = 150; unit = 'g'; isCompleted = proteinCurrent >= 150; break;
        case 'protein_target': icon = 'arm-flex'; xpReward = 60; current = proteinCurrent; target = proteinTarget; unit = 'g'; isCompleted = proteinCurrent >= proteinTarget * 0.9; break;

        // CALORIES
        case 'cals_under_target': icon = 'food-apple'; xpReward = 50; current = calorieCurrent; target = calorieTarget; unit = 'kcal'; isCompleted = calorieCurrent > 0 && calorieCurrent <= calorieTarget * 1.1; break;
        case 'cals_burn_200': icon = 'fire'; xpReward = 40; current = burnedCalories; target = 200; unit = 'kcal'; isCompleted = burnedCalories >= 200; break;
        case 'cals_burn_400': icon = 'fire'; xpReward = 60; current = burnedCalories; target = 400; unit = 'kcal'; isCompleted = burnedCalories >= 400; break;
        case 'cals_burn_600': icon = 'fire'; xpReward = 80; current = burnedCalories; target = 600; unit = 'kcal'; isCompleted = burnedCalories >= 600; break;

        // MACROS
        case 'carbs_target': icon = 'bread-slice'; xpReward = 40; current = carbsCurrent; target = carbsTarget; unit = 'g'; isCompleted = carbsCurrent > 0 && carbsCurrent <= carbsTarget * 1.1; break;
        case 'fat_target': icon = 'oil'; xpReward = 40; current = fatCurrent; target = fatTarget; unit = 'g'; isCompleted = fatCurrent > 0 && fatCurrent <= fatTarget * 1.1; break;

        // WORKOUTS
        case 'workout_1': icon = 'dumbbell'; xpReward = 50; current = workoutsCompleted; target = 1; isCompleted = workoutsCompleted >= 1; break;
        case 'workout_2': icon = 'weight-lifter'; xpReward = 100; current = workoutsCompleted; target = 2; isCompleted = workoutsCompleted >= 2; break;
        case 'workout_ai': icon = 'robot'; xpReward = 80; current = aiWorkoutsCompleted; target = 1; isCompleted = aiWorkoutsCompleted >= 1; break;

        // STEPS
        case 'steps_3k': icon = 'shoe-print'; xpReward = 20; current = todaySteps; target = 3000; isCompleted = todaySteps >= 3000; break;
        case 'steps_5k': icon = 'shoe-print'; xpReward = 30; current = todaySteps; target = 5000; isCompleted = todaySteps >= 5000; break;
        case 'steps_8k': icon = 'shoe-print'; xpReward = 50; current = todaySteps; target = 8000; isCompleted = todaySteps >= 8000; break;
        case 'steps_10k': icon = 'shoe-print'; xpReward = 70; current = todaySteps; target = 10000; isCompleted = todaySteps >= 10000; break;
        case 'steps_12k': icon = 'shoe-print'; xpReward = 90; current = todaySteps; target = 12000; isCompleted = todaySteps >= 12000; break;
        case 'steps_15k': icon = 'shoe-print'; xpReward = 120; current = todaySteps; target = 15000; isCompleted = todaySteps >= 15000; break;

        // LOGGING
        case 'log_breakfast': icon = 'coffee'; xpReward = 20; current = hasLoggedBreakfast ? 1 : 0; target = 1; isCompleted = hasLoggedBreakfast; break;
        case 'log_lunch': icon = 'food-variant'; xpReward = 20; current = hasLoggedLunch ? 1 : 0; target = 1; isCompleted = hasLoggedLunch; break;
        case 'log_dinner': icon = 'silverware-fork-knife'; xpReward = 20; current = hasLoggedDinner ? 1 : 0; target = 1; isCompleted = hasLoggedDinner; break;
        case 'log_snack': icon = 'cookie'; xpReward = 10; current = hasLoggedSnack ? 1 : 0; target = 1; isCompleted = hasLoggedSnack; break;

        // MISC
        case 'fast_start': icon = 'shield-sun'; xpReward = 30; current = fastingState?.isActive ? 1 : 0; target = 1; isCompleted = fastingState?.isActive; break;
        case 'streak_3': icon = 'fire'; xpReward = 50; current = streak; target = 3; isCompleted = streak >= 3; break;
      }

      return {
        id: qId,
        title: t(`quests.dynamic.${qId}.title`),
        icon,
        xpReward,
        current,
        target,
        unit,
        isCompleted,
        description: t(`quests.dynamic.${qId}.desc`),
        progress: Math.min(100, target > 0 ? (current / target) * 100 : 0),
      };
    });
  }, [dailyQuests, calorieCurrent, calorieTarget, burnedCalories, waterCurrentL, waterCurrentGlasses, waterTargetGlasses, proteinCurrent, proteinTarget, carbsCurrent, carbsTarget, fatCurrent, fatTarget, workoutsCompleted, aiWorkoutsCompleted, todaySteps, hasLoggedBreakfast, hasLoggedLunch, hasLoggedDinner, hasLoggedSnack, fastingState, streak, t]);

  // Handle manual claim action
  const handleClaimReward = (goalId, xpReward, title) => {
    const isLeveledUp = claimGoal(goalId, xpReward);
    
    Toast.show({
      type: 'success',
      text1: `+${xpReward} XP! 🎯`,
      text2: t('quests.goalCompleted', { title }),
      position: 'top',
      topOffset: 60,
    });

    if (isLeveledUp) {
      setNewLevel(level + 1);
      setLevelUpVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS_THEME.background, COLORS_THEME.card, COLORS_THEME.background]} style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('quests.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('quests.subtitle')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Level Tracker Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelCardInner}>
              <View style={styles.levelHeader}>
                <View style={styles.levelCircle}>
                  <Text style={styles.levelNum}>{level}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={styles.levelTitle}>{t('quests.levelLabel', { level })}</Text>
                  <Text style={styles.xpText}>{xp} / {maxXp} XP</Text>
                </View>
                <Text style={styles.xpToGo}>
                  {t('quests.xpToGo', { xp: Math.max(0, maxXp - xp) })}
                </Text>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.xpBarBackground}>
                <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
              </View>
            </View>
          </View>

          {/* Goals Checklist Title */}
          <Text style={styles.sectionTitle}>
            {t('quests.dailyTargetsTitle')}
          </Text>

          {/* Goals Stack */}
          {goals.map((goal) => {
            const isClaimed = claimedGoals?.includes(goal.id);
            const canClaim = goal.isCompleted && !isClaimed;

            return (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  isClaimed && styles.goalCardClaimed,
                  canClaim && styles.goalCardCanClaim,
                ]}
              >
                <View style={styles.goalCardHeader}>
                  <View style={[styles.iconContainer, isClaimed && styles.iconContainerClaimed, canClaim && styles.iconContainerCanClaim]}>
                    <MaterialCommunityIcons
                      name={goal.icon}
                      size={24}
                      color={isClaimed ? COLORS_THEME.textSecondary : canClaim ? COLORS_THEME.success : COLORS_THEME.primary}
                    />
                  </View>
                  
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={[styles.goalTitleText, isClaimed && styles.goalTitleTextClaimed]}>
                      {goal.title}
                    </Text>
                    <Text style={styles.goalDescription} numberOfLines={2}>
                      {goal.description}
                    </Text>
                  </View>
                  
                  <View style={styles.rewardBadge}>
                    <Text style={[styles.rewardText, isClaimed && styles.rewardTextClaimed]}>
                      +{goal.xpReward} XP
                    </Text>
                  </View>
                </View>

                {/* Progress bar inside card (only if not claimed/fully done) */}
                <View style={styles.goalProgressSection}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${goal.progress}%`,
                          backgroundColor: isClaimed ? COLORS_THEME.textMuted : canClaim ? COLORS_THEME.success : COLORS_THEME.primary,
                        },
                      ]}
                    />
                  </View>
                  
                  <View style={styles.progressLabelRow}>
                    <Text style={styles.progressPercent}>{Math.round(goal.progress)}%</Text>
                    <Text style={styles.progressRatio}>
                      {typeof goal.current === 'number' && !Number.isInteger(goal.current) ? goal.current.toFixed(1) : goal.current} / {typeof goal.target === 'number' && !Number.isInteger(goal.target) ? goal.target.toFixed(1) : goal.target} {goal.unit}
                    </Text>
                  </View>
                </View>

                {/* Claim Button Area */}
                <View style={styles.actionArea}>
                  {isClaimed ? (
                    <View style={styles.claimedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={COLORS_THEME.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.claimedBadgeText}>{t('quests.claimed')}</Text>
                    </View>
                  ) : canClaim ? (
                    <TouchableOpacity
                      style={styles.claimButton}
                      onPress={() => handleClaimReward(goal.id, goal.xpReward, goal.title)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.claimButtonText}>{t('quests.claimReward', { xp: goal.xpReward })}</Text>
                      <MaterialCommunityIcons name="gift-outline" size={16} color="#0D1117" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inProgressBadge}>
                      <MaterialCommunityIcons name="progress-clock" size={16} color={COLORS_THEME.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.inProgressText}>
                        {t('quests.inProgress')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Spacer */}
          <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />

        </ScrollView>
      </LinearGradient>

      {/* Level Up Overlay Animation Modal */}
      <LevelUpModal
        visible={levelUpVisible}
        newLevel={newLevel}
        onClose={() => setLevelUpVisible(false)}
      />

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
    marginTop: SPACING.xs,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  levelCard: {
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  levelCardInner: {
    padding: SPACING.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS_THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  levelNum: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: '#0D1117',
  },
  levelTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS_THEME.text,
  },
  xpText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS_THEME.textSecondary,
    marginTop: 2,
  },
  xpToGo: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    color: COLORS_THEME.primary,
  },
  xpBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.full,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS_THEME.primary,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.glow,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS_THEME.text,
    marginBottom: SPACING.md,
  },
  
  // Goal Cards Styles
  goalCard: {
    backgroundColor: COLORS_THEME.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  goalCardClaimed: {
    opacity: 0.6,
  },
  goalCardCanClaim: {
    borderColor: COLORS_THEME.success,
    borderWidth: 1.5,
    shadowColor: COLORS_THEME.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS_THEME.cardLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
  },
  iconContainerClaimed: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  iconContainerCanClaim: {
    borderColor: COLORS_THEME.success,
    backgroundColor: 'rgba(64,192,87,0.05)',
  },
  goalTitleText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS_THEME.text,
  },
  goalTitleTextClaimed: {
    color: COLORS_THEME.textSecondary,
    textDecorationLine: 'line-through',
  },
  goalDescription: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS_THEME.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  rewardBadge: {
    backgroundColor: 'rgba(43,138,62,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  rewardText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    color: COLORS_THEME.primary,
  },
  rewardTextClaimed: {
    color: COLORS_THEME.textSecondary,
  },
  
  // Progress inside card
  goalProgressSection: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: SPACING.sm,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BORDER_RADIUS.full,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  progressPercent: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    color: COLORS_THEME.textSecondary,
  },
  progressRatio: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS_THEME.textSecondary,
  },
  
  // Action/Button inside card
  actionArea: {
    marginTop: SPACING.md,
    alignItems: 'flex-end',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  claimedBadgeText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
  },
  inProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  inProgressText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS_THEME.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.glow,
  },
  claimButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#0D1117',
    fontSize: FONT_SIZE.xs,
    marginRight: 6,
  },
});
