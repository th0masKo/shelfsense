import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface HeroStatCardProps {
  totalSaved: number;
  percentVsLastMonth: number;
}

export default function HeroStatCard({ totalSaved, percentVsLastMonth }: HeroStatCardProps) {
  const isPositive = percentVsLastMonth >= 0;
  const formattedSaved = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(totalSaved);

  return (
    <View style={styles.card}>
      <Text style={styles.value}>₹{formattedSaved}</Text>
      <Text style={styles.label}>saved from waste this year</Text>
      <View style={styles.trendRow}>
        <Text style={[styles.trendText, isPositive ? styles.positiveText : styles.negativeText]}>
          {isPositive ? `↑ ${percentVsLastMonth}%` : `↓ ${Math.abs(percentVsLastMonth)}%`}
          <Text style={styles.trendSubText}> vs last month</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F6E56',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    shadowColor: '#2C2C2A',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2A',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  value: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'System',
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  trendSubText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  positiveText: {
    color: '#A9F0D1',
  },
  negativeText: {
    color: '#FFB3B3',
  },
});
