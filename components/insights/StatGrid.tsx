import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/theme';

interface StatGridProps {
  itemsSaved: number;
  mealsSaved: number;
  pantryValue: number;
  avgShelfLifeUsedPercent: number;
}

export default function StatGrid({
  itemsSaved,
  mealsSaved,
  pantryValue,
  avgShelfLifeUsedPercent,
}: StatGridProps) {
  const formattedValue = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(pantryValue);

  return (
    <View style={styles.gridContainer}>
      <View style={styles.row}>
        {/* Cell 1: Items Saved */}
        <View style={styles.cell}>
          <Text style={styles.number}>{itemsSaved}</Text>
          <Text style={styles.label}>items saved</Text>
        </View>

        {/* Cell 2: Meals Saved */}
        <View style={styles.cell}>
          <Text style={styles.number}>{mealsSaved}</Text>
          <Text style={styles.label}>meals saved</Text>
        </View>
      </View>

      <View style={styles.row}>
        {/* Cell 3: Pantry Value */}
        <View style={styles.cell}>
          <Text style={styles.number}>₹{formattedValue}</Text>
          <Text style={styles.label}>pantry value</Text>
        </View>

        {/* Cell 4: Average Shelf Use */}
        <View style={styles.cell}>
          <Text style={styles.number}>{avgShelfLifeUsedPercent}%</Text>
          <Text style={styles.label}>avg shelf-life used</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: '100%',
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  number: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.teal,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    color: colors.textGrey,
    fontFamily: 'System',
  },
});
