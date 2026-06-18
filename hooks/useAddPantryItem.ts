import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, PANTRY_ITEMS_QUERY_KEY } from './usePantryItems';

export interface AddPantryItemInput {
  name: string;
  category: string;
  quantity?: string;
  expiry_date: string;
  barcode?: string;
}

async function insertPantryItem(input: AddPantryItemInput): Promise<{ id: string; name: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  if (!user) {
    throw new Error('Sign in to add items to your pantry.');
  }

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      category: input.category,
      quantity: input.quantity?.trim() || null,
      expiry_date: input.expiry_date,
      barcode: input.barcode?.trim() || null,
      status: 'active',
    })
    .select('id, name')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data == null) {
    throw new Error('Could not add item. Please try again.');
  }

  return { id: data.id as string, name: data.name as string };
}

export function useAddPantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: insertPantryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PANTRY_ITEMS_QUERY_KEY });
    },
  });
}
