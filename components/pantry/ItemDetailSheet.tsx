import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';
import type { PantryItem } from '../../types/pantry';
import {
  daysUntilExpiry,
  formatExpiryBadge,
  getUrgency,
} from '../../lib/pantry-utils';
import { ExpiryRing } from './ExpiryRing';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.75;

interface ItemDetailSheetProps {
  item: PantryItem | null;
  visible: boolean;
  onRequestClose: () => void;
  onClosed: () => void;
  onMarkUsed: (item: PantryItem) => void;
  onLogWaste: (item: PantryItem) => void;
  onEdit: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
  onGetRecipes: () => void;
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function storageLabel(storage: PantryItem['storage']): string {
  const map: Record<PantryItem['storage'], string> = {
    fridge: 'Fridge',
    freezer: 'Freezer',
    pantry: 'Pantry shelf',
    produce: 'Produce',
    spices: 'Spices',
    drinks: 'Drinks',
  };
  return map[storage];
}

export function ItemDetailSheet({
  item,
  visible,
  onRequestClose,
  onClosed,
  onMarkUsed,
  onLogWaste,
  onEdit,
  onDelete,
  onGetRecipes,
}: ItemDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const runCloseAnimation = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: SHEET_H, duration: 240, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) callback?.();
    });
  };

  useEffect(() => {
    if (visible && item) {
      slideY.setValue(SHEET_H);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideY, {
          toValue: 0,
          damping: 20,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (!visible && item) {
      runCloseAnimation(onClosed);
    }
  }, [visible, item, backdrop, slideY, onClosed]);

  const handleClose = () => {
    onRequestClose();
  };

  if (!item) return null;

  const daysLeft = daysUntilExpiry(item.expiryDate);
  const urgency = getUrgency(daysLeft);

  return (
    <Modal visible={!!item} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
            <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.dim} />
          </Animated.View>
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: SHEET_H,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateY: slideY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.name}>{item.name}</Text>

            <ExpiryRing
              daysLeft={daysLeft}
              label={formatExpiryBadge(daysLeft)}
              urgency={urgency}
            />

            <View style={styles.infoBlock}>
              <InfoRow label="Quantity" value={item.quantity} />
              <InfoRow label="Category" value={item.category} />
              <InfoRow label="Expires" value={formatDisplayDate(item.expiryDate)} />
              <InfoRow label="Added" value={formatDisplayDate(item.addedDate)} />
              <InfoRow label="Stored in" value={storageLabel(item.storage)} />
              {item.estCost != null && (
                <InfoRow label="Est. cost" value={`₹${item.estCost}`} />
              )}
            </View>

            <View style={styles.actionsRow}>
              <ActionChip label="Mark Used" icon="✓" onPress={() => onMarkUsed(item)} />
              <ActionChip label="Log Waste" icon="🗑" onPress={() => onLogWaste(item)} />
              <ActionChip label="Edit" icon="✎" onPress={() => onEdit(item)} />
              <ActionChip label="Delete" icon="✕" destructive onPress={() => onDelete(item)} />
            </View>

            <Pressable onPress={onGetRecipes} style={styles.recipeLink}>
              <Text style={styles.recipeLinkText}>Get recipe ideas →</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionChip({
  label,
  icon,
  onPress,
  destructive,
}: {
  label: string;
  icon: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.actionChip, destructive && styles.actionChipDestructive]}
    >
      <Text style={styles.actionChipIcon}>{icon}</Text>
      <Text style={[styles.actionChipLabel, destructive && { color: colors.red }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 44, 42, 0.4)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2A',
        shadowOpacity: 0.12,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 12 },
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  scroll: {
    paddingBottom: 16,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  infoBlock: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  actionChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  actionChipDestructive: {
    backgroundColor: colors.redLight,
  },
  actionChipIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
  },
  recipeLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  recipeLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.teal,
    fontFamily: fonts.body,
  },
});
