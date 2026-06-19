import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import NewCustomWorkoutScreen from '../screens/NewCustomWorkoutScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import SplashScreen from '../screens/SplashScreen';
import StatsScreen from '../screens/StatsScreen';
import WorkoutHistoryScreen from '../screens/WorkoutHistoryScreen';
import MealsScreen from '../screens/MealsScreen';

import { useAuth } from '../context/AuthContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useUserStore } from '../store/userStore';
import { COLORS } from '../theme';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, profile, loading } = useAuth();
  const COLORS_THEME = useThemeColors();
  const appTheme = useUserStore(state => state.appTheme);

  const QuestFitTheme = {
    ...(appTheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(appTheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: COLORS_THEME.primary,
      background: COLORS_THEME.background,
      card: COLORS_THEME.card,
      text: COLORS_THEME.text,
      border: COLORS_THEME.border,
      notification: COLORS_THEME.accent,
    },
  };

  // İlk yükleme — splash/loading ekranı
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={QuestFitTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: COLORS_THEME.background },
        }}
      >
        {!user ? (
          // Giriş yapılmamış → Login
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !profile ? (
          // Giriş yapılmış ama profil yok → Onboarding
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        ) : (
          // Giriş yapılmış + profil var → MainTabs (Ana menü)
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="CustomWorkout" component={NewCustomWorkoutScreen} />

            <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
            <Stack.Screen name="Stats" component={StatsScreen} />
            <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} />
            <Stack.Screen name="Meals" component={MealsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
