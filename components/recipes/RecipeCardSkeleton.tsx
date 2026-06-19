import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/theme';

interface RecipeCardSkeletonProps {
  shimmer: Animated.Value;
}

function SkeletonCard({ shimmer }: RecipeCardSkeletonProps) {
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-160, 160],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.splitRow}>
          <View style={styles.left}>
            <View style={styles.titleLine} />
            <View style={styles.urgencyLine} />
            <View style={styles.tagsRow}>
              <View style={styles.tag} />
              <View style={styles.tag} />
              <View style={styles.tagWide} />
            </View>
            <View style={styles.metaLine} />
          </View>
          <View style={styles.imageBlock} />
        </View>
        <Animated.View
          style={[styles.shimmer, { transform: [{ translateX }] }]}
          pointerEvents="none"
        />
      </View>
      <View style={styles.actions}>
        <View style={styles.actionBlock} />
        <View style={styles.actionBlockShort} />
      </View>
    </View>
  );
}

interface RecipeCardSkeletonListProps {
  count?: number;
}

export function RecipeCardSkeleton({ count = 3 }: RecipeCardSkeletonListProps) {
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
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} shimmer={shimmer} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  wrap: {
    marginBottom: 0,
  },
  card: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 14,
    overflow: 'hidden',
  },
  splitRow: {
    flexDirection: 'row',
  },
  left: {
    flex: 13,
    paddingRight: 10,
    gap: 8,
  },
  titleLine: {
    height: 14,
    width: '75%',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  urgencyLine: {
    height: 10,
    width: '45%',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    width: 52,
    height: 22,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  tagWide: {
    width: 68,
    height: 22,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  metaLine: {
    height: 10,
    width: '80%',
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  imageBlock: {
    flex: 7,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: colors.border,
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
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBlock: {
    width: 96,
    height: 32,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  actionBlockShort: {
    width: 72,
    height: 32,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
});
