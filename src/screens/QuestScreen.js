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
  const waterTargetGlasses = Math.ceil(waterTargetL * 4); // 1 glass = 250ml = 0.25L
  const waterCurrentGlasses = consumedToday?.water || 0;
  const waterCurrentL = waterCurrentGlasses * 0.25;

  const calorieTarget = Math.round(stats?.targetCalories || 2000);
  const calorieCurrent = Math.round(consumedToday?.calories || 0);

  const proteinTarget = Math.round(stats?.proteinTarget || 120);
  const proteinCurrent = Math.round(consumedToday?.protein || 0);

  const workoutsCompleted = dailyLog?.workouts?.length || 0;

  // Goals definition
  const goals = useMemo(() => {
    return [
      {
        id: 'calorie_goal',
        title: t('quests.calorieGoal'),
        icon: 'food-apple',
        xpReward: 50,
        current: calorieCurrent,
        target: calorieTarget,
        unit: 'kcal',
        isCompleted: calorieCurrent >= calorieTarget * 0.85 && calorieCurrent <= calorieTarget * 1.15,
        description: t('quests.calorieGoalDesc', { current: calorieCurrent, target: calorieTarget }),
        progress: Math.min(100, (calorieCurrent / calorieTarget) * 100),
      },
      {
        id: 'water_goal',
        title: t('quests.waterGoal'),
        icon: 'water',
        xpReward: 30,
        current: waterCurrentL,
        target: waterTargetL,
        unit: 'L',
        isCompleted: waterCurrentGlasses >= waterTargetGlasses,
        description: t('quests.waterGoalDesc', { current: waterCurrentL.toFixed(1), target: waterTargetL.toFixed(1), target_glasses: waterTargetGlasses }),
        progress: Math.min(100, (waterCurrentGlasses / waterTargetGlasses) * 100),
      },
      {
        id: 'protein_goal',
        title: t('quests.proteinGoal'),
        icon: 'arm-flex',
        xpReward: 40,
        current: proteinCurrent,
        target: proteinTarget,
        unit: 'g',
        isCompleted: proteinCurrent >= proteinTarget * 0.85,
        description: t('quests.proteinGoalDesc', { current: proteinCurrent, target: proteinTarget }),
        progress: Math.min(100, (proteinCurrent / proteinTarget) * 100),
      },
      {
        id: 'workout_goal',
        title: t('quests.workoutGoal'),
        icon: 'dumbbell',
        xpReward: 80,
        current: workoutsCompleted,
        target: 1,
        unit: '',
        isCompleted: workoutsCompleted >= 1 || (consumedToday?.burnedCalories || 0) > 0,
        description: t('quests.workoutGoalDesc'),
        progress: workoutsCompleted >= 1 || (consumedToday?.burnedCalories || 0) > 0 ? 100 : 0,
      },
    ];
  }, [calorieCurrent, calorieTarget, waterCurrentL, waterTargetL, waterCurrentGlasses, waterTargetGlasses, proteinCurrent, proteinTarget, workoutsCompleted, consumedToday, t]);

  // Handle manual claim action
  const handleClaimReward = (goalId, xpReward, title) => {
    const isLeveledUp = claimGoal(goalId, xpReward);
    
    Toast.show({
      type: 'success',
      text1: `+${xpReward} XP! 🎯`,
      text2: t('common.back') === 'Geri' ? `"${title}" hedefi tamamlandı!` : `"${title}" goal completed!`,
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
            <LinearGradient colors={['rgba(43,138,62,0.15)', 'rgba(64,192,87,0.05)']} style={styles.levelCardGradient}>
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
            </LinearGradient>
          </View>

          {/* Goals Checklist Title */}
          <Text style={styles.sectionTitle}>
            {t('common.back') === 'Geri' ? 'Günlük Hedef Listen' : 'Your Daily Targets'}
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
                      {goal.id === 'water_goal'
                        ? `${goal.current.toFixed(1)} / ${goal.target.toFixed(1)} ${goal.unit}`
                        : goal.id === 'workout_goal'
                        ? `${goal.current} / ${goal.target}`
                        : `${goal.current} / ${goal.target} ${goal.unit}`}
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
                        {t('common.back') === 'Geri' ? 'Devam Ediyor' : 'In Progress'}
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
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    marginBottom: SPACING.xl,
    ...SHADOWS.card,
  },
  levelCardGradient: {
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
