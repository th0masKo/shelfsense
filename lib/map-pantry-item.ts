import type { PantryItemRow } from '../types/database';
import type { ItemStatus, PantryItem, StorageLocation } from '../types/pantry';

const CATEGORY_EMOJI: Record<string, string> = {
  dairy: '🥛',
  produce: '🥬',
  vegetables: '🥬',
  fruits: '🍎',
  meat: '🥩',
  meat_and_seafood: '🥩',
  pantry: '🫙',
  pulses_and_grains: '🌾',
  masalas_and_spices: '🌶️',
  snacks_and_packaged: '🍪',
  condiments: '🫙',
  freezer: '🧊',
  spices: '🌶️',
  drinks: '🥤',
  fridge: '🧊',
};

const CATEGORY_STORAGE: Record<string, StorageLocation> = {
  fridge: 'fridge',
  freezer: 'freezer',
  pantry: 'pantry',
  produce: 'produce',
  spices: 'spices',
  drinks: 'drinks',
  dairy: 'fridge',
  meat: 'fridge',
};

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

export function categoryEmoji(category: string): string {
  const key = category.toLowerCase();
  return CATEGORY_EMOJI[key] ?? '🫙';
}

function categoryStorage(category: string): StorageLocation {
  const key = category.toLowerCase();
  return CATEGORY_STORAGE[key] ?? 'pantry';
}

function capitalizeCategory(category: string): string {
  if (category.length === 0) return category;
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function mapPantryItemRow(row: PantryItemRow): PantryItem {
  const status = row.status as ItemStatus;
  return {
    id: row.id,
    emoji: categoryEmoji(row.category),
    name: row.name,
    quantity: row.quantity ?? '',
    category: capitalizeCategory(row.category),
    storage: categoryStorage(row.category),
    expiryDate: toDateOnly(row.expiry_date),
    addedDate: toDateOnly(row.added_date),
    status: status === 'used' || status === 'wasted' ? status : 'active',
    estCost: row.est_cost ?? undefined,
  };
}
