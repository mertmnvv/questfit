import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS, TYPOGRAPHY, FONT_SIZE, BORDER_RADIUS, SHADOWS } from '../theme';

const { width, height } = Dimensions.get('window');

// Lottie için public bir konfeti URL'i (kendi JSON dosyanı assets'e koyup import da edebilirsin)
const CONFETTI_URL = 'https://lottie.host/295191de-50ba-4475-a4b0-a5fc0d099238/X1m62G5pZ2.json';

export default function LevelUpModal({ visible, newLevel, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Modalı göster
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Modalı gizle
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        scaleAnim.setValue(0.8);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <LottieView
        source={{ uri: CONFETTI_URL }}
        autoPlay
        loop={false}
        style={styles.lottie}
        resizeMode="cover"
      />
      
      <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.title}>YENİ SEVİYE!</Text>
        <Text style={styles.subtitle}>Gelişiminiz Devam Ediyor!</Text>
        
        <View style={styles.levelCircle}>
          <Text style={styles.levelNumber}>{newLevel}</Text>
        </View>
        
        <Text style={styles.desc}>Sağlıklı yaşam yolculuğunuzda yeni bir aşamaya ulaştınız.</Text>

        <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Devam Et</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 23, 29, 0.9)', // Koyu transparan arka plan
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  lottie: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
    zIndex: 1001,
  },
  modalBox: {
    backgroundColor: COLORS.card,
    width: '80%',
    padding: 30,
    borderRadius: BORDER_RADIUS.xl,
    alignItems: 'center',
    zIndex: 1002,
    borderWidth: 2,
    borderColor: COLORS.accent,
    ...SHADOWS.glow,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.accent,
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    marginBottom: 20,
  },
  levelCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.background,
    borderWidth: 4,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.glow,
  },
  levelNumber: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 48,
    color: COLORS.accent,
  },
  desc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.button,
  },
  buttonText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.background,
  },
});
