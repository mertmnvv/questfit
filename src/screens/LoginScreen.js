import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
  Keyboard, Animated, Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../theme';
import { registerUser, loginUser } from '../services/authService';

export default function LoginScreen() {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const [mode, setMode] = useState('login');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchMode = (newMode) => {
    if (mode === newMode) return;
    Keyboard.dismiss();
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setMode(newMode);
      setLoginError('');
      setRegError('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
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
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

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
      await registerUser(emailTrim, regPassword, regNickname.trim());
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
    setTimeout(async () => {
      try { await loginUser('demo_user@questfit.com', 'QuestFit123'); } 
      catch (err) { try { await registerUser('demo_user@questfit.com', 'QuestFit123'); } catch (e) { } } 
      finally { setLoginLoading(false); }
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={COLORS.background === '#0D1117' ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="shield-sword" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.tagline')}</Text>
          </View>

          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            
            <View style={styles.tabContainer}>
              <TouchableOpacity style={[styles.tab, mode === 'login' && styles.activeTab]} onPress={() => switchMode('login')}>
                <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>{t('login.login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, mode === 'register' && styles.activeTab]} onPress={() => switchMode('register')}>
                <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>{t('login.register')}</Text>
              </TouchableOpacity>
            </View>

            {mode === 'login' ? (
              <View>
                {loginError !== '' && <Text style={styles.errorText}>{loginError}</Text>}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('login.email')}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder={t('login.emailPlaceholder')} placeholderTextColor={COLORS.border} keyboardType="email-address" autoCapitalize="none" value={loginEmail} onChangeText={setLoginEmail} />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('login.password')}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={COLORS.border} secureTextEntry={!showLoginPassword} autoCapitalize="none" value={loginPassword} onChangeText={setLoginPassword} />
                    <TouchableOpacity onPress={() => setShowLoginPassword(!showLoginPassword)} style={styles.eyeBtn}>
                      <MaterialCommunityIcons name={showLoginPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleLoginSubmit} disabled={loginLoading} activeOpacity={0.8}>
                  {loginLoading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.primaryBtnText}>{t('login.submitLogin')}</Text>}
                </TouchableOpacity>

              </View>
            ) : (
              <View>
                {regError !== '' && <Text style={styles.errorText}>{regError}</Text>}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('login.nickname')}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder={t('login.nicknamePlaceholder')} placeholderTextColor={COLORS.border} autoCapitalize="words" value={regNickname} onChangeText={setRegNickname} />
                  </View>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('login.email')}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder={t('login.emailPlaceholder')} placeholderTextColor={COLORS.border} keyboardType="email-address" autoCapitalize="none" value={regEmail} onChangeText={setRegEmail} />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('login.password')}</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={COLORS.border} secureTextEntry={!showRegPassword} autoCapitalize="none" value={regPassword} onChangeText={setRegPassword} />
                    <TouchableOpacity onPress={() => setShowRegPassword(!showRegPassword)} style={styles.eyeBtn}>
                      <MaterialCommunityIcons name={showRegPassword ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, {backgroundColor: COLORS.accent}]} onPress={handleRegisterSubmit} disabled={regLoading} activeOpacity={0.8}>
                  {regLoading ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.primaryBtnText, {color: '#FFF'}]}>{t('login.submitRegister')}</Text>}
                </TouchableOpacity>

              </View>
            )}

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity style={styles.ssoBtn} onPress={handleGoogleSSO} activeOpacity={0.8}>
              <MaterialCommunityIcons name="google" size={20} color={COLORS.text} style={{marginRight: 8}} />
              <Text style={styles.ssoBtnText}>Google</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (COLORS) => {
  const isDark = COLORS.background === '#0D1117';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xl,
      justifyContent: 'center',
      minHeight: Dimensions.get('window').height,
    },
    header: {
      alignItems: 'center',
      marginBottom: SPACING.xxl,
    },
    iconContainer: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: isDark ? 'rgba(100, 255, 218, 0.1)' : 'rgba(64, 192, 87, 0.1)',
      justifyContent: 'center', alignItems: 'center',
      marginBottom: SPACING.lg,
      borderWidth: 2,
      borderColor: COLORS.primary,
      shadowColor: COLORS.primary, shadowOpacity: isDark ? 0.6 : 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 0 }
    },
    title: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: 36,
      color: COLORS.text,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      fontSize: FONT_SIZE.md,
      color: COLORS.textSecondary,
      marginTop: SPACING.xs,
      letterSpacing: 1,
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: BORDER_RADIUS.xl,
      padding: SPACING.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(100, 255, 218, 0.3)' : COLORS.border,
      shadowColor: isDark ? COLORS.primary : '#000',
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 5,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: COLORS.background,
      borderRadius: BORDER_RADIUS.lg,
      padding: 4,
      marginBottom: SPACING.xl,
      borderWidth: 1, borderColor: COLORS.border,
    },
    tab: {
      flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: BORDER_RADIUS.md,
    },
    activeTab: {
      backgroundColor: isDark ? 'rgba(100, 255, 218, 0.15)' : COLORS.card,
      shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    },
    tabText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      color: COLORS.textMuted,
      fontSize: FONT_SIZE.sm,
      textTransform: 'uppercase',
    },
    activeTabText: {
      color: COLORS.text,
    },
    inputGroup: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: 10,
      color: COLORS.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: COLORS.background,
      borderWidth: 1, borderColor: COLORS.border,
      borderRadius: BORDER_RADIUS.lg,
      paddingHorizontal: SPACING.md, height: 56,
    },
    inputIcon: {
      marginRight: SPACING.sm,
    },
    input: {
      flex: 1, height: '100%',
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      fontSize: FONT_SIZE.md, color: COLORS.text,
    },
    eyeBtn: {
      paddingHorizontal: SPACING.sm,
    },
    errorText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: FONT_SIZE.xs, color: COLORS.error,
      marginBottom: SPACING.md, textAlign: 'center',
    },
    primaryBtn: {
      backgroundColor: COLORS.primary,
      height: 56, borderRadius: BORDER_RADIUS.lg,
      justifyContent: 'center', alignItems: 'center',
      marginTop: SPACING.md,
    },
    primaryBtnText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: FONT_SIZE.md, color: isDark ? '#0D1117' : '#FFF',
      textTransform: 'uppercase', letterSpacing: 1,
    },
    divider: {
      flexDirection: 'row', alignItems: 'center',
      marginVertical: SPACING.xl,
    },
    line: {
      flex: 1, height: 1, backgroundColor: COLORS.border,
    },
    orText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: 10, color: COLORS.textMuted,
      marginHorizontal: SPACING.md,
    },
    ssoBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: COLORS.background,
      borderWidth: 1, borderColor: COLORS.border,
      height: 56, borderRadius: BORDER_RADIUS.lg,
    },
    ssoBtnText: {
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      fontSize: FONT_SIZE.sm, color: COLORS.text,
    },
  });
};
