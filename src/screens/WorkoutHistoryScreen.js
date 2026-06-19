import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { SPACING, TYPOGRAPHY, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme';

export default function WorkoutHistoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const COLORS_THEME = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS_THEME), [COLORS_THEME]);

  const workoutHistory = useUserStore(state => state.workoutHistory) || [];
  const sortedHistory = [...workoutHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}.${year} - ${hours}:${mins}`;
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
          <View style={styles.caloriesBadge}>
            <MaterialCommunityIcons name="fire" size={16} color={COLORS_THEME.accent} />
            <Text style={styles.caloriesText}>{item.calories || 0} kcal</Text>
          </View>
        </View>
        <Text style={styles.workoutName}>{item.name}</Text>
        
        {item.exercises && item.exercises.length > 0 && (
          <View style={styles.exercisesContainer}>
            <Text style={styles.exercisesTitle}>{item.exercises.length} {t('workoutHistory.movements')}</Text>
            {item.exercises.slice(0, 3).map((ex, index) => (
              <Text key={index} style={styles.exerciseLine} numberOfLines={1}>
                • {ex.name} {ex.defaultSets && ex.defaultReps ? `(${ex.defaultSets}x${ex.defaultReps})` : ''}
              </Text>
            ))}
            {item.exercises.length > 3 && (
              <Text style={styles.exerciseLine}>+ {item.exercises.length - 3} {t('workoutHistory.more')}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS_THEME.background, COLORS_THEME.card, COLORS_THEME.background]} style={styles.gradient}>
        <SafeAreaView>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS_THEME.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('workoutHistory.title')}</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>

        {sortedHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={64} color={COLORS_THEME.border} />
            <Text style={styles.emptyText}>{t('workoutHistory.noHistory')}</Text>
          </View>
        ) : (
          <FlatList
            data={sortedHistory}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </LinearGradient>
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
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
    fontSize: FONT_SIZE.lg,
    color: COLORS_THEME.text,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  historyCard: {
    backgroundColor: COLORS_THEME.cardLight,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS_THEME.border,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  cardDate: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 146, 72, 0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  caloriesText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.accent,
    marginLeft: 4,
  },
  workoutName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS_THEME.text,
    marginBottom: SPACING.sm,
  },
  exercisesContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 2,
    borderLeftColor: COLORS_THEME.primary,
  },
  exercisesTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.primary,
    marginBottom: 4,
  },
  exerciseLine: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: COLORS_THEME.textSecondary,
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: FONT_SIZE.md,
    color: COLORS_THEME.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
