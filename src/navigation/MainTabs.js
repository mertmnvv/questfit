import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../hooks/useThemeColors';

import DashboardScreen from '../screens/DashboardScreen';
import MealsScreen from '../screens/MealsScreen';
import QuestScreen from '../screens/QuestScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';

import { TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MealsTab') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'WorkoutsTab') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'QuestsTab') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size + 2} color={color} />;
        },
        tabBarActiveBackgroundColor: 'transparent',
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
        options={{ tabBarLabel: t('common.back') === 'Geri' ? 'Ana Sayfa' : 'Home' }} 
      />
      <Tab.Screen 
        name="WorkoutsTab" 
        component={WorkoutsScreen} 
        options={{ tabBarLabel: t('workouts.title') }} 
      />
      <Tab.Screen 
        name="QuestsTab" 
        component={QuestScreen} 
        options={{ tabBarLabel: t('quests.title') }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: t('profile.title') }} 
      />
    </Tab.Navigator>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...SHADOWS.glow,
  },
  tabBarLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    marginTop: 4,
  },
});
