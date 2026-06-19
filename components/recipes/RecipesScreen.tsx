import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../constants/theme';
import { DIETARY_FILTER_OPTIONS } from '../../data/mockRecipes';
import { useExpiringItems } from '../../hooks/useExpiringItems';
import { useRecipeSuggestions } from '../../hooks/useRecipeSuggestions';
import type { DietaryFilterId } from '../../types/recipes';
import { ErrorBanner } from '../ErrorBanner';
import { AnimatedListItem } from '../pantry/AnimatedListItem';
import { DietaryFilterChip } from './DietaryFilterChip';
import { ExpiringIngredientChip } from './ExpiringIngredientChip';
import { RecipeCard } from './RecipeCard';
import { RecipeCardSkeleton } from './RecipeCardSkeleton';

function LoadingStatusText() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : `${prev}.`));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <Text style={styles.loadingText}>
      Checking your pantry{dots}
    </Text>
  );
}

export function RecipesScreen() {
  const {
    data: expiringItems = [],
    isLoading: isLoadingExpiring,
    isError,
    error,
    refetch,
  } = useExpiringItems();

  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(new Set());
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilterId>('any');
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const knownExpiringIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentIdSet = new Set(expiringItems.map((item) => item.id));

    setSelectedIngredientIds((prev) => {
      if (expiringItems.length === 0) {
        knownExpiringIdsRef.current = new Set();
        return new Set();
      }

      if (knownExpiringIdsRef.current.size === 0 && prev.size === 0) {
        knownExpiringIdsRef.current = currentIdSet;
        return new Set(expiringItems.map((item) => item.id));
      }

      const next = new Set<string>();
      for (const item of expiringItems) {
        const wasKnown = knownExpiringIdsRef.current.has(item.id);
        if (!wasKnown) {
          next.add(item.id);
        } else if (prev.has(item.id)) {
          next.add(item.id);
        }
      }

      knownExpiringIdsRef.current = currentIdSet;
      return next;
    });
  }, [expiringItems]);

  const selectedIngredientNames = useMemo(() => {
    const names: string[] = [];
    for (const ingredient of expiringItems) {
      if (selectedIngredientIds.has(ingredient.id)) {
        names.push(ingredient.name);
      }
    }
    return names;
  }, [expiringItems, selectedIngredientIds]);

  const {
    data: recipes = [],
    isFetching: isFetchingRecipes,
    isError: isRecipeError,
    refetch: refetchRecipes,
  } = useRecipeSuggestions(selectedIngredientNames, dietaryFilter);

  const toggleIngredient = (id: string) => {
    setSelectedIngredientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSaved = (recipeId: string) => {
    setSavedRecipeIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  };

  const showExpiringLoading = isLoadingExpiring;
  const showRecipeLoading =
    !isLoadingExpiring &&
    selectedIngredientNames.length > 0 &&
    isFetchingRecipes;
  const showLoading = showExpiringLoading || showRecipeLoading;
  const noExpiringItems = !isLoadingExpiring && expiringItems.length === 0;
  const noIngredientsSelected =
    !isLoadingExpiring && expiringItems.length > 0 && selectedIngredientIds.size === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {isError && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Could not load expiring items.'}
            onRetry={() => refetch()}
          />
        )}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Recipes</Text>
            <Text style={styles.subhead}>Based on what&apos;s expiring soon</Text>
          </View>
        </View>

        {!noExpiringItems && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.ingredientScroll}
            style={styles.horizontalStrip}
          >
            {expiringItems.map((ingredient) => (
              <ExpiringIngredientChip
                key={ingredient.id}
                emoji={ingredient.emoji}
                name={ingredient.name}
                selected={selectedIngredientIds.has(ingredient.id)}
                onPress={() => toggleIngredient(ingredient.id)}
              />
            ))}
          </ScrollView>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dietaryScroll}
          style={styles.horizontalStrip}
        >
          {DIETARY_FILTER_OPTIONS.map((option) => (
            <DietaryFilterChip
              key={option.id}
              label={option.label}
              selected={dietaryFilter === option.id}
              onPress={() => setDietaryFilter(option.id)}
            />
          ))}
        </ScrollView>

        {showLoading ? (
          <View style={styles.loadingBlock}>
            <LoadingStatusText />
            <RecipeCardSkeleton count={3} />
          </View>
        ) : noExpiringItems ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>Nothing expiring soon</Text>
            <Text style={styles.emptySub}>
              You&apos;re all caught up — check back later.
            </Text>
          </View>
        ) : noIngredientsSelected ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🥗</Text>
            <Text style={styles.emptyTitle}>Pick at least one ingredient</Text>
            <Text style={styles.emptySub}>
              Select expiring items above to see recipe ideas tailored to your pantry.
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() =>
                setSelectedIngredientIds(new Set(expiringItems.map((item) => item.id)))
              }
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>Select all</Text>
            </TouchableOpacity>
          </View>
        ) : isRecipeError && !isFetchingRecipes ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>😕</Text>
            <Text style={styles.emptyTitle}>Couldn&apos;t load recipes right now</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => void refetchRecipes()}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No recipes match</Text>
            <Text style={styles.emptySub}>
              Try a different dietary filter or add more expiring ingredients.
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => setDietaryFilter('any')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>Reset filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.recipeList}>
            {recipes.map((recipe, index) => (
              <AnimatedListItem key={recipe.id} index={index}>
                <RecipeCard
                  recipe={recipe}
                  saved={savedRecipeIds.has(recipe.id)}
                  onSavePress={() => toggleSaved(recipe.id)}
                  onFullRecipePress={() => {
                    /* Full recipe sheet — wired with API later */
                  }}
                />
              </AnimatedListItem>
            ))}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subhead: {
    fontSize: 13,
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  horizontalStrip: {
    marginHorizontal: -20,
    marginBottom: 14,
  },
  ingredientScroll: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  dietaryScroll: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  loadingBlock: {
    gap: 16,
  },
  loadingText: {
    fontSize: 13,
    color: colors.teal,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  recipeList: {
    paddingTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.textGrey,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    height: 54,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.teal,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: fonts.body,
  },
});
