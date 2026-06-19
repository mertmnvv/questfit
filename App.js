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

// Custom Toast Konfigürasyonu
const toastConfig = {
  // Başarılı / Görev Tamamlandı mesajı
  success: (props) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: COLORS.success,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.success,
        borderRadius: BORDER_RADIUS.md,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
      }}
      text2Style={{
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        fontSize: FONT_SIZE.xs,
        color: COLORS.accent,
      }}
    />
  ),
  // Hata mesajı
  error: (props) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: COLORS.error,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.error,
        borderRadius: BORDER_RADIUS.md,
      }}
      text1Style={{
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        fontSize: FONT_SIZE.md,
        color: COLORS.text,
      }}
      text2Style={{
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
      }}
    />
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
