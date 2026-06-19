import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

interface MonthPickerProps {
  selectedMonth: string;
  onPress: () => void;
}

export default function MonthPicker({ selectedMonth, onPress }: MonthPickerProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.text}>{selectedMonth} ↓</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: 'System',
  },
});
