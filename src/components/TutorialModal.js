import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../store/userStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

export default function TutorialModal() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const COLORS = useThemeColors();
  const styles = useMemo(() => getStyles(COLORS), [COLORS]);

  const { tutorialSeen, setTutorialSeen } = useUserStore();
  const [currentStep, setCurrentStep] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Trigger entering animations when visible
  useEffect(() => {
    if (!tutorialSeen) {
      setCurrentStep(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [tutorialSeen]);

  if (tutorialSeen) return null;

  // Config steps
  const TUTORIAL_STEPS = [
    {
      icon: 'chart-pie',
      title: t('tutorial.step1Title'),
      desc: t('tutorial.step1Desc'),
      color: COLORS.primary,
      tab: 'DashboardTab'
    },
    {
      icon: 'silverware-fork-knife',
      title: t('tutorial.step2Title'),
      desc: t('tutorial.step2Desc'),
      color: '#FCC419', // Gold/yellow for diary
      tab: 'DashboardTab' // or stay
    },
    {
      icon: 'dumbbell',
      title: t('tutorial.step3Title'),
      desc: t('tutorial.step3Desc'),
      color: '#FF6B6B', // Red/pink for workouts
      tab: 'WorkoutsTab'
    },
    {
      icon: 'shield-check',
      title: t('tutorial.step4Title'),
      desc: t('tutorial.step4Desc'),
      color: '#4DABF7', // Blue for daily goals
      tab: 'QuestsTab'
    },
    {
      icon: 'account-group',
      title: t('tutorial.step5Title') || 'Topluluk',
      desc: t('tutorial.step5Desc') || 'Diğer kullanıcıların hedeflerini gör ve liderlik tablosunda yarış!',
      color: '#9C27B0', // Purple for community
      tab: 'CommunityTab'
    }
  ];

  const handleNextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextIndex = currentStep + 1;
      
      // Navigate to the relevant tab behind the modal
      if (TUTORIAL_STEPS[nextIndex].tab) {
        navigation.navigate(TUTORIAL_STEPS[nextIndex].tab);
      }

      // Animate slide
      Animated.timing(slideAnim, {
        toValue: -nextIndex * (width * 0.85),
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentStep(nextIndex);
    } else {
      // Fade out and close
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => {
        setTutorialSeen(true);
        navigation.navigate('DashboardTab');
      });
    }
  };

  const handleSkip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setTutorialSeen(true);
      navigation.navigate('DashboardTab');
    });
  };

  return (
    <Modal visible={!tutorialSeen} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
          
          {/* Header Skip Option */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
              <Text style={styles.skipBtnText}>
                {t('common.back') === 'Geri' ? 'Geç' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Slider Container */}
          <View style={styles.sliderViewport}>
            <Animated.View style={[styles.slider, { transform: [{ translateX: slideAnim }] }]}>
              {TUTORIAL_STEPS.map((step, index) => (
                <View key={index} style={styles.slide}>
                  
                  {/* Minimal Icon Container */}
                  <View style={[styles.iconContainer]}>
                    <MaterialCommunityIcons name={step.icon} size={72} color={step.color} />
                  </View>
                  
                  <Text style={styles.title}>{step.title}</Text>
                  <Text style={styles.desc}>{step.desc}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Footer Controls */}
          <View style={styles.footer}>
            {/* Dots */}
            <View style={styles.dotsContainer}>
              {TUTORIAL_STEPS.map((step, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dot, 
                    currentStep === index && styles.dotActive,
                    { backgroundColor: currentStep === index ? TUTORIAL_STEPS[currentStep].color : COLORS.border }
                  ]} 
                />
              ))}
            </View>

            {/* Minimalist Next Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                { 
                  borderColor: TUTORIAL_STEPS[currentStep].color,
                  borderWidth: 1,
                  backgroundColor: 'transparent'
                }
              ]} 
              onPress={handleNextStep}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, { color: TUTORIAL_STEPS[currentStep].color }]}>
                {currentStep === TUTORIAL_STEPS.length - 1 ? t('tutorial.finish') : t('common.next')}
              </Text>
              <MaterialCommunityIcons 
                name={currentStep === TUTORIAL_STEPS.length - 1 ? 'check' : 'arrow-right'} 
                size={18} 
                color={TUTORIAL_STEPS[currentStep].color} 
                style={{ marginLeft: 6 }} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const getStyles = (COLORS) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)', // Koyu mat bir arka plan (dark dim)
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    height: 430,
    backgroundColor: 'transparent', // Kutu yok, tamamen havada duruyor
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  skipBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  skipBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  sliderViewport: {
    flex: 1,
    overflow: 'hidden',
    width: width * 0.85,
  },
  slider: {
    flexDirection: 'row',
    width: width * 0.85 * 4,
    flex: 1,
  },
  slide: {
    width: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xl,
    color: '#FFF', // Her zaman beyaz (overlay olduğu için okunur)
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  desc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.md,
    color: '#rgba(255,255,255,0.7)', // Yarı saydam beyaz
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: 100, // Tam yuvarlak buton köşeleri (Pill shape)
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
  }
});
