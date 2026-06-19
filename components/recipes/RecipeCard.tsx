import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors, fonts } from '../../constants/theme';
import type { Recipe } from '../../types/recipes';

interface RecipeCardProps {
  recipe: Recipe;
  saved: boolean;
  onSavePress: () => void;
  onFullRecipePress: () => void;
}

function ScaleButton({
  label,
  onPress,
  accent,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }),
      Animated.timing(opacity, { toValue: 0.85, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
      Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View
        style={[
          styles.actionBtn,
          accent && styles.actionBtnAccent,
          { transform: [{ scale }], opacity },
        ]}
      >
        <Text style={[styles.actionBtnText, accent && styles.actionBtnTextAccent]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function RecipeCard({ recipe, saved, onSavePress, onFullRecipePress }: RecipeCardProps) {
  const allIngredients = [
    ...recipe.ingredients_used.map((name) => ({ name, matched: true })),
    ...recipe.ingredients_needed.map((name) => ({ name, matched: false })),
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.splitRow}>
          <View style={styles.left}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title}
            </Text>

            {recipe.uses_expiring_item && (
              <View style={styles.urgencyRow}>
                <View style={styles.urgencyDot} />
                <Text style={styles.urgencyText}>Uses expiring item</Text>
              </View>
            )}

            <View style={styles.tags}>
              {allIngredients.map((ing, idx) => (
                <View
                  key={`${recipe.id}-${ing.matched ? 'used' : 'needed'}-${idx}-${ing.name}`}
                  style={[styles.tag, ing.matched ? styles.tagMatched : styles.tagMissing]}
                >
                  <Text
                    style={[styles.tagText, ing.matched ? styles.tagTextMatched : styles.tagTextMissing]}
                  >
                    {ing.name}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.meta}>
              ⏱ {recipe.time_minutes} min · 🔥 {recipe.servings} servings · {recipe.difficulty}
            </Text>
          </View>

          <View style={styles.right}>
            <View style={styles.imagePlaceholder}>
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                  <LinearGradient id={`recipeGrad-${recipe.id}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#F1EFE8" />
                    <Stop offset="1" stopColor="#E5E0D4" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#recipeGrad-${recipe.id})`} rx="10" />
              </Svg>
              <Text style={styles.imageEmoji}>🍽️</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <ScaleButton label="↗ Full recipe" onPress={onFullRecipePress} accent />
        <ScaleButton label={saved ? '♥ Saved' : '♡ Save'} onPress={onSavePress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: 14,
    ...{
      shadowColor: colors.textPrimary,
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  left: {
    flex: 13,
    paddingRight: 10,
  },
  right: {
    flex: 7,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.body,
    marginBottom: 6,
    lineHeight: 20,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.red,
    fontFamily: fonts.body,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagMatched: {
    backgroundColor: colors.tealLight,
  },
  tagMissing: {
    backgroundColor: colors.secondary,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  tagTextMatched: {
    color: colors.teal,
  },
  tagTextMissing: {
    color: colors.textGrey,
  },
  meta: {
    fontSize: 12,
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  imagePlaceholder: {
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageEmoji: {
    fontSize: 28,
    opacity: 0.45,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  actionBtnAccent: {
    backgroundColor: colors.tealLight,
    borderColor: colors.teal,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  actionBtnTextAccent: {
    color: colors.teal,
  },
});
