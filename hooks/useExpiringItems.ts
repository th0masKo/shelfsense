import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapPantryItemRow } from '../lib/map-pantry-item';
import { supabase } from '../lib/supabase';
import type { PantryItemRow } from '../types/database';
import type { ExpiringIngredient } from '../types/recipes';
import {
  EXPIRING_ITEMS_QUERY_KEY,
  PANTRY_STALE_TIME_MS,
} from './pantry-query-keys';
import { usePantryRealtime } from './usePantryRealtime';

export { EXPIRING_ITEMS_QUERY_KEY } from './pantry-query-keys';

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function sevenDaysFromToday(): string {
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() + 7);
  return formatDateOnly(cutoff);
}

async function fetchExpiringItems(): Promise<ExpiringIngredient[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error('Sign in to view expiring items.');
  }

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('expiry_date', sevenDaysFromToday())
    .order('expiry_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PantryItemRow[]).map(mapPantryItemRow).map((item) => ({
    id: item.id,
    emoji: item.emoji,
    name: item.name,
  }));
}

export function useExpiringItems() {
  const queryClient = useQueryClient();

  // Pass Recipes' own invalidation callback — only EXPIRING_ITEMS_QUERY_KEY.
  usePantryRealtime(() => {
    void queryClient.invalidateQueries({ queryKey: EXPIRING_ITEMS_QUERY_KEY, exact: false });
  });

  return useQuery({
    queryKey: EXPIRING_ITEMS_QUERY_KEY,
    queryFn: fetchExpiringItems,
    staleTime: PANTRY_STALE_TIME_MS,
  });
}
