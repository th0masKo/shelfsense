import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import { colors } from '../../constants/theme';
import { MonthlyTrend } from '../../mocks/mockInsightsData';

interface TrendChartProps {
  trend: MonthlyTrend[];
}

export default function TrendChart({ trend }: TrendChartProps) {
  // Staggered animated values for 6 bars
  const animationValues = useRef(Array(6).fill(0).map(() => new Animated.Value(0))).current;
  const [animatedData, setAnimatedData] = useState<number[][]>(() => Array(6).fill([0, 0]));

  useEffect(() => {
    // Reset values to 0
    animationValues.forEach(val => val.setValue(0));

    // Map to Animated.timing tasks
    const animations = animationValues.map((val, idx) =>
      Animated.timing(val, {
        toValue: 1,
        duration: 500,
        delay: idx * 50,
        useNativeDriver: false, // Update React state in listener
      })
    );

    // Setup listeners to update chart data state
    const listeners = animationValues.map((val, idx) =>
      val.addListener(({ value }) => {
        setAnimatedData(prev => {
          const next = [...prev];
          const targetWasted = trend[idx]?.wasted ?? 0;
          const targetSaved = trend[idx]?.saved ?? 0;
          next[idx] = [targetWasted * value, targetSaved * value];
          return next;
        });
      })
    );

    Animated.parallel(animations).start();

    return () => {
      animationValues.forEach((val, idx) => {
        val.removeListener(listeners[idx]);
      });
    };
  }, [trend]);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40 - 32; // minus margins and card padding

  const chartData = {
    labels: trend.map(t => t.month),
    legend: ['Wasted', 'Saved'],
    data: animatedData,
    barColors: ['rgba(163, 45, 45, 0.3)', 'rgba(29, 158, 117, 0.4)'], // red 30%, teal 40%
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(136, 135, 128, ${opacity})`, // colors.textGrey
    labelColor: (opacity = 1) => `rgba(44, 44, 42, ${opacity})`, // colors.textPrimary
    strokeWidth: 2,
    barPercentage: 0.6,
    barRadius: 8, // Rounds top corners of top segment
    useShadowColorFromDataset: false,
    propsForBackgroundLines: {
      strokeDasharray: '4',
      stroke: colors.border,
      strokeWidth: 0.5,
    },
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Waste over time</Text>

      <View style={styles.chartWrapper}>
        <StackedBarChart
          data={chartData}
          width={chartWidth}
          height={200}
          chartConfig={chartConfig}
          hideLegend={true}
          withHorizontalLabels={true}
          withVerticalLabels={true}
          formatYLabel={(y) => `₹${Math.round(Number(y))}`}
          style={styles.chart}
        />
      </View>

      {/* Premium custom legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: 'rgba(29, 158, 117, 0.4)' }]} />
          <Text style={styles.legendText}>Saved</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendIndicator, { backgroundColor: 'rgba(163, 45, 45, 0.3)' }]} />
          <Text style={styles.legendText}>Wasted</Text>
        </View>
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
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    marginLeft: -15, // Align labels nicely
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendIndicator: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.textGrey,
    fontFamily: 'System',
  },
});
