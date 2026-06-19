import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../../constants/theme';

interface ExpiringIngredientChipProps {
  emoji: string;
  name: string;
  selected: boolean;
  onPress: () => void;
}

export function ExpiringIngredientChip({
  emoji,
  name,
  selected,
  onPress,
}: ExpiringIngredientChipProps) {
  const selectionAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(selectionAnim, {
      toValue: selected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [selected, selectionAnim]);

  const borderColor = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.teal],
  });

  const borderWidth = selectionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
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
        <Animated.View style={[styles.chip, { borderColor, borderWidth }]}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={[styles.name, selected && styles.nameSelected]}>{name}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  nameSelected: {
    color: colors.textPrimary,
  },
});
