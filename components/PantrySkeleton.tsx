import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { colors } from '../constants/theme';

interface PantrySkeletonProps {
  count?: number;
}

function SkeletonCard({ shimmer }: { shimmer: Animated.Value }) {
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.emoji} />
        <View style={styles.lines}>
          <View style={styles.lineShort} />
          <View style={styles.lineLong} />
        </View>
        <View style={styles.badge} />
      </View>
      <Animated.View
        style={[styles.shimmer, { transform: [{ translateX }] }]}
        pointerEvents="none"
      />
    </View>
  );
}

export function PantrySkeleton({ count = 3 }: PantrySkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} shimmer={shimmer} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.border,
    marginRight: 10,
  },
  lines: {
    flex: 1,
    gap: 6,
  },
  lineShort: {
    height: 10,
    width: '45%',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  lineLong: {
    height: 8,
    width: '65%',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  badge: {
    width: 64,
    height: 22,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginLeft: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.45)',
    opacity: 0.9,
    ...Platform.select({
      ios: {},
      android: {},
    }),
  },
});
