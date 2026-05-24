import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { colors, fonts } from '../../constants/theme';
import type { PantryItem } from '../../types/pantry';
import { PantryItemCard } from './PantryItemCard';

const SWIPE_LEFT_MAX = -148;
const SWIPE_RIGHT_MAX = 76;

interface SwipeablePantryRowProps {
  item: PantryItem;
  onPress: () => void;
  onWaste: () => void;
  onUsed: () => void;
  onEdit: () => void;
}

export function SwipeablePantryRow({
  item,
  onPress,
  onWaste,
  onUsed,
  onEdit,
}: SwipeablePantryRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);

  const close = () => {
    startX.current = 0;
    Animated.spring(translateX, {
      toValue: 0,
      damping: 18,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  };

  const snapTo = (value: number) => {
    startX.current = value;
    Animated.spring(translateX, {
      toValue: value,
      damping: 18,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 6,
      onPanResponderGrant: () => {
        translateX.stopAnimation((v) => {
          startX.current = v;
        });
      },
      onPanResponderMove: (_, g) => {
        const next = Math.max(SWIPE_LEFT_MAX, Math.min(SWIPE_RIGHT_MAX, startX.current + g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const next = Math.max(SWIPE_LEFT_MAX, Math.min(SWIPE_RIGHT_MAX, startX.current + g.dx));
        if (next <= SWIPE_LEFT_MAX * 0.45 || g.vx < -0.5) {
          snapTo(SWIPE_LEFT_MAX);
        } else if (next >= SWIPE_RIGHT_MAX * 0.45 || g.vx > 0.5) {
          snapTo(SWIPE_RIGHT_MAX);
        } else {
          close();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => {
            close();
            onEdit();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>✎</Text>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={[styles.actionBtn, styles.wasteBtn]}
          onPress={() => {
            close();
            onWaste();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🗑</Text>
          <Text style={styles.actionLabel}>Waste</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.usedBtn]}
          onPress={() => {
            close();
            onUsed();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>✓</Text>
          <Text style={styles.actionLabel}>Used</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <PantryItemCard item={item} onPress={onPress} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionsRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  spacer: {
    flex: 1,
  },
  actionBtn: {
    width: 74,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  editBtn: {
    backgroundColor: colors.blue,
  },
  wasteBtn: {
    backgroundColor: colors.red,
  },
  usedBtn: {
    backgroundColor: colors.teal,
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.body,
  },
  foreground: {
    backgroundColor: colors.bg,
  },
});
