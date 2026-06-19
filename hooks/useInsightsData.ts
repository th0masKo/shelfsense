import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { categoryEmoji } from '../lib/map-pantry-item';
import { SCAN_CATEGORIES } from '../constants/scanCategories';
import type { InsightsData, MonthlyTrend, CategoryWaste } from '../mocks/mockInsightsData';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthYear(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function getCategoryLabelAndEmoji(rawCategory: string) {
  const clean = rawCategory.trim();
  // Try matching directly against label (e.g. "Dairy", "Pulses & Grains")
  const matchedByLabel = SCAN_CATEGORIES.find(c => c.label.toLowerCase() === clean.toLowerCase());
  if (matchedByLabel) {
    return {
      label: matchedByLabel.label,
      emoji: categoryEmoji(matchedByLabel.id),
    };
  }

  // Try matching by normalized key/id (e.g. "dairy", "pulses_and_grains")
  const normalizedKey = clean.toLowerCase().replace(/\s+/g, '_');
  const matchedById = SCAN_CATEGORIES.find(c => c.id.toLowerCase() === normalizedKey);
  if (matchedById) {
    return {
      label: matchedById.label,
      emoji: categoryEmoji(matchedById.id),
    };
  }

  // Fallback
  return {
    label: clean,
    emoji: categoryEmoji(clean),
  };
}

export function useInsightsData(selectedMonth: Date) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;

      const currentUserId = user.id;

      channel = supabase
        .channel(`insights_realtime:${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pantry_items',
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
            if (row?.['user_id'] !== currentUserId) return;
            void queryClient.invalidateQueries({ queryKey: ['insights'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'waste_log',
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as Record<string, unknown> | undefined;
            if (row?.['user_id'] !== currentUserId) return;
            void queryClient.invalidateQueries({ queryKey: ['insights'] });
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(authError.message);
      if (!user) throw new Error('Sign in to view insights.');

      const [pantryRes, wasteRes, recipeRes] = await Promise.all([
        supabase
          .from('pantry_items')
          .select('id, category, est_cost, status, added_date, expiry_date, status_updated_at')
          .eq('user_id', user.id),
        supabase
          .from('waste_log')
          .select('category, est_cost, wasted_on')
          .eq('user_id', user.id),
        supabase
          .from('recipe_saves')
          .select('saved_at')
          .eq('user_id', user.id),
      ]);

      if (__DEV__) {
        console.log('[useInsightsData] pantry raw:', pantryRes.data?.map((i: any) => ({ status: i.status, status_updated_at: i.status_updated_at })));
        console.log('[useInsightsData] recipe raw:', recipeRes.data?.map((r: any) => ({ saved_at: r.saved_at })));
        console.log('[useInsightsData] selectedMonth Date:', selectedMonth.toISOString());
        const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
        console.log('[useInsightsData] month boundaries', { start: monthStart.toISOString(), end: monthEnd.toISOString() });
      }

      if (pantryRes.error) {
        console.error('[useInsightsData] pantry_items error:', JSON.stringify(pantryRes.error));
        throw new Error(pantryRes.error.message);
      }
      if (wasteRes.error) {
        console.error('[useInsightsData] waste_log error:', JSON.stringify(wasteRes.error));
        throw new Error(wasteRes.error.message);
      }
      if (recipeRes.error) {
        console.error('[useInsightsData] recipe_saves error:', JSON.stringify(recipeRes.error));
        throw new Error(recipeRes.error.message);
      }

      return {
        pantryItems: pantryRes.data,
        wasteLog: wasteRes.data,
        recipeSaves: recipeRes.data,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes,
    onError: (error) => {
      // Log full error details for debugging; includes Supabase PostgrestError fields if present
      console.error('[useInsightsData] query error:', error);
      if (error && typeof error === 'object') {
        // Attempt to output known Supabase error fields
        const { code, details, hint } = error as any;
        if (code || details || hint) {
          console.error('[useInsightsData] Supabase error details:', { code, details, hint });
        }
      }
    },
  });

  const derivedData = useMemo<InsightsData | null>(() => {
    if (!query.data) return null;

    const { pantryItems, wasteLog, recipeSaves } = query.data;

    // Helper functions for date matching using UTC to avoid timezone drift
    const isInMonth = (dateStr: string | null | undefined, targetMonth: Date) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      // Compare using UTC month and year so that selectedMonth derived from local time aligns with UTC timestamps
      return d.getUTCFullYear() === targetMonth.getUTCFullYear() && d.getUTCMonth() === targetMonth.getUTCMonth();
    };

    const isInYear = (dateStr: string | null | undefined, targetMonth: Date) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getUTCFullYear() === targetMonth.getUTCFullYear();
    };

    // 1. pantryValue: sum est_cost of pantry_items where status = 'active'
    const pantryValue = pantryItems
      .filter(item => item.status === 'active')
      .reduce((sum, item) => sum + (Number(item.est_cost) || 0), 0);

    // 2. itemsSaved: count of pantry_items where status = 'used' AND status_updated_at falls in selectedMonth
    const itemsSaved = pantryItems.filter(
      item => item.status === 'used' && isInMonth(item.status_updated_at, selectedMonth)
    ).length;

    // 3. mealsSaved: count of recipe_saves where saved_at falls in selectedMonth
    const mealsSaved = recipeSaves.filter(
      save => isInMonth(save.saved_at, selectedMonth)
    ).length;

    // 4. avgShelfLifeUsedPercent: average of clamp(((status_updated_at - added_date) / (expiry_date - added_date)) * 100, 0, 100)
    // for used items in selectedMonth
    const usedItemsInMonth = pantryItems.filter(
      item => item.status === 'used' && isInMonth(item.status_updated_at, selectedMonth)
    );

    let avgShelfLifeUsedPercent = 0;
    if (usedItemsInMonth.length > 0) {
      const totalPct = usedItemsInMonth.reduce((sum, item) => {
        const added = new Date(item.added_date).getTime();
        const expiry = new Date(item.expiry_date).getTime();
        const updated = new Date(item.status_updated_at!).getTime();

        const timeUsed = updated - added;
        const totalShelf = expiry - added;

        const pct = totalShelf > 0 ? (timeUsed / totalShelf) * 100 : 0;
        const clamped = Math.max(0, Math.min(100, pct));
        return sum + clamped;
      }, 0);
      avgShelfLifeUsedPercent = Math.round(totalPct / usedItemsInMonth.length);
    }

    // 5. totalSavedThisYear: sum est_cost of pantry_items where status='used' AND status_updated_at falls in the same calendar year as selectedMonth
    const totalSavedThisYear = pantryItems
      .filter(item => item.status === 'used' && isInYear(item.status_updated_at, selectedMonth))
      .reduce((sum, item) => sum + (Number(item.est_cost) || 0), 0);

    // 6. percentVsLastMonth: compare sum(est_cost) of used items in selectedMonth vs the month before it
    const lastMonth = new Date(Date.UTC(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));

    const thisMonthCost = pantryItems
      .filter(item => item.status === 'used' && isInMonth(item.status_updated_at, selectedMonth))
      .reduce((sum, item) => sum + (Number(item.est_cost) || 0), 0);

    const lastMonthCost = pantryItems
      .filter(item => item.status === 'used' && isInMonth(item.status_updated_at, lastMonth))
      .reduce((sum, item) => sum + (Number(item.est_cost) || 0), 0);

    const percentVsLastMonth = lastMonthCost > 0
      ? Math.round(((thisMonthCost - lastMonthCost) / lastMonthCost) * 100)
      : 0;

    // 7. trend: last 6 months ending at selectedMonth
    const trend: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(selectedMonth.getFullYear(), selectedMonth.getMonth() - i, 1));
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      const monthWasted = wasteLog
        .filter(log => isInMonth(log.wasted_on, d))
        .reduce((sum, log) => sum + (Number(log.est_cost) || 0), 0);

      const monthSaved = pantryItems
        .filter(item => item.status === 'used' && isInMonth(item.status_updated_at, d))
        .reduce((sum, item) => sum + (Number(item.est_cost) || 0), 0);

      trend.push({
        month: monthLabel,
        wasted: Math.round(monthWasted),
        saved: Math.round(monthSaved),
      });
    }

    // 8. categoryBreakdown: group waste_log by category where wasted_on falls in selectedMonth,
    // sum est_cost per category, convert to percent of total wasted that month, sort desc, take top 5.
    const wasteInMonth = wasteLog.filter(log => isInMonth(log.wasted_on, selectedMonth));
    const totalWastedThisMonth = wasteInMonth.reduce((sum, log) => sum + (Number(log.est_cost) || 0), 0);

    const breakdownMap: Record<string, number> = {};
    wasteInMonth.forEach(log => {
      const cat = log.category || 'Other';
      breakdownMap[cat] = (breakdownMap[cat] || 0) + (Number(log.est_cost) || 0);
    });

    const categoryBreakdown: CategoryWaste[] = Object.entries(breakdownMap).map(([rawCat, cost]) => {
      const { label, emoji } = getCategoryLabelAndEmoji(rawCat);
      const percent = totalWastedThisMonth > 0 ? Math.round((cost / totalWastedThisMonth) * 100) : 0;
      return {
        category: label,
        emoji,
        percent,
      };
    });

    return {
      selectedMonth: formatMonthYear(selectedMonth),
      heroStat: {
        totalSavedThisYear: Math.round(totalSavedThisYear),
        percentVsLastMonth,
      },
      statGrid: {
        itemsSaved,
        mealsSaved,
        pantryValue: Math.round(pantryValue),
        avgShelfLifeUsedPercent,
      },
      trend,
      categoryBreakdown,
    if (__DEV__) {
      console.log('[useInsightsData] Debug values', {
        selectedMonth: selectedMonth.toISOString(),
        lastMonth: lastMonth.toISOString(),
        trend,
      });
    }
    };
  }, [query.data, selectedMonth]);

  return {
    ...query,
    data: derivedData,
  };
}
