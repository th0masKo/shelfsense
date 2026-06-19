import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../constants/theme';

interface DietaryFilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function DietaryFilterChip({ label, selected, onPress }: DietaryFilterChipProps) {
  const selectionAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected, selectionAnim]);

  const backgroundColor = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.secondary, colors.teal],
  });

  const borderColor = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.teal],
  });

  const pressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };

  const pressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Animated.View style={[styles.chip, { backgroundColor, borderColor }]}>
          <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 20,
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
