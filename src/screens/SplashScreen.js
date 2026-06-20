import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  withRepeat, 
  Easing,
  withDelay
} from 'react-native-reanimated';

import { useThemeColors } from '../hooks/useThemeColors';
import { SPACING, FONT_SIZE, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');

// GREEN THEME COLORS
const GREEN_PRIMARY = '#40C057';
const GREEN_LIGHT = '#69DB7C';
const GREEN_DARK = '#2F9E44';

export default function SplashScreen() {
  const COLORS = useThemeColors();
  
  // Animation Values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const pulseRingScale = useSharedValue(1);
  const pulseRingOpacity = useSharedValue(0.6);

  useEffect(() => {
    // 1. Logo pop in
    logoScale.value = withSpring(1, { damping: 12, stiffness: 90 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    // 2. Continuous pulse ring behind the logo
    pulseRingScale.value = withRepeat(
      withTiming(1.6, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseRingOpacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // 3. Text slide up
    textTranslateY.value = withDelay(400, withSpring(0, { damping: 12, stiffness: 90 }));
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // 4. Loading Bar fill
    barWidth.value = withDelay(
      600,
      withTiming(100, { duration: 5000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );

  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }]
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }]
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: pulseRingOpacity.value,
    transform: [{ scale: pulseRingScale.value }]
  }));

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle={COLORS.background === '#FFFFFF' || COLORS.background === '#F8F9FA' ? "dark-content" : "light-content"} backgroundColor={COLORS.background} />
      
      {/* Background gradient adapting to theme */}
      <LinearGradient 
        colors={[COLORS.background, COLORS.card, COLORS.background]} 
        style={styles.gradient}
      >
        <View style={styles.centerContent}>
          
          <View style={styles.logoWrapper}>
            {/* Main Emblem Image with pulsing scale */}
            <Animated.View style={[styles.emblemContainer, logoStyle]}>
              <Animated.Image 
                source={require('../../assets/splash.png')} 
                style={[styles.splashImage, ringStyle]} 
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Typography */}
          <Animated.View style={[styles.textWrapper, textStyle]}>
            <Text style={[styles.subtitle, { color: GREEN_DARK }]}>Sağlıklı Yaşama Adım Atılıyor...</Text>
          </Animated.View>

          {/* Green Loading Bar */}
          <View style={[styles.loaderBg, { backgroundColor: COLORS.border, borderColor: 'transparent' }]}>
            <Animated.View style={[styles.loaderFill, barStyle]}>
              <LinearGradient 
                colors={[GREEN_DARK, GREEN_PRIMARY, GREEN_LIGHT]} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={StyleSheet.absoluteFill} 
              />
            </Animated.View>
          </View>
          
        </View>

        <Text style={[styles.footerText, { color: COLORS.textMuted }]}>v1.0.0</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: 250,
    height: 250,
  },
  emblemContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    alignItems: 'center',
  },
  subtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: GREEN_PRIMARY,
    marginTop: SPACING.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  loaderBg: {
    width: width * 0.65,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 60,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  loaderFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  footerText: {
    position: 'absolute',
    bottom: 30,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1,
  },
});
