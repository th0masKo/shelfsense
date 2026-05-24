export type StorageLocation =
  | 'fridge'
  | 'freezer'
  | 'pantry'
  | 'produce'
  | 'spices'
  | 'drinks';

export type ItemStatus = 'active' | 'used' | 'wasted';

export type Urgency = 'critical' | 'warning' | 'good';

export type PantrySection = 'expiring_soon' | 'this_week' | 'this_month' | 'later';

export type SortMode = 'expiry_asc' | 'expiry_desc' | 'name_asc' | 'date_added';

export interface PantryItem {
  id: string;
  emoji: string;
  name: string;
  quantity: string;
  category: string;
  storage: StorageLocation;
  expiryDate: string;
  addedDate: string;
  status: ItemStatus;
  estCost?: number;
}
