import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { colors } from '../../constants/theme';
import { useInsightsData, formatMonthYear } from '../../hooks/useInsightsData';
import MonthPicker from '../../components/insights/MonthPicker';
import HeroStatCard from '../../components/insights/HeroStatCard';
import StatGrid from '../../components/insights/StatGrid';
import TrendChart from '../../components/insights/TrendChart';
import CategoryBreakdown from '../../components/insights/CategoryBreakdown';
import ShareButton from '../../components/insights/ShareButton';
import InsightsSkeleton from '../../components/insights/InsightsSkeleton';

const AVAILABLE_MONTHS = (() => {
  const months: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }
  return months;
})();

export default function InsightsScreen() {
  const [selectedMonthDate, setSelectedMonthDate] = useState(AVAILABLE_MONTHS[0]);
  const [isSharing, setIsSharing] = useState(false);
  const shareViewRef = useRef<View>(null);

  const { data, isLoading, isError, error, refetch } = useInsightsData(selectedMonthDate);

  const cycleMonth = () => {
    const currentIndex = AVAILABLE_MONTHS.findIndex(
      d => d.getFullYear() === selectedMonthDate.getFullYear() && d.getMonth() === selectedMonthDate.getMonth()
    );
    const nextIndex = (currentIndex + 1) % AVAILABLE_MONTHS.length;
    setSelectedMonthDate(AVAILABLE_MONTHS[nextIndex]);
  };

  const handleShare = async () => {
    if (isSharing || !data) return;
    setIsSharing(true);
    try {
      // Small delay to ensure button animation state settles before capture
      await new Promise(resolve => setTimeout(resolve, 100));

      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 0.9,
      });

      const selectedMonthStr = formatMonthYear(selectedMonthDate);
      await Share.share(
        Platform.OS === 'ios'
          ? {
              url: uri,
              message: `Check out my ShelfSense pantry insights report for ${selectedMonthStr}!`,
            }
          : {
              message: `Check out my ShelfSense pantry insights report for ${selectedMonthStr}! ${uri}`,
            }
      );
    } catch (err) {
      console.error('Failed to capture and share screen:', err);
      Alert.alert('Sharing Error', 'Unable to generate shareable image.');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Couldn't load insights</Text>
          <Text style={styles.emptySub}>
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </Text>
          {__DEV__ && error != null && (
            <Text style={styles.debugError}>
              {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
            </Text>
          )}
          <TouchableOpacity
            style={styles.emptyCta}
            onPress={() => refetch()}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyCtaText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedMonthStr = formatMonthYear(selectedMonthDate);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* 
          We capture only this container, leaving out the Share button itself 
          for a clean, professional shared image card!
        */}
        <View ref={shareViewRef} collapsable={false} style={styles.captureContainer}>
          {/* Header row */}
          <View style={styles.header}>
            <Text style={styles.title}>Insights</Text>
            <MonthPicker selectedMonth={selectedMonthStr} onPress={cycleMonth} />
          </View>

          {/* Hero Card */}
          <HeroStatCard
            totalSaved={data.heroStat.totalSavedThisYear}
            percentVsLastMonth={data.heroStat.percentVsLastMonth}
          />

          {/* Stats Grid */}
          <StatGrid
            itemsSaved={data.statGrid.itemsSaved}
            mealsSaved={data.statGrid.mealsSaved}
            pantryValue={data.statGrid.pantryValue}
            avgShelfLifeUsedPercent={data.statGrid.avgShelfLifeUsedPercent}
          />

          {/* Monthly Trend Chart */}
          <TrendChart trend={data.trend} />

          {/* Category Breakdown */}
          <CategoryBreakdown categories={data.categoryBreakdown} />
        </View>

        {/* Share Button (Outside captured view, inside scrollview) */}
        <View style={styles.buttonContainer}>
          <ShareButton
            month={selectedMonthStr}
            onPress={handleShare}
            isSharing={isSharing}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingBottom: 40,
  },
  captureContainer: {
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 20,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.bg,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textGrey,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    height: 54,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.teal,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

