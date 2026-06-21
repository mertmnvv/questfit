import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { COLORS, TYPOGRAPHY, FONT_SIZE, BORDER_RADIUS } from './src/theme';
import { useFonts } from 'expo-font';
import './src/locales/i18n'; // i18n başlatıcı
import i18n from './src/locales/i18n';
import { initNotifications } from './src/services/notificationService';
import { initHealthIntegration } from './src/services/healthService';
import { useUserStore } from './src/store/userStore';

import { MaterialCommunityIcons } from '@expo/vector-icons';

// Custom Toast Konfigürasyonu (Solid Flat UI)
const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#40C057', 
      paddingHorizontal: 20, paddingVertical: 16, borderRadius: BORDER_RADIUS.xl,
      width: '90%', elevation: 10, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8
    }}>
      <MaterialCommunityIcons name="check-circle" size={28} color="#FFF" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: '#FFF' }}>{text1}</Text>
        {text2 ? <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)' }}>{text2}</Text> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF6B6B', 
      paddingHorizontal: 20, paddingVertical: 16, borderRadius: BORDER_RADIUS.xl,
      width: '90%', elevation: 10, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8
    }}>
      <MaterialCommunityIcons name="alert-circle" size={28} color="#FFF" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: '#FFF' }}>{text1}</Text>
        {text2 ? <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.9)' }} numberOfLines={2}>{text2}</Text> : null}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={{
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#4DABF7', 
      paddingHorizontal: 20, paddingVertical: 16, borderRadius: BORDER_RADIUS.xl,
      width: '90%', elevation: 10, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8
    }}>
      <MaterialCommunityIcons name="information" size={28} color="#FFF" />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: '#FFF' }}>{text1}</Text>
        {text2 ? <Text style={{ fontFamily: TYPOGRAPHY.fontFamily.medium, fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.9)' }}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Dungeon: require('./assets/fonts/dungeon.ttf'),
  });

  const appLanguage = useUserStore(state => state.appLanguage);
  const _hasHydrated = useUserStore(state => state._hasHydrated);

  useEffect(() => {
    if (appLanguage && i18n.language !== appLanguage) {
      i18n.changeLanguage(appLanguage);
    }
  }, [appLanguage]);

  useEffect(() => {
    initNotifications();
    initHealthIntegration();
  }, []);

  if (!fontsLoaded || !_hasHydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D1117', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F5A623" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}
