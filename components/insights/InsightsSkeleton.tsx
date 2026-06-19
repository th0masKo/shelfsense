import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/theme';

export default function InsightsSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Shimmer Block 1: Hero Card */}
      <Animated.View style={[styles.heroCard, { opacity: pulseAnim }]} />

      {/* Shimmer Block 2: Grid Cards (2x2) */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <Animated.View style={[styles.gridCell, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.gridCell, { opacity: pulseAnim }]} />
        </View>
        <View style={styles.gridRow}>
          <Animated.View style={[styles.gridCell, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.gridCell, { opacity: pulseAnim }]} />
        </View>
      </View>

      {/* Shimmer Block 3: Chart Card */}
      <Animated.View style={[styles.chartCard, { opacity: pulseAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: colors.bg,
    gap: 20,
  },
  heroCard: {
    height: 120,
    backgroundColor: colors.secondary,
    borderRadius: 14,
  },
  gridContainer: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridCell: {
    flex: 1,
    height: 80,
    backgroundColor: colors.secondary,
    borderRadius: 12,
  },
  chartCard: {
    height: 240,
    backgroundColor: colors.secondary,
    borderRadius: 14,
  },
});
