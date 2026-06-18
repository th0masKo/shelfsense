export type PantryCategoryId =
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'pulses_and_grains'
  | 'masalas_and_spices'
  | 'snacks_and_packaged'
  | 'meat_and_seafood'
  | 'drinks'
  | 'condiments';

export interface ScanCategoryOption {
  id: PantryCategoryId;
  label: string;
}

export const SCAN_CATEGORIES: readonly ScanCategoryOption[] = [
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'pulses_and_grains', label: 'Pulses & Grains' },
  { id: 'masalas_and_spices', label: 'Masalas & Spices' },
  { id: 'snacks_and_packaged', label: 'Snacks & Packaged' },
  { id: 'meat_and_seafood', label: 'Meat & Seafood' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'condiments', label: 'Condiments' },
] as const;

const VALID_IDS = new Set<string>(SCAN_CATEGORIES.map((c) => c.id));

export function isPantryCategoryId(value: string): value is PantryCategoryId {
  return VALID_IDS.has(value);
}

export function categoryLabel(id: PantryCategoryId): string {
  return SCAN_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function normalizeCategoryFromVision(raw: string | null): PantryCategoryId | null {
  if (raw == null) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, '_');
  if (isPantryCategoryId(key)) return key;
  const aliases: Record<string, PantryCategoryId> = {
    produce: 'vegetables',
    pulses: 'pulses_and_grains',
    grains: 'pulses_and_grains',
    masala: 'masalas_and_spices',
    spices: 'masalas_and_spices',
    snacks: 'snacks_and_packaged',
    packaged: 'snacks_and_packaged',
    meat: 'meat_and_seafood',
    seafood: 'meat_and_seafood',
  };
  return aliases[key] ?? null;
}
