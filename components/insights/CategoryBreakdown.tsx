import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { colors } from '../../constants/theme';
import { CategoryWaste } from '../../mocks/mockInsightsData';

interface CategoryBreakdownProps {
  categories: CategoryWaste[];
}

function CategoryRow({ item, index }: { item: CategoryWaste; index: number }) {
  const rowOpacity = useRef(new Animated.Value(0)).current;
  const rowTranslateY = useRef(new Animated.Value(15)).current;
  const barWidthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations
    rowOpacity.setValue(0);
    rowTranslateY.setValue(15);
    barWidthAnim.setValue(0);

    Animated.parallel([
      Animated.timing(rowOpacity, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(rowTranslateY, {
        toValue: 0,
        delay: index * 60,
        damping: 15,
        stiffness: 100,
        useNativeDriver: true,
      }),
      Animated.timing(barWidthAnim, {
        toValue: 1,
        duration: 700,
        delay: index * 60 + 150,
        useNativeDriver: false, // width style property can't use native driver
      }),
    ]).start();
  }, [item]);

  const animatedWidth = barWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${item.percent}%`],
  });

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: rowOpacity,
          transform: [{ translateY: rowTranslateY }],
        },
      ]}
    >
      <View style={styles.catInfo}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {item.category}
        </Text>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: animatedWidth,
            },
          ]}
        />
      </View>

      <Text style={styles.percent}>{item.percent}%</Text>
    </Animated.View>
  );
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  // Sort descending and take top 5
  const topCategories = [...categories]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Most wasted categories</Text>

      <View style={styles.listContainer}>
        {topCategories.map((item, index) => (
          <CategoryRow
            key={`${item.category}-${index}`}
            item={item}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2A',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 1 },
    }),
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'System',
    marginBottom: 16,
  },
  listContainer: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    gap: 8,
  },
  emoji: {
    fontSize: 18,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: 'System',
  },
  track: {
    flex: 2,
    height: 8,
    backgroundColor: colors.secondary,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  percent: {
    width: 36,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
    color: colors.textGrey,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
