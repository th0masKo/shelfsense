import { supabase } from './supabase';
import type { ItemStatus } from '../types/pantry';

export async function updatePantryItemStatus(id: string, status: ItemStatus): Promise<void> {
  const { error } = await supabase.from('pantry_items').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePantryItem(id: string): Promise<void> {
  const { error } = await supabase.from('pantry_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
