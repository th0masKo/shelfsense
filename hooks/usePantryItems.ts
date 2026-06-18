import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { mapPantryItemRow } from '../lib/map-pantry-item';
import type { PantryItemRow } from '../types/database';
import type { PantryItem } from '../types/pantry';

// Loaded from .env.local (EXPO_PUBLIC_* vars are inlined at build time by Expo)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_ANON_KEY ??
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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
    .eq('status', 'active')
    .order('expiry_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as PantryItemRow[]).map(mapPantryItemRow);
}

export function usePantryItems() {
  const query = useQuery({
    queryKey: PANTRY_ITEMS_QUERY_KEY,
    queryFn: fetchPantryItems,
    staleTime: STALE_TIME_MS,
    refetchInterval: 30_000,
  });

  return query;
}
