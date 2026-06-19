import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { colors } from '../../constants/theme';
import { mockInsightsData, MOCK_MONTHS } from '../../mocks/mockInsightsData';
import MonthPicker from '../../components/insights/MonthPicker';
import HeroStatCard from '../../components/insights/HeroStatCard';
import StatGrid from '../../components/insights/StatGrid';
import TrendChart from '../../components/insights/TrendChart';
import CategoryBreakdown from '../../components/insights/CategoryBreakdown';
import ShareButton from '../../components/insights/ShareButton';
import InsightsSkeleton from '../../components/insights/InsightsSkeleton';

export default function InsightsScreen() {
  const [selectedMonth, setSelectedMonth] = useState(MOCK_MONTHS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const shareViewRef = useRef<View>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const cycleMonth = () => {
    const currentIndex = MOCK_MONTHS.indexOf(selectedMonth);
    const nextIndex = (currentIndex + 1) % MOCK_MONTHS.length;
    setSelectedMonth(MOCK_MONTHS[nextIndex]);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      // Small delay to ensure button animation state settles before capture
      await new Promise(resolve => setTimeout(resolve, 100));

      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 0.9,
      });

      await Share.share(
        Platform.OS === 'ios'
          ? {
              url: uri,
              message: `Check out my ShelfSense pantry insights report for ${selectedMonth}!`,
            }
          : {
              message: `Check out my ShelfSense pantry insights report for ${selectedMonth}! ${uri}`,
            }
      );
    } catch (error) {
      console.error('Failed to capture and share screen:', error);
      Alert.alert('Sharing Error', 'Unable to generate shareable image.');
    } finally {
      setIsSharing(false);
    }
  };

  // Get active month's mock data
  const data = mockInsightsData[selectedMonth];

  if (isLoading) {
    return <InsightsSkeleton />;
  }

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
            <MonthPicker selectedMonth={selectedMonth} onPress={cycleMonth} />
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
            month={selectedMonth}
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
});
