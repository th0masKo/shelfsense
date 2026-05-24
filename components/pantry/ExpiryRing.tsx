import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../constants/theme';
import type { Urgency } from '../../types/pantry';
import { urgencyAccentColor } from '../../lib/pantry-utils';

interface ExpiryRingProps {
  daysLeft: number;
  label: string;
  urgency: Urgency;
  referenceDays?: number;
}

const SIZE = 96;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ExpiryRing({
  daysLeft,
  label,
  urgency,
  referenceDays = 30,
}: ExpiryRingProps) {
  const progress = Math.max(0, Math.min(1, daysLeft / referenceDays));
  const strokeColor = urgencyAccentColor(urgency);
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={strokeColor}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.days, { color: strokeColor }]}>
          {daysLeft < 0 ? '0' : daysLeft}
        </Text>
        <Text style={styles.daysLabel}>days</Text>
        <Text style={styles.sublabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignSelf: 'center',
    marginVertical: 16,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  days: {
    fontSize: 28,
    fontFamily: fonts.display,
    fontWeight: '600',
    lineHeight: 30,
  },
  daysLabel: {
    fontSize: 11,
    color: colors.textGrey,
    fontFamily: fonts.body,
    marginTop: -2,
  },
  sublabel: {
    fontSize: 10,
    color: colors.textGrey,
    fontFamily: fonts.body,
    marginTop: 4,
    textAlign: 'center',
  },
});
