import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, FONT_SIZE, BORDER_RADIUS } from '../theme';

const CircularSlider = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  radius = 80,
  strokeWidth = 16,
  color = COLORS.primary,
  title = '',
  unit = '',
  showButtons = true
}) => {
  const [currentValue, setCurrentValue] = useState(value || min);
  
  useEffect(() => {
    setCurrentValue(value !== undefined ? value : min);
  }, [value, min]);

  const center = radius + strokeWidth;
  const size = center * 2;
  
  const handlePan = (dx, dy) => {
    // Calculate coordinates relative to center
    const x = dx - center;
    const y = dy - center;
    
    // Calculate angle from center (top is 0)
    let angle = Math.atan2(y, x);
    angle = angle + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    
    // Map angle to value
    let progress = angle / (2 * Math.PI);
    let newValue = min + progress * (max - min);
    
    // Apply step
    newValue = Math.round(newValue / step) * step;
    
    // Clamp to min/max
    if (newValue < min) newValue = min;
    if (newValue > max) newValue = max;
    
    setCurrentValue(newValue);
    if (onChange) onChange(newValue);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Prevents scroll view from hijacking the gesture
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        handlePan(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
      onPanResponderMove: (evt) => {
        handlePan(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
      },
    })
  ).current;

  // Render arc
  const progress = (currentValue - min) / (max - min || 1);
  const angle = progress * 2 * Math.PI;
  const endX = center + radius * Math.cos(angle - Math.PI / 2);
  const endY = center + radius * Math.sin(angle - Math.PI / 2);
  const largeArcFlag = angle > Math.PI ? 1 : 0;
  
  // Path string for the progress arc
  // M = Move to (top center), A = Arc to (endX, endY)
  // Fix for full circle (progress === 1)
  const isFullCircle = progress === 1;
  let pathData = '';
  if (isFullCircle) {
    pathData = `M ${center} ${strokeWidth} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${strokeWidth}`;
  } else if (progress > 0) {
    pathData = `M ${center} ${strokeWidth} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  }

  const formatValue = (val) => {
    // Determine precision based on step
    if (step % 1 !== 0) {
      // It's a float, like 0.1
      const decimals = step.toString().split('.')[1].length;
      return val.toFixed(decimals);
    }
    return val.toString();
  };

  const increment = () => {
    let nv = Math.min(max, currentValue + step);
    // Fix floating point errors
    nv = Number(nv.toFixed(5));
    setCurrentValue(nv);
    if (onChange) onChange(nv);
  };

  const decrement = () => {
    let nv = Math.max(min, currentValue - step);
    // Fix floating point errors
    nv = Number(nv.toFixed(5));
    setCurrentValue(nv);
    if (onChange) onChange(nv);
  };

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} {...panResponder.panHandlers}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Arc */}
          {progress > 0 && (
            <Path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
            />
          )}
          {/* Thumb */}
          <Circle
            cx={progress === 0 ? center : endX}
            cy={progress === 0 ? strokeWidth : endY}
            r={strokeWidth * 0.8}
            fill="#FFFFFF"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.3}
            shadowRadius={3}
          />
        </Svg>
        
        {/* Center Text */}
        <View style={styles.centerTextContainer}>
          <Text style={[styles.valueText, { color }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatValue(currentValue)}
          </Text>
          {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
        </View>
      </View>

      {showButtons && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={decrement} activeOpacity={0.7}>
            <MaterialCommunityIcons name="minus" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={increment} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: 15,
    textAlign: 'center',
  },
  centerTextContainer: {
    width: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  valueText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 32,
    textAlign: 'center',
  },
  unitText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    gap: 30,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  }
});

export default CircularSlider;
