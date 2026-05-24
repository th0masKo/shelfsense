import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { mapPantryItemRow } from '../lib/map-pantry-item';
import type { PantryItemRow } from '../types/database';
import type { PantryItem } from '../types/pantry';

export const PANTRY_ITEMS_QUERY_KEY = ['pantry_items'] as const;

const STALE_TIME_MS = 5 * 60 * 1000;

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
    .order('expiry_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PantryItemRow[]).map(mapPantryItemRow);
}

export function usePantryItems() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PANTRY_ITEMS_QUERY_KEY,
    queryFn: fetchPantryItems,
    staleTime: STALE_TIME_MS,
  });

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      channel = supabase
        .channel(`pantry_items:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pantry_items',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: PANTRY_ITEMS_QUERY_KEY });
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [queryClient]);

  return query;
}
