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
import { useUserStore } from '../store/userStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

export default function TutorialModal() {
  const { t } = useTranslation();
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
    },
    {
      icon: 'silverware-fork-knife',
      title: t('tutorial.step2Title'),
      desc: t('tutorial.step2Desc'),
      color: '#FCC419', // Gold/yellow for diary
    },
    {
      icon: 'dumbbell',
      title: t('tutorial.step3Title'),
      desc: t('tutorial.step3Desc'),
      color: '#FF6B6B', // Red/pink for workouts
    },
    {
      icon: 'shield-check',
      title: t('tutorial.step4Title'),
      desc: t('tutorial.step4Desc'),
      color: '#4DABF7', // Blue for daily goals
    }
  ];

  const handleNextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      // Animate slide
      const nextIndex = currentStep + 1;
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
                  
                  {/* Glowing Icon Container */}
                  <View style={[styles.iconContainer, { backgroundColor: step.color + '10', borderColor: step.color }]}>
                    <MaterialCommunityIcons name={step.icon} size={54} color={step.color} />
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

            {/* Glowing Next Button */}
            <TouchableOpacity 
              style={[
                styles.button, 
                { 
                  backgroundColor: TUTORIAL_STEPS[currentStep].color,
                  shadowColor: TUTORIAL_STEPS[currentStep].color,
                }
              ]} 
              onPress={handleNextStep}
              activeOpacity={0.9}
            >
              <Text style={styles.buttonText}>
                {currentStep === TUTORIAL_STEPS.length - 1 ? t('tutorial.finish') : t('common.next')}
              </Text>
              <MaterialCommunityIcons 
                name={currentStep === TUTORIAL_STEPS.length - 1 ? 'check' : 'arrow-right'} 
                size={16} 
                color="#0D1117" 
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
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    height: 430,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.card,
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
    borderRadius: BORDER_RADIUS.sm,
  },
  skipBtnText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xs,
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
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: SPACING.lg,
    ...SHADOWS.glow,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  desc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    transition: 'width 0.2s',
  },
  dotActive: {
    width: 16,
  },
  button: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: '#0D1117',
  }
});
