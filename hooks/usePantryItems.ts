import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mapPantryItemRow } from '../lib/map-pantry-item';
import { supabase } from '../lib/supabase';
import type { PantryItemRow } from '../types/database';
import type { PantryItem } from '../types/pantry';
import { PANTRY_ITEMS_QUERY_KEY, PANTRY_STALE_TIME_MS } from './pantry-query-keys';
import { usePantryRealtime } from './usePantryRealtime';

// Re-export supabase so existing callers (app/_layout.tsx, auth.tsx, etc.)
// don't need to update their import paths.
export { supabase } from '../lib/supabase';
export { PANTRY_ITEMS_QUERY_KEY } from './pantry-query-keys';

async function fetchPantryItems(): Promise<PantryItem[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error('Sign in to view your pantry.');
  }

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('expiry_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PantryItemRow[]).map(mapPantryItemRow);
}

export function usePantryItems() {
  const queryClient = useQueryClient();

  // Pass this screen's own invalidation callback — only PANTRY_ITEMS_QUERY_KEY.
  usePantryRealtime(() => {
    void queryClient.invalidateQueries({ queryKey: PANTRY_ITEMS_QUERY_KEY, exact: false });
  });

  const query = useQuery({
    queryKey: PANTRY_ITEMS_QUERY_KEY,
    queryFn: fetchPantryItems,
    staleTime: PANTRY_STALE_TIME_MS,
    refetchInterval: 30_000,
  });

  return query;
}
