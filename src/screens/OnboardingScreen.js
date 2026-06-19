import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions,
  StatusBar, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Keyboard, Image, ScrollView
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile } from '../services/userService';
import { logoutUser } from '../services/authService';

const { width } = Dimensions.get('window');

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
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -50, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setCurrentStep(nextStep);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start();
    });
  };

  const animateBack = (prevStep) => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 50, duration: 150, useNativeDriver: true })
    ]).start(() => {
      setCurrentStep(prevStep);
      slideAnim.setValue(-50);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]).start();
    });
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) { animateNext(currentStep + 1); } 
    else {
      setSaving(true);
      try {
        await saveUserProfile(user.uid, {
          email: user.email, nickname: user.displayName || 'Hero',
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
    <View style={styles.cardContainer}>
      <TouchableOpacity style={[styles.cardBtn, formData.gender === 'male' && styles.cardBtnActive]} onPress={() => setFormData({...formData, gender: 'male'})} activeOpacity={0.8}>
        <MaterialCommunityIcons name="gender-male" size={48} color={formData.gender === 'male' ? COLORS.primary : COLORS.textMuted} />
        <Text style={[styles.cardText, formData.gender === 'male' && styles.cardTextActive]}>{t('onboarding.male')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.cardBtn, formData.gender === 'female' && styles.cardBtnActive]} onPress={() => setFormData({...formData, gender: 'female'})} activeOpacity={0.8}>
        <MaterialCommunityIcons name="gender-female" size={48} color={formData.gender === 'female' ? COLORS.primary : COLORS.textMuted} />
        <Text style={[styles.cardText, formData.gender === 'female' && styles.cardTextActive]}>{t('onboarding.female')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAgeStep = () => (
    <View style={styles.inputCard}>
      <MaterialCommunityIcons name="calendar-account" size={32} color={COLORS.textMuted} style={{marginBottom: SPACING.md}} />
      <TextInput style={styles.largeInput} keyboardType="numeric" placeholder="25" placeholderTextColor={COLORS.border} value={formData.age} onChangeText={(val) => setFormData({...formData, age: val})} autoFocus />
      <Text style={styles.unitText}>{t('onboarding.ageUnit')}</Text>
    </View>
  );

  const renderBodyStep = () => (
    <View style={styles.inputCardRow}>
      <View style={styles.inputCol}>
        <Text style={styles.colLabel}>{t('onboarding.height')}</Text>
        <TextInput style={styles.largeInput} keyboardType="numeric" placeholder="175" placeholderTextColor={COLORS.border} value={formData.height} onChangeText={(val) => setFormData({...formData, height: val})} autoFocus />
        <Text style={styles.unitText}>cm</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.inputCol}>
        <Text style={styles.colLabel}>{t('onboarding.weight')}</Text>
        <TextInput style={styles.largeInput} keyboardType="numeric" placeholder="70" placeholderTextColor={COLORS.border} value={formData.weight} onChangeText={(val) => setFormData({...formData, weight: val})} />
        <Text style={styles.unitText}>kg</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollCardContainer} decelerationRate="fast" snapToInterval={width * 0.75 + SPACING.md}>
        {bodyTypes.map(bt => (
          <TouchableOpacity key={bt.id} style={[styles.bodyTypeCard, formData.bodyType === bt.id && styles.bodyTypeCardActive]} onPress={() => setFormData({...formData, bodyType: bt.id})} activeOpacity={0.8}>
            <Image source={bt.icon} style={styles.bodyTypeImage} resizeMode="cover" />
            <View style={styles.bodyTypeInfo}>
              <Text style={[styles.bodyTypeTitle, formData.bodyType === bt.id && styles.bodyTypeTitleActive]}>{bt.title}</Text>
              <Text style={styles.bodyTypeDesc}>{bt.desc}</Text>
            </View>
            {formData.bodyType === bt.id && <View style={styles.selectedIcon}><MaterialCommunityIcons name="check-circle" size={28} color={COLORS.primary} /></View>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderGoalStep = () => (
    <View style={styles.listContainer}>
      <TouchableOpacity style={[styles.listBtn, formData.goal === 'lose' && styles.listBtnActive]} onPress={() => setFormData({...formData, goal: 'lose'})} activeOpacity={0.8}>
        <Text style={[styles.listTitle, formData.goal === 'lose' && styles.listTitleActive]}>{t('onboarding.goalLose')}</Text>
        <Text style={styles.listDesc}>{t('onboarding.goalLoseDesc')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.listBtn, formData.goal === 'maintain' && styles.listBtnActive]} onPress={() => setFormData({...formData, goal: 'maintain'})} activeOpacity={0.8}>
        <Text style={[styles.listTitle, formData.goal === 'maintain' && styles.listTitleActive]}>{t('onboarding.goalMaintain')}</Text>
        <Text style={styles.listDesc}>{t('onboarding.goalMaintainDesc')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.listBtn, formData.goal === 'gain' && styles.listBtnActive]} onPress={() => setFormData({...formData, goal: 'gain'})} activeOpacity={0.8}>
        <Text style={[styles.listTitle, formData.goal === 'gain' && styles.listTitleActive]}>{t('onboarding.goalGain')}</Text>
        <Text style={styles.listDesc}>{t('onboarding.goalGainDesc')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDietStep = () => (
    <View style={styles.listContainer}>
      <TouchableOpacity style={[styles.listBtn, formData.dietTiming === 'standard' && styles.listBtnActive]} onPress={() => setFormData({...formData, dietTiming: 'standard'})} activeOpacity={0.8}>
        <Text style={[styles.listTitle, formData.dietTiming === 'standard' && styles.listTitleActive]}>{t('onboarding.dietStandard')}</Text>
        <Text style={styles.listDesc}>{t('onboarding.dietStandardDesc')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.listBtn, formData.dietTiming === 'if' && styles.listBtnActive]} onPress={() => setFormData({...formData, dietTiming: 'if'})} activeOpacity={0.8}>
        <Text style={[styles.listTitle, formData.dietTiming === 'if' && styles.listTitleActive]}>{t('onboarding.dietIF')}</Text>
        <Text style={styles.listDesc}>{t('onboarding.dietIFDesc')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.listBtn, formData.dietTiming === 'omad' && styles.listBtnActive]} onPress={() => setFormData({...formData, dietTiming: 'omad'})} activeOpacity={0.8}>
        <Text style={[styles.listTitle, formData.dietTiming === 'omad' && styles.listTitleActive]}>{t('onboarding.dietOMAD')}</Text>
        <Text style={styles.listDesc}>{t('onboarding.dietOMADDesc')}</Text>
      </TouchableOpacity>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle={COLORS.background === '#0D1117' ? 'light-content' : 'dark-content'} backgroundColor={COLORS.background} />
      
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
          <TouchableOpacity style={[styles.nextButton, (!isStepValid() || saving) && styles.nextButtonDisabled]} onPress={handleNext} disabled={!isStepValid() || saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.nextText}>{currentStep === STEPS.length - 1 ? t('common.save') : t('common.next')}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (COLORS) => {
  const isDark = COLORS.background === '#0D1117';
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20, paddingBottom: SPACING.md },
    backButton: { padding: SPACING.xs },
    progressTextContainer: { flex: 1, alignItems: 'center', marginRight: 36 },
    stepIndicator: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
    progressBar: { height: 3, backgroundColor: COLORS.border, marginHorizontal: SPACING.xl, borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: COLORS.primary },
    content: { flex: 1 },
    animContainer: { flex: 1 },
    header: { paddingHorizontal: SPACING.xl, marginTop: SPACING.xxl, marginBottom: SPACING.xl },
    stepTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 32, color: COLORS.text, letterSpacing: 1 },
    stepSubtitle: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.xs },
    stepContentWrapper: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
    
    // Cards for Gender
    cardContainer: { flexDirection: 'row', gap: SPACING.lg },
    cardBtn: { flex: 1, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardBtnActive: { borderColor: COLORS.primary, backgroundColor: isDark ? '#19262B' : '#F5FBF6', shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10, elevation: 0 },
    cardText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: COLORS.textSecondary, marginTop: SPACING.md },
    cardTextActive: { color: COLORS.primary },

    // Input Cards for Age, Height, Weight
    inputCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    inputCardRow: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'space-around' },
    inputCol: { alignItems: 'center', flex: 1 },
    colLabel: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', marginBottom: SPACING.md },
    divider: { width: 1, height: 60, backgroundColor: COLORS.border },
    largeInput: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: 48, color: COLORS.text, padding: 0, margin: 0, textAlign: 'center', minWidth: 100 },
    unitText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.sm, color: COLORS.primary, marginTop: SPACING.xs, textTransform: 'uppercase' },

    // Horizontal Scroll Cards for Body Types
    scrollCardContainer: { paddingVertical: SPACING.sm, gap: SPACING.md },
    bodyTypeCard: { width: width * 0.75, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.xl, borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.border, position: 'relative', overflow: 'hidden' },
    bodyTypeCardActive: { borderColor: COLORS.primary, shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 0 },
    bodyTypeImage: { width: '100%', height: 240, backgroundColor: '#000000' },
    bodyTypeInfo: { padding: SPACING.xl },
    bodyTypeTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.xl, color: COLORS.text, marginBottom: SPACING.xs },
    bodyTypeTitleActive: { color: COLORS.primary },
    bodyTypeDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, lineHeight: 20 },
    selectedIcon: { position: 'absolute', top: SPACING.md, right: SPACING.md, backgroundColor: COLORS.card, borderRadius: 14, overflow: 'hidden' },

    // List Cards for Goal & Diet
    listContainer: { gap: SPACING.md },
    listBtn: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: COLORS.border },
    listBtnActive: { borderColor: COLORS.primary, backgroundColor: isDark ? '#19262B' : '#F5FBF6', elevation: 0 },
    listTitle: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.lg, color: COLORS.text, marginBottom: 4 },
    listTitleActive: { color: COLORS.primary },
    listDesc: { fontFamily: TYPOGRAPHY.fontFamily.regular, fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },

    footer: { paddingHorizontal: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xxl, paddingTop: SPACING.lg },
    nextButton: { backgroundColor: COLORS.text, height: 64, borderRadius: BORDER_RADIUS.full, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.text, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: {width:0, height:5} },
    nextButtonDisabled: { opacity: 0.5 },
    nextText: { fontFamily: TYPOGRAPHY.fontFamily.bold, fontSize: FONT_SIZE.md, color: COLORS.background, textTransform: 'uppercase', letterSpacing: 1 },
  });
};
