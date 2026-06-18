import React from 'react';
import { ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts } from '../../constants/theme';
import { SCAN_CATEGORIES, type PantryCategoryId } from '../../constants/scanCategories';

interface CategoryChipsProps {
  value: PantryCategoryId | '';
  onChange: (id: PantryCategoryId) => void;
  hasError?: boolean;
}

export function CategoryChips({ value, onChange, hasError }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SCAN_CATEGORIES.map((cat) => {
        const active = value === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              active && styles.chipActive,
              hasError && !active && styles.chipError,
            ]}
            onPress={() => onChange(cat.id)}
            activeOpacity={0.85}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipError: {
    borderColor: colors.red,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
});

export default CategoryChips;
