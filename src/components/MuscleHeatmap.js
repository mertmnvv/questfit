import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { useThemeColors } from '../hooks/useThemeColors';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function MuscleHeatmap({ fatigueData = {}, size = 200 }) {
  const COLORS = useThemeColors();

  // Helper to interpolate fatigue (0 = rested/green, 1 = fatigued/red)
  const getFatigueColor = (fatigueValue) => {
    const val = Math.max(0, Math.min(1, fatigueValue || 0));
    if (val < 0.3) return '#4ade80'; // Green
    if (val < 0.7) return '#facc15'; // Yellow
    return '#f87171'; // Red
  };

  // Abstract Human Silhouette Paths
  const paths = {
    head: { d: "M100 20 A 15 15 0 1 0 100 50 A 15 15 0 1 0 100 20 Z", id: 'head' },
    chest: { d: "M 70 60 L 130 60 L 120 110 L 80 110 Z", id: 'chest' },
    core: { d: "M 80 115 L 120 115 L 115 150 L 85 150 Z", id: 'core' },
    leftArm: { d: "M 65 65 L 40 120 L 55 125 L 75 75 Z", id: 'arms' },
    rightArm: { d: "M 135 65 L 160 120 L 145 125 L 125 75 Z", id: 'arms' },
    leftLeg: { d: "M 85 155 L 70 230 L 90 235 L 100 155 Z", id: 'legs' },
    rightLeg: { d: "M 115 155 L 130 230 L 110 235 L 100 155 Z", id: 'legs' }
  };

  const animValues = useRef({
    head: new Animated.Value(0),
    chest: new Animated.Value(0),
    core: new Animated.Value(0),
    arms: new Animated.Value(0),
    legs: new Animated.Value(0)
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animValues.chest, { toValue: fatigueData.chest || 0, duration: 800, useNativeDriver: false }),
      Animated.timing(animValues.core, { toValue: fatigueData.core || 0, duration: 800, useNativeDriver: false }),
      Animated.timing(animValues.arms, { toValue: fatigueData.arms || 0, duration: 800, useNativeDriver: false }),
      Animated.timing(animValues.legs, { toValue: fatigueData.legs || 0, duration: 800, useNativeDriver: false }),
      Animated.timing(animValues.head, { toValue: 0, duration: 800, useNativeDriver: false }),
    ]).start();
  }, [fatigueData]);

  const renderPart = (partKey, data) => {
    const fatigue = fatigueData[data.id] || 0;
    const fillColor = getFatigueColor(fatigue);

    return (
      <Path
        key={partKey}
        d={data.d}
        fill={fillColor}
        stroke={COLORS.background}
        strokeWidth={3}
      />
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size * 1.3 }]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 250">
        {Object.entries(paths).map(([key, data]) => renderPart(key, data))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});
