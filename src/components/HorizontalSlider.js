import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { COLORS, TYPOGRAPHY, FONT_SIZE } from '../theme';

const HorizontalSlider = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  color = COLORS.primary,
  title = '',
  unit = '',
  showButtons = true
}) => {
  const [currentValue, setCurrentValue] = useState(value || min);

  useEffect(() => {
    setCurrentValue(value !== undefined ? value : min);
  }, [value, min]);

  const handleValueChange = (val) => {
    // Make sure we stick to steps
    let newValue = Math.round(val / step) * step;
    setCurrentValue(newValue);
  };

  const handleSlidingComplete = (val) => {
    let newValue = Math.round(val / step) * step;
    setCurrentValue(newValue);
    if (onChange) onChange(newValue);
  };

  const formatValue = (val) => {
    if (step % 1 !== 0) {
      const decimals = step.toString().split('.')[1].length;
      return Number(val).toFixed(decimals);
    }
    return Math.round(val).toString();
  };

  const increment = () => {
    let nv = Math.min(max, currentValue + step);
    if (step % 1 !== 0) {
      nv = Number(nv.toFixed(5));
    }
    setCurrentValue(nv);
    if (onChange) onChange(nv);
  };

  const decrement = () => {
    let nv = Math.max(min, currentValue - step);
    if (step % 1 !== 0) {
      nv = Number(nv.toFixed(5));
    }
    setCurrentValue(nv);
    if (onChange) onChange(nv);
  };

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      
      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {formatValue(currentValue)}
        </Text>
        {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
      </View>

      <View style={styles.sliderRow}>
        {showButtons && (
          <TouchableOpacity style={styles.button} onPress={decrement} activeOpacity={0.7} hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <MaterialCommunityIcons name="minus" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={currentValue}
          onValueChange={handleValueChange}
          onSlidingComplete={handleSlidingComplete}
          minimumTrackTintColor={color}
          maximumTrackTintColor="rgba(255,255,255,0.1)"
          thumbTintColor={color}
          tapToSeek={true}
        />

        {showButtons && (
          <TouchableOpacity style={styles.button} onPress={increment} activeOpacity={0.7} hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <MaterialCommunityIcons name="plus" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: 5,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 10,
    height: 45,
  },
  valueText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 40,
  },
  unitText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
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
  },
  slider: {
    flex: 1,
    height: Platform.OS === 'ios' ? 40 : 50,
    marginHorizontal: 10,
  }
});

export default HorizontalSlider;
