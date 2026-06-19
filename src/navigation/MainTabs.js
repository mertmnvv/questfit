import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../hooks/useThemeColors';

import DashboardScreen from '../screens/DashboardScreen';
import QuestScreen from '../screens/QuestScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';

import { SHADOWS, BORDER_RADIUS } from '../theme';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // Daha temiz bir görünüm için yazıları kaldırdık
        tabBarActiveTintColor: COLORS.background, // Seçili ikonu belirgin yap
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'QuestsTab') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'WorkoutsTab') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return (
            <View style={[
              styles.iconWrapper, 
              focused && { backgroundColor: COLORS.primary }
            ]}>
              <Ionicons 
                name={iconName} 
                size={24} 
                color={focused ? COLORS.background : COLORS.textMuted} 
              />
            </View>
          );
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
      />
      <Tab.Screen
        name="QuestsTab"
        component={QuestScreen}
      />
      <Tab.Screen 
        name="WorkoutsTab" 
        component={WorkoutsScreen} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
      />
    </Tab.Navigator>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabBarItem: {
    padding: 0,
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 0, // Ortalamayı düzeltmek için
  }
});
