import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  StatusBar, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Keyboard, Image, ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile } from '../services/userService';
import { logoutUser } from '../services/authService';

const { width, height } = Dimensions.get('window');

const GREEN_PRIMARY = '#40C057';
const GREEN_DARK = '#2F9E44';

export default function OnboardingScreen({ navigation }) {
  const { t } = useTranslation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const STEPS = [
    { key: 'gender', title: t('onboarding.genderTitle'), subtitle: t('onboarding.genderSubtitle') },
    { key: 'age', title: t('onboarding.ageTitle'), subtitle: t('onboarding.ageSubtitle') },
    { key: 'body', title: t('onboarding.bodyTitle'), subtitle: t('onboarding.bodySubtitle') },
    { key: 'bodyType', title: t('onboarding.bodyClassTitle'), subtitle: t('onboarding.bodyClassSubtitle') },
    { key: 'goal', title: t('onboarding.goalTitle'), subtitle: t('onboarding.goalSubtitle') },
    { key: 'diet', title: t('onboarding.dietTitle'), subtitle: t('onboarding.dietSubtitle') },
  ];

  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    gender: null, age: '', height: '', weight: '',
    bodyType: null, goal: null, dietTiming: 'standard',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.gender !== null;
      case 1: return formData.age !== '' && parseInt(formData.age) > 0;
      case 2: return formData.height !== '' && formData.weight !== '';
      case 3: return formData.bodyType !== null;
      case 4: return formData.goal !== null;
      case 5: return formData.dietTiming !== null;
      default: return false;
    }
  };

  const animateNext = (nextStep) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    });
  };

  const animateBack = (prevStep) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 30, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setCurrentStep(prevStep);
      slideAnim.setValue(-30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true })
      ]).start();
    });
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) { animateNext(currentStep + 1); } 
    else {
      setSaving(true);
      try {
        await saveUserProfile(user.uid, {
          email: user.email, nickname: user.displayName || 'Kahraman',
          gender: formData.gender, age: parseInt(formData.age),
          height: parseInt(formData.height), weight: parseFloat(formData.weight),
          bodyType: formData.bodyType, goal: formData.goal,
          dietPlan: formData.dietTiming, macroSplit: 'balanced',
        });
        await refreshProfile();
      } catch (error) { console.error(error); } 
      finally { setSaving(false); }
    }
  };

  const handleBack = async () => {
    if (currentStep > 0) { animateBack(currentStep - 1); } 
    else { try { await logoutUser(); } catch (e) {} }
  };

  const renderGenderStep = () => (
    <View style={styles.glassContainerRow}>
      <TouchableOpacity style={[styles.glassBtn, formData.gender === 'male' && styles.glassBtnActive]} onPress={() => setFormData({...formData, gender: 'male'})} activeOpacity={0.8}>
        <MaterialCommunityIcons name="gender-male" size={64} color={formData.gender === 'male' ? GREEN_PRIMARY : COLORS.textMuted} />
        <Text style={[styles.glassText, formData.gender === 'male' && styles.glassTextActive]}>{t('onboarding.male')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.glassBtn, formData.gender === 'female' && styles.glassBtnActive]} onPress={() => setFormData({...formData, gender: 'female'})} activeOpacity={0.8}>
        <MaterialCommunityIcons name="gender-female" size={64} color={formData.gender === 'female' ? GREEN_PRIMARY : COLORS.textMuted} />
        <Text style={[styles.glassText, formData.gender === 'female' && styles.glassTextActive]}>{t('onboarding.female')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAgeStep = () => (
    <View style={styles.floatingInputWrapper}>
      <TextInput style={styles.massiveInput} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} value={formData.age} onChangeText={(val) => setFormData({...formData, age: val})} autoFocus maxLength={3} />
      <Text style={styles.massiveUnit}>{t('onboarding.ageUnit')}</Text>
      <View style={styles.floatingLine} />
    </View>
  );

  const renderBodyStep = () => (
    <View style={styles.glassContainerRow}>
      <View style={styles.floatingInputCol}>
        <Text style={styles.floatingLabel}>{t('onboarding.height')}</Text>
        <View style={styles.floatingInputRow}>
          <TextInput style={styles.massiveInput} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} value={formData.height} onChangeText={(val) => setFormData({...formData, height: val})} autoFocus maxLength={3} />
          <Text style={styles.massiveUnit}>cm</Text>
        </View>
        <View style={styles.floatingLine} />
      </View>
      <View style={styles.floatingInputCol}>
        <Text style={styles.floatingLabel}>{t('onboarding.weight')}</Text>
        <View style={styles.floatingInputRow}>
          <TextInput style={styles.massiveInput} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} value={formData.weight} onChangeText={(val) => setFormData({...formData, weight: val})} maxLength={5} />
          <Text style={styles.massiveUnit}>kg</Text>
        </View>
        <View style={styles.floatingLine} />
      </View>
    </View>
  );

  const renderBodyTypeStep = () => {
    const isFemale = formData.gender === 'female';
    const bodyTypes = [
      { id: 'ectomorph', title: t('onboarding.ectomorph'), icon: isFemale ? require('../../assets/body_ecto_female.png') : require('../../assets/body_ecto_male.png'), desc: t('onboarding.ectoDesc') },
      { id: 'mesomorph', title: t('onboarding.mesomorph'), icon: isFemale ? require('../../assets/body_meso_female.png') : require('../../assets/body_meso_male.png'), desc: t('onboarding.mesoDesc') },
      { id: 'endomorph', title: t('onboarding.endomorph'), icon: isFemale ? require('../../assets/body_endo_female.png') : require('../../assets/body_endo_male.png'), desc: t('onboarding.endoDesc') }
    ];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollGlassContainer} decelerationRate="fast" snapToInterval={width * 0.75 + SPACING.md}>
        {bodyTypes.map(bt => (
          <TouchableOpacity key={bt.id} style={[styles.glassBodyCard, formData.bodyType === bt.id && styles.glassBodyCardActive]} onPress={() => setFormData({...formData, bodyType: bt.id})} activeOpacity={0.8}>
            <Image source={bt.icon} style={styles.glassBodyImage} resizeMode="contain" />
            <View style={styles.glassBodyInfo}>
              <Text style={[styles.glassBodyTitle, formData.bodyType === bt.id && styles.glassBodyTitleActive]}>{bt.title}</Text>
              <Text style={styles.glassBodyDesc}>{bt.desc}</Text>
            </View>
            {formData.bodyType === bt.id && (
              <View style={styles.selectedGlow}>
                <MaterialCommunityIcons name="check" size={24} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderGoalStep = () => (
    <View style={styles.glassListContainer}>
      {['lose', 'maintain', 'gain'].map((goalKey) => {
        const goalMap = {
          'lose': { title: t('onboarding.goalLose'), desc: t('onboarding.goalLoseDesc') },
          'maintain': { title: t('onboarding.goalMaintain'), desc: t('onboarding.goalMaintainDesc') },
          'gain': { title: t('onboarding.goalGain'), desc: t('onboarding.goalGainDesc') }
        };
        const isActive = formData.goal === goalKey;
        return (
          <TouchableOpacity key={goalKey} style={[styles.glassListBtn, isActive && styles.glassListBtnActive]} onPress={() => setFormData({...formData, goal: goalKey})} activeOpacity={0.8}>
            {isActive && <View style={styles.activeLineIndicator} />}
            <Text style={[styles.glassListTitle, isActive && styles.glassListTitleActive]}>{goalMap[goalKey].title}</Text>
            <Text style={styles.glassListDesc}>{goalMap[goalKey].desc}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderDietStep = () => (
    <View style={styles.glassListContainer}>
      {['standard', 'if', 'omad'].map((dietKey) => {
        const dietMap = {
          'standard': { title: t('onboarding.dietStandard'), desc: t('onboarding.dietStandardDesc') },
          'if': { title: t('onboarding.dietIF'), desc: t('onboarding.dietIFDesc') },
          'omad': { title: t('onboarding.dietOMAD'), desc: t('onboarding.dietOMADDesc') }
        };
        const isActive = formData.dietTiming === dietKey;
        return (
          <TouchableOpacity key={dietKey} style={[styles.glassListBtn, isActive && styles.glassListBtnActive]} onPress={() => setFormData({...formData, dietTiming: dietKey})} activeOpacity={0.8}>
            {isActive && <View style={styles.activeLineIndicator} />}
            <Text style={[styles.glassListTitle, isActive && styles.glassListTitleActive]}>{dietMap[dietKey].title}</Text>
            <Text style={styles.glassListDesc}>{dietMap[dietKey].desc}</Text>
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.glassListDesc, { color: '#FFA8A8', marginTop: 10, textAlign: 'center', fontStyle: 'italic', fontSize: 11 }]}>
        {t('onboarding.medicalWarning')}
      </Text>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderGenderStep();
      case 1: return renderAgeStep();
      case 2: return renderBodyStep();
      case 3: return renderBodyTypeStep();
      case 4: return renderGoalStep();
      case 5: return renderDietStep();
      default: return null;
    }
  };

  const isDark = COLORS.background === '#0D1117';
  const gradientColors = isDark 
    ? ['#0D1117', '#0A1A10', '#0D1117'] 
    : ['#FFFFFF', '#E8F5E9', '#FFFFFF'];

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.progressTextContainer}>
          <Text style={styles.stepIndicator}>{t('onboarding.step')} {currentStep + 1} / {STEPS.length}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Animated.View style={[styles.animContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.header}>
              <Text style={styles.stepTitle}>{STEPS[currentStep].title}</Text>
              <Text style={styles.stepSubtitle}>{STEPS[currentStep].subtitle}</Text>
            </View>
            
            <View style={styles.stepContentWrapper}>
              {renderCurrentStep()}
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.primaryBtn, (!isStepValid() || saving) && styles.primaryBtnDisabled]} onPress={handleNext} disabled={!isStepValid() || saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryBtnText}>{currentStep === STEPS.length - 1 ? t('common.save') : t('common.next')}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const getStyles = (COLORS) => {
  const isDark = COLORS.background === '#0D1117';
  const glassBgColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const borderLineColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20, paddingBottom: SPACING.md },
    backButton: { padding: SPACING.xs },
    progressTextContainer: { flex: 1, alignItems: 'center', marginRight: 36 },
    stepIndicator: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 2 },
    progressBar: { height: 2, backgroundColor: glassBgColor, marginHorizontal: SPACING.xl, borderRadius: 1, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: GREEN_PRIMARY },
    content: { flex: 1 },
    animContainer: { flex: 1 },
    header: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl, marginBottom: SPACING.xl, alignItems: 'center' },
    stepTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 32, color: COLORS.text, letterSpacing: 1, textAlign: 'center' },
    stepSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },
    stepContentWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
    
    // Glassmorphism Gender
    glassContainerRow: { flexDirection: 'row', gap: SPACING.lg, width: '100%', justifyContent: 'center' },
    glassBtn: { flex: 1, maxWidth: 160, aspectRatio: 1, borderRadius: BORDER_RADIUS.full, padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: borderLineColor, borderStyle: 'dashed' },
    glassBtnActive: { borderColor: GREEN_PRIMARY, backgroundColor: glassBgColor, borderStyle: 'solid', shadowColor: GREEN_PRIMARY, shadowOpacity: 0.1, shadowRadius: 15, elevation: 0 },
    glassText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.lg, color: COLORS.textMuted, marginTop: SPACING.md, letterSpacing: 1 },
    glassTextActive: { color: GREEN_PRIMARY },

    // Floating Inputs for Age, Height, Weight
    floatingInputWrapper: { alignItems: 'center', justifyContent: 'center' },
    floatingInputCol: { alignItems: 'center', flex: 1 },
    floatingInputRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
    floatingLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 12, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 2, marginBottom: SPACING.sm },
    massiveInput: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 64, color: COLORS.text, padding: 0, margin: 0, textAlign: 'center', minWidth: 80 },
    massiveUnit: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.lg, color: COLORS.textMuted, marginBottom: 12, marginLeft: 4 },
    floatingLine: { height: 2, width: 100, backgroundColor: borderLineColor, marginTop: SPACING.md },

    // Glassmorphism Body Types
    scrollGlassContainer: { paddingVertical: SPACING.md, gap: SPACING.lg, paddingHorizontal: SPACING.xl },
    glassBodyCard: { width: width * 0.7, alignItems: 'center', position: 'relative', opacity: 0.6 },
    glassBodyCardActive: { opacity: 1 },
    glassBodyImage: { width: '100%', height: 300 },
    glassBodyInfo: { alignItems: 'center', marginTop: SPACING.xl },
    glassBodyTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 24, color: COLORS.text, letterSpacing: 1, marginBottom: SPACING.xs },
    glassBodyTitleActive: { color: GREEN_PRIMARY },
    glassBodyDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
    selectedGlow: { position: 'absolute', top: '40%', backgroundColor: GREEN_PRIMARY, borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', shadowColor: GREEN_PRIMARY, shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },

    // Sleek Lists for Goal & Diet
    glassListContainer: { width: '100%', gap: SPACING.lg },
    glassListBtn: { width: '100%', paddingVertical: SPACING.xl, paddingHorizontal: SPACING.lg, backgroundColor: 'transparent', position: 'relative' },
    glassListBtnActive: { backgroundColor: glassBgColor },
    activeLineIndicator: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, backgroundColor: GREEN_PRIMARY, borderRadius: 2 },
    glassListTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 22, color: COLORS.textMuted, marginBottom: 6, letterSpacing: 1 },
    glassListTitleActive: { color: COLORS.text },
    glassListDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },

    footer: { paddingHorizontal: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xxl, paddingTop: SPACING.lg },
    primaryBtn: { backgroundColor: GREEN_PRIMARY, height: 64, borderRadius: BORDER_RADIUS.full, justifyContent: 'center', alignItems: 'center', shadowColor: GREEN_DARK, shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 8, width: '100%' },
    primaryBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
    primaryBtnText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 3 },
  });
};
