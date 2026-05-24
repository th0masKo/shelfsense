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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';
import type { ItemStatus } from '../../types/pantry';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.52;

interface FilterBottomSheetProps {
  visible: boolean;
  statusFilter: ItemStatus | 'all';
  categoryFilter: string | 'all';
  categories: string[];
  onClose: () => void;
  onApply: (status: ItemStatus | 'all', category: string | 'all') => void;
}

const STATUS_OPTIONS: { value: ItemStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Active only' },
  { value: 'active', label: 'Active' },
  { value: 'used', label: 'Used' },
  { value: 'wasted', label: 'Wasted' },
];

export function FilterBottomSheet({
  visible,
  statusFilter,
  categoryFilter,
  categories,
  onClose,
  onApply,
}: FilterBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const [draftStatus, setDraftStatus] = React.useState(statusFilter);
  const [draftCategory, setDraftCategory] = React.useState(categoryFilter);

  useEffect(() => {
    if (visible) {
      setDraftStatus(statusFilter);
      setDraftCategory(categoryFilter);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: SHEET_H, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, statusFilter, categoryFilter, backdrop, slideY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: SHEET_H, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdrop }]}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.dim} />
          </Animated.View>
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY: slideY }] },
          ]}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Filters</Text>

          <Text style={styles.sectionLabel}>STATUS</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setDraftStatus(opt.value)}
                style={[styles.chip, draftStatus === opt.value && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, draftStatus === opt.value && styles.chipTextActive]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CATEGORY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setDraftCategory('all')}
                style={[styles.chip, draftCategory === 'all' && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, draftCategory === 'all' && styles.chipTextActive]}
                >
                  All
                </Text>
              </Pressable>
              {categories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setDraftCategory(cat)}
                  style={[styles.chip, draftCategory === cat && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, draftCategory === cat && styles.chipTextActive]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Pressable
            style={styles.applyBtn}
            onPress={() => {
              onApply(draftStatus, draftCategory);
              handleClose();
            }}
          >
            <Text style={styles.applyText}>Apply filters</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(44, 44, 42, 0.35)',
  },
  sheet: {
    height: SHEET_H,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textGrey,
    letterSpacing: 0.04 * 11,
    textTransform: 'uppercase',
    fontFamily: fonts.body,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.teal,
  },
  chipText: {
    fontSize: 13,
    color: colors.textGrey,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  applyBtn: {
    marginTop: 28,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.body,
  },
});
