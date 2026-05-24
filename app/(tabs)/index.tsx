import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePantryItems } from '../../hooks/usePantryItems';
import {
  getActiveItems,
  getComingUpItems,
  getExpiringSoonCount,
  getNeedsAttentionItems,
  hasCriticalExpiry,
  type DashboardListItem,
} from '../../lib/dashboard-items';
import { PantrySkeleton } from '../../components/PantrySkeleton';
import { ErrorBanner } from '../../components/ErrorBanner';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:          '#FAFAF8',
  surface:     '#FFFFFF',
  secondary:   '#F1EFE8',
  textPrimary: '#2C2C2A',
  textGrey:    '#888780',
  border:      '#E5E3DC',
  teal:        '#1D9E75',
  tealLight:   '#E8F5F0',
  amber:       '#BA7517',
  amberLight:  '#FDF3E3',
  red:         '#A32D2D',
  redLight:    '#FAEAEA',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function borderColor(u: DashboardListItem['urgency']): string {
  if (u === 'critical') return C.red;
  if (u === 'warning')  return C.amber;
  return C.teal;
}

function badgeBg(u: DashboardListItem['urgency']): string {
  if (u === 'critical') return C.redLight;
  if (u === 'warning')  return C.amberLight;
  return C.tealLight;
}

function badgeColor(u: DashboardListItem['urgency']): string {
  if (u === 'critical') return C.red;
  if (u === 'warning')  return C.amber;
  return C.teal;
}

// ─── AnimatedCard: staggered fade + slide using RN Animated ──────────────────
function AnimatedCard({
  item,
  index,
}: {
  item: DashboardListItem;
  index: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 60,
        damping: 16,
        stiffness: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View style={[styles.itemCard, { borderLeftColor: borderColor(item.urgency) }]}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>{item.emoji}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.quantity} · {item.category}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeBg(item.urgency) }]}>
          <Text style={[styles.badgeText, { color: badgeColor(item.urgency) }]}>
            {item.badge}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.statCard, accent && styles.statCardAccent]}>
      <Text style={[styles.statValue, accent && { color: C.teal }]}>{value}</Text>
      <Text style={[styles.statLabel, accent && { color: C.teal }]}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { data: pantryItems = [], isLoading, isError, error, refetch } = usePantryItems();

  const activeItems = useMemo(() => getActiveItems(pantryItems), [pantryItems]);
  const needsAttention = useMemo(() => getNeedsAttentionItems(pantryItems), [pantryItems]);
  const comingUp = useMemo(() => getComingUpItems(pantryItems), [pantryItems]);
  const expiringSoonCount = useMemo(() => getExpiringSoonCount(pantryItems), [pantryItems]);
  const showBellDot = useMemo(() => hasCriticalExpiry(pantryItems), [pantryItems]);

  // FAB spring animation using RN Animated
  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      delay: 400,
      damping: 14,
      stiffness: 110,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {isError && (
          <ErrorBanner
            message={error instanceof Error ? error.message : 'Could not load pantry items.'}
            onRetry={() => refetch()}
          />
        )}

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.title}>Your pantry</Text>
          </View>
          <TouchableOpacity style={styles.bell} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color={C.textPrimary} />
            {showBellDot && <View style={styles.bellDot} />}
          </TouchableOpacity>
        </View>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            value={isLoading ? '—' : String(activeItems.length)}
            label="Total items"
          />
          <StatCard
            value={isLoading ? '—' : String(expiringSoonCount)}
            label="Expiring soon"
            accent
          />
          <StatCard value="—" label="Saved / month" />
        </View>

        {isLoading ? (
          <PantrySkeleton count={3} />
        ) : (
          <>
            {/* ── Needs Attention ────────────────────────────────────────── */}
            {needsAttention.length > 0 && (
              <>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Needs attention</Text>
                  <TouchableOpacity onPress={() => router.push('/recipes')} activeOpacity={0.6}>
                    <Text style={styles.sectionLink}>Get recipes →</Text>
                  </TouchableOpacity>
                </View>
                {needsAttention.map((item, i) => (
                  <AnimatedCard key={item.id} item={item} index={i} />
                ))}
              </>
            )}

            {/* ── Coming up ──────────────────────────────────────────────── */}
            {comingUp.length > 0 && (
              <>
                <View style={[styles.sectionRow, { marginTop: needsAttention.length > 0 ? 24 : 0 }]}>
                  <Text style={styles.sectionTitle}>Coming up</Text>
                </View>
                {comingUp.map((item, i) => (
                  <AnimatedCard key={item.id} item={item} index={needsAttention.length + i} />
                ))}
              </>
            )}

            {/* Ghost "View all" button */}
            {activeItems.length > 0 && (
              <TouchableOpacity
                style={styles.ghostBtn}
                onPress={() => router.push('/pantry')}
                activeOpacity={0.7}
              >
                <Text style={styles.ghostBtnText}>
                  View all {activeItems.length} items →
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/scan')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 13,
    color: C.textGrey,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
    borderWidth: 1.5,
    borderColor: C.secondary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statCardAccent: {
    backgroundColor: C.tealLight,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: C.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: C.textGrey,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Section header row
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '500',
    color: C.teal,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Item card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#2C2C2A',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 1 },
    }),
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  itemMeta: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  itemSub: {
    fontSize: 12,
    color: C.textGrey,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // Ghost button
  ghostBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textGrey,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.teal,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: C.teal,
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
});
