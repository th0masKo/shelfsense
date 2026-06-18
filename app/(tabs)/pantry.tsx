import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import SuccessToast from '../../components/scan/SuccessToast';
import { useQueryClient } from '@tanstack/react-query';
import { colors, fonts } from '../../constants/theme';
import { usePantryItems, PANTRY_ITEMS_QUERY_KEY } from '../../hooks/usePantryItems';
import { updatePantryItemStatus, deletePantryItem } from '../../lib/pantry-mutations';
import { PantrySkeleton } from '../../components/PantrySkeleton';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  CATEGORY_CHIPS,
  SORT_OPTIONS,
  SECTION_LABELS,
  filterItems,
  groupBySection,
  sortItems,
} from '../../lib/pantry-utils';
import type { ItemStatus, PantryItem, SortMode, StorageLocation } from '../../types/pantry';
import { AnimatedListItem } from '../../components/pantry/AnimatedListItem';
import { SwipeablePantryRow } from '../../components/pantry/SwipeablePantryRow';
import { ItemDetailSheet } from '../../components/pantry/ItemDetailSheet';
import { FilterBottomSheet } from '../../components/pantry/FilterBottomSheet';

function sortLabel(mode: SortMode): string {
  const found = SORT_OPTIONS.find((o) => o.mode === mode);
  if (!found) return 'Expiry (soonest)';
  if (mode === 'expiry_asc') return 'Expiry ↑';
  if (mode === 'expiry_desc') return 'Expiry ↓';
  return found.label;
}

export default function PantryScreen() {
  const router = useRouter();
  const { toastMessage: toastMessageParam } = useLocalSearchParams<{ toastMessage?: string }>();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof toastMessageParam === 'string' && toastMessageParam.length > 0) {
      setToastMessage(toastMessageParam);
      router.setParams({ toastMessage: undefined });
    }
  }, [toastMessageParam, router]);
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, isError, error, refetch } = usePantryItems();
  const [search, setSearch] = useState('');
  const [storageFilter, setStorageFilter] = useState<'all' | StorageLocation>('all');
  const [sortMode, setSortMode] = useState<SortMode>('expiry_asc');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<PantryItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort(),
    [items],
  );

  const filtered = useMemo(
    () => filterItems(items, search, storageFilter, statusFilter, categoryFilter),
    [items, search, storageFilter, statusFilter, categoryFilter],
  );

  const sorted = useMemo(() => sortItems(filtered, sortMode), [filtered, sortMode]);

  const grouped = useMemo(() => {
    if (sortMode !== 'expiry_asc') return null;
    return groupBySection(sorted);
  }, [sorted, sortMode]);

  const cycleSort = () => {
    const idx = SORT_OPTIONS.findIndex((o) => o.mode === sortMode);
    const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length];
    setSortMode(next.mode);
  };

  const openDetail = useCallback((item: PantryItem) => {
    setDetailItem(item);
    setDetailVisible(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
  }, []);

  const handleDetailClosed = useCallback(() => {
    setDetailVisible(false);
    setDetailItem(null);
  }, []);

  const updateItemStatus = async (id: string, status: ItemStatus) => {
    await updatePantryItemStatus(id, status);
    await queryClient.invalidateQueries({ queryKey: PANTRY_ITEMS_QUERY_KEY });
    closeDetail();
  };

  const removeItem = async (id: string) => {
    await deletePantryItem(id);
    await queryClient.invalidateQueries({ queryKey: PANTRY_ITEMS_QUERY_KEY });
    closeDetail();
  };

  let animIndex = 0;

  const renderItem = (item: PantryItem) => {
    const idx = animIndex;
    animIndex += 1;
    return (
      <AnimatedListItem key={item.id} index={idx}>
        <SwipeablePantryRow
          item={item}
          onPress={() => openDetail(item)}
          onWaste={() => updateItemStatus(item.id, 'wasted')}
          onUsed={() => updateItemStatus(item.id, 'used')}
          onEdit={() => openDetail(item)}
        />
      </AnimatedListItem>
    );
  };

  const isEmpty = !isLoading && !isError && filtered.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <SuccessToast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {isError && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Could not load pantry items.'}
            onRetry={() => refetch()}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pantry</Text>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>#{filtered.length} items</Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchWrap,
            searchFocused && styles.searchWrapFocused,
          ]}
        >
          <Ionicons name="search" size={18} color={colors.textGrey} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search milk, spinach…"
            placeholderTextColor={colors.textGrey}
            style={styles.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsContainer}
        >
          {CATEGORY_CHIPS.map((chip) => {
            const active = storageFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                onPress={() => setStorageFilter(chip.key)}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort / filter row */}
        <View style={styles.sortRow}>
          <TouchableOpacity onPress={cycleSort} activeOpacity={0.6}>
            <Text style={styles.sortText}>
              Sort: <Text style={styles.sortValue}>{sortLabel(sortMode)}</Text>
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* List or empty */}
        {isLoading ? (
          <PantrySkeleton count={3} />
        ) : isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🫙</Text>
            <Text style={styles.emptyTitle}>Your pantry is empty</Text>
            <Text style={styles.emptySub}>
              Tap the + button to add your first item.
            </Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push('/scan')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyCtaText}>Add item</Text>
            </TouchableOpacity>
          </View>
        ) : grouped ? (
          grouped.map((group) => (
            <View key={group.section} style={styles.section}>
              <Text style={styles.sectionHeader}>{SECTION_LABELS[group.section]}</Text>
              {group.items.map((item) => renderItem(item))}
            </View>
          ))
        ) : (
          <View style={styles.section}>{sorted.map((item) => renderItem(item))}</View>
        )}
      </ScrollView>

      <ItemDetailSheet
        item={detailItem}
        visible={detailVisible}
        onRequestClose={closeDetail}
        onClosed={handleDetailClosed}
        onMarkUsed={(item) => updateItemStatus(item.id, 'used')}
        onLogWaste={(item) => updateItemStatus(item.id, 'wasted')}
        onEdit={() => {
          /* Edit flow — scan/manual in a later screen */
        }}
        onDelete={(item) => removeItem(item.id)}
        onGetRecipes={() => {
          closeDetail();
          router.push('/recipes');
        }}
      />

      <FilterBottomSheet
        visible={filterVisible}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        categories={categories}
        onClose={() => setFilterVisible(false)}
        onApply={(status, category) => {
          setStatusFilter(status);
          setCategoryFilter(category);
          setFilterVisible(false);
        }}
      />
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.display,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  countChip: {
    backgroundColor: colors.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
    fontFamily: fonts.body,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    marginBottom: 14,
    minHeight: 44,
  },
  searchWrapFocused: {
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fonts.body,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  clearBtn: {
    paddingHorizontal: 14,
  },
  clearText: {
    fontSize: 14,
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  chipsContainer: {
    marginBottom: 14,
    marginHorizontal: -20,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
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
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sortText: {
    fontSize: 13,
    color: colors.textGrey,
    fontFamily: fonts.body,
  },
  sortValue: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textGrey,
    letterSpacing: 0.04 * 11,
    textTransform: 'uppercase',
    fontFamily: fonts.body,
    marginBottom: 10,
    marginTop: 4,
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
