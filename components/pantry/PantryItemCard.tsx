import React from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { colors, fonts } from '../../constants/theme';
import type { PantryItem } from '../../types/pantry';
import {
  daysUntilExpiry,
  formatExpiryBadge,
  getUrgency,
  urgencyBadgeBg,
  urgencyBadgeText,
  urgencyBorderColor,
} from '../../lib/pantry-utils';

interface PantryItemCardProps {
  item: PantryItem;
  onPress: () => void;
}

export function PantryItemCard({ item, onPress }: PantryItemCardProps) {
  const daysLeft = daysUntilExpiry(item.expiryDate);
  const urgency = getUrgency(daysLeft);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: urgencyBorderColor(urgency) },
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.left}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.meta}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sub}>
            {item.quantity} · {item.category}
          </Text>
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: urgencyBadgeBg(urgency) }]}>
        <Text style={[styles.badgeText, { color: urgencyBadgeText(urgency) }]}>
          {formatExpiryBadge(daysLeft)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2A',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 1 },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  sub: {
    fontSize: 12,
    color: colors.textGrey,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
});
