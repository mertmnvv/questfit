import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Keyboard, Animated, Dimensions, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { registerUser, loginUser, signInWithGoogle } from '../services/authService';
import { uploadImageToCloudinary } from '../services/cloudinaryService';

const { width, height } = Dimensions.get('window');

// GREEN THEME COLORS
const GREEN_PRIMARY = '#40C057';
const GREEN_DARK = '#2F9E44';

export default function LoginScreen() {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const [mode, setMode] = useState('login');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (newMode) => {
    if (mode === newMode) return;
    Keyboard.dismiss();
    
    // Slide out
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: newMode === 'login' ? -20 : 20, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setMode(newMode);
      setLoginError('');
      setRegError('');
      
      // Prepare for slide in
      slideAnim.setValue(newMode === 'login' ? 20 : -20);
      
      // Slide in
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    });
  };

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regAvatar, setRegAvatar] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  const handlePickRegAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setRegAvatar(result.assets[0].uri);
    }
  };

  const handleLoginSubmit = async () => {
    Keyboard.dismiss();
    setLoginError('');
    const emailTrim = loginEmail.trim();
    if (!emailTrim || !loginPassword) { setLoginError(t('login.errors.emptyFields')); return; }

    setLoginLoading(true);
    try { await loginUser(emailTrim, loginPassword); } 
    catch (err) {
      const errCode = err.code || '';
      if (errCode.includes('wrong-password') || errCode.includes('invalid-credential')) { setLoginError(t('login.errors.wrongPassword')); } 
      else if (errCode.includes('user-not-found')) { setLoginError(t('login.errors.userNotFound')); } 
      else { setLoginError(t('login.errors.invalidCredential')); }
    } finally { setLoginLoading(false); }
  };

  const handleRegisterSubmit = async () => {
    Keyboard.dismiss();
    setRegError('');
    const emailTrim = regEmail.trim();

    if (!emailTrim || !regPassword || !regNickname.trim()) { setRegError(t('login.errors.emptyFields')); return; }
    if (regPassword.length < 6) { setRegError(t('login.errors.weakPassword')); return; }

    setRegLoading(true);
    try {
      let finalAvatarUrl = null;
      if (regAvatar) {
        finalAvatarUrl = await uploadImageToCloudinary(regAvatar);
      }
      await registerUser(emailTrim, regPassword, regNickname.trim(), finalAvatarUrl);
      Toast.show({ type: 'success', text1: t('common.success'), text2: t('common.loading') });
    } catch (err) {
      const errCode = err.code || '';
      if (errCode.includes('email-already-in-use')) { setRegError(t('login.errors.emailInUse')); } 
      else { setRegError(t('login.errors.default')); }
      setRegLoading(false);
    }
  };

  const handleGoogleSSO = async () => {
    setLoginLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Hata', text2: 'Google ile giriş başarısız.' });
      setLoginLoading(false);
    }
  };

  const isDark = COLORS.background === '#0D1117';
  const gradientColors = isDark 
    ? ['#0D1117', '#0A1A10', '#0D1117'] 
    : ['#FFFFFF', '#E8F5E9', '#FFFFFF'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.heroSection}>
            <Image source={require('../../assets/icon.png')} style={styles.heroLogo} resizeMode="contain" />
            <Text style={styles.heroTitle}>QUEST FIT</Text>
          </View>

          <View style={styles.contentWrapper}>
            
            <View style={styles.modernTabContainer}>
              <TouchableOpacity style={styles.modernTab} onPress={() => switchMode('login')} activeOpacity={0.8}>
                <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>{t('login.login')}</Text>
                {mode === 'login' && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modernTab} onPress={() => switchMode('register')} activeOpacity={0.8}>
                <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>{t('login.register')}</Text>
                {mode === 'register' && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            </View>

            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, width: '100%' }}>
              {mode === 'login' ? (
                <View style={styles.formContainer}>
                  {loginError !== '' && <Text style={styles.errorText}>{loginError}</Text>}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.email')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput style={styles.input} placeholder={t('login.emailPlaceholder')} placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" value={loginEmail} onChangeText={setLoginEmail} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.password')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={COLORS.textMuted} secureTextEntry={!showLoginPassword} autoCapitalize="none" value={loginPassword} onChangeText={setLoginPassword} />
                      <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)} style={styles.eyeBtn}>
                        <MaterialCommunityIcons name={showLoginPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleLoginSubmit} disabled={loginLoading} activeOpacity={0.8}>
                    {loginLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('login.submitLogin')}</Text>}
                  </TouchableOpacity>

                </View>
              ) : (
                <View style={styles.formContainer}>
                  {regError !== '' && <Text style={styles.errorText}>{regError}</Text>}

                  <View style={styles.avatarPickerContainer}>
                    <TouchableOpacity onPress={handlePickRegAvatar} style={styles.avatarPickerBtn}>
                      {regAvatar ? (
                        <Image source={{ uri: regAvatar }} style={styles.avatarImage} />
                      ) : (
                        <MaterialCommunityIcons name="camera-plus" size={32} color={GREEN_PRIMARY} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.nickname')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput style={styles.input} placeholder={t('login.nicknamePlaceholder')} placeholderTextColor={COLORS.textMuted} autoCapitalize="words" value={regNickname} onChangeText={setRegNickname} />
                    </View>
                  </View>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.email')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput style={styles.input} placeholder={t('login.emailPlaceholder')} placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" value={regEmail} onChangeText={setRegEmail} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('login.password')}</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={COLORS.textMuted} secureTextEntry={!showRegPassword} autoCapitalize="none" value={regPassword} onChangeText={setRegPassword} />
                      <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)} style={styles.eyeBtn}>
                        <MaterialCommunityIcons name={showRegPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={handleRegisterSubmit} disabled={regLoading} activeOpacity={0.8}>
                    {regLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{t('login.submitRegister')}</Text>}
                  </TouchableOpacity>

                </View>
              )}

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.orText}>veya</Text>
                <View style={styles.line} />
              </View>

              <TouchableOpacity style={styles.ssoBtn} onPress={handleGoogleSSO} activeOpacity={0.8}>
                <Image source={{uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png'}} style={styles.googleIcon} />
                <Text style={styles.ssoBtnText}>Google ile Devam Et</Text>
              </TouchableOpacity>

            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => {
  const isDark = COLORS.background === '#0D1117';
  const borderLineColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      minHeight: height,
    },
    heroSection: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: Platform.OS === 'ios' ? 100 : 80,
      paddingBottom: 40,
    },
    heroLogo: {
      width: 160, 
      height: 160,
    },
    heroTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: 32,
      color: COLORS.text,
      letterSpacing: 6,
      marginTop: SPACING.md,
    },
    contentWrapper: {
      flex: 1,
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.xxxl,
      alignItems: 'center',
    },
    modernTabContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: SPACING.xxl,
      width: '100%',
    },
    modernTab: {
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xl,
      position: 'relative',
      alignItems: 'center',
    },
    tabText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      color: COLORS.textMuted,
      fontSize: FONT_SIZE.md,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    activeTabText: {
      color: COLORS.text,
    },
    activeIndicator: {
      position: 'absolute',
      bottom: 0,
      width: 24,
      height: 3,
      backgroundColor: GREEN_PRIMARY,
      borderRadius: 1.5,
    },
    formContainer: {
      width: '100%',
    },
    inputGroup: {
      marginBottom: SPACING.xl,
    },
    label: {
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      fontSize: 12,
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row', 
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: borderLineColor,
      height: 48,
    },
    input: {
      flex: 1, 
      height: '100%',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      fontSize: FONT_SIZE.lg, 
      color: COLORS.text,
    },
    eyeBtn: {
      paddingLeft: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    errorText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: FONT_SIZE.xs, 
      color: COLORS.error,
      marginBottom: SPACING.md, 
      textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: GREEN_PRIMARY,
      height: 60, 
      borderRadius: BORDER_RADIUS.full,
      justifyContent: 'center', 
      alignItems: 'center',
      marginTop: SPACING.xl,
      shadowColor: GREEN_DARK,
      shadowOpacity: 0.4,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
      width: '100%',
    },
    primaryBtnText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: FONT_SIZE.md, 
      color: '#FFFFFF',
      textTransform: 'uppercase', 
      letterSpacing: 3,
    },
    divider: {
      flexDirection: 'row', 
      alignItems: 'center',
      marginVertical: SPACING.xxl,
      width: '100%',
    },
    line: {
      flex: 1, 
      height: 1, 
      backgroundColor: borderLineColor,
    },
    orText: {
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      fontSize: 12, 
      color: COLORS.textMuted,
      marginHorizontal: SPACING.lg,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    ssoBtn: {
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderWidth: 1, 
      borderColor: borderLineColor,
      height: 60, 
      borderRadius: BORDER_RADIUS.full,
      width: '100%',
    },
    googleIcon: {
      width: 24, 
      height: 24, 
      marginRight: 12,
    },
    ssoBtnText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: FONT_SIZE.md, 
      color: COLORS.text,
    },
    avatarPickerContainer: {
      alignItems: 'center', 
      marginBottom: SPACING.xxl,
    },
    avatarPickerBtn: {
      width: 100, 
      height: 100, 
      borderRadius: 50,
      backgroundColor: 'transparent',
      borderWidth: 1, 
      borderColor: GREEN_PRIMARY,
      borderStyle: 'dashed',
      justifyContent: 'center', 
      alignItems: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%', 
      height: '100%',
    },
  });
};
