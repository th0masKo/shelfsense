export type FreshStorageLocation = 'fridge' | 'freezer' | 'pantry' | 'counter';

export const SHELF_LIFE_DAYS: Record<string, Record<FreshStorageLocation, number>> = {
  spinach: { fridge: 6, freezer: 90, pantry: 1, counter: 1 },
  coriander: { fridge: 7, freezer: 30, pantry: 1, counter: 1 },
  tomato: { fridge: 7, freezer: 60, pantry: 5, counter: 5 },
  onion: { fridge: 60, freezer: 90, pantry: 30, counter: 30 },
  potato: { fridge: 90, freezer: 90, pantry: 21, counter: 14 },
  carrot: { fridge: 21, freezer: 90, pantry: 7, counter: 4 },
  capsicum: { fridge: 10, freezer: 60, pantry: 4, counter: 3 },
  banana: { fridge: 7, freezer: 90, pantry: 4, counter: 4 },
  apple: { fridge: 45, freezer: 90, pantry: 7, counter: 7 },
  mango: { fridge: 7, freezer: 90, pantry: 4, counter: 3 },
  milk: { fridge: 4, freezer: 90, pantry: 0, counter: 0 },
  curd: { fridge: 5, freezer: 0, pantry: 0, counter: 0 },
  paneer: { fridge: 4, freezer: 60, pantry: 0, counter: 0 },
  rice: { fridge: 0, freezer: 0, pantry: 365, counter: 300 },
  dal: { fridge: 0, freezer: 0, pantry: 365, counter: 300 },
  atta: { fridge: 0, freezer: 0, pantry: 90, counter: 60 },
  cooked_food: { fridge: 3, freezer: 90, pantry: 0, counter: 0 },
};

export const STORAGE_CHIPS: readonly {
  id: FreshStorageLocation;
  label: string;
  emoji: string;
}[] = [
  { id: 'fridge', label: 'Fridge', emoji: '🧊' },
  { id: 'freezer', label: 'Freezer', emoji: '❄️' },
  { id: 'pantry', label: 'Pantry', emoji: '🫙' },
  { id: 'counter', label: 'Counter', emoji: '🍌' },
] as const;

export function normalizeItemKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function lookupShelfLifeDays(
  itemName: string,
  storage: FreshStorageLocation,
): { days: number; key: string } | null {
  const normalized = normalizeItemKey(itemName);
  if (normalized.length === 0) return null;

  if (SHELF_LIFE_DAYS[normalized]) {
    const days = SHELF_LIFE_DAYS[normalized][storage];
    return days > 0 ? { days, key: normalized } : null;
  }

  for (const key of Object.keys(SHELF_LIFE_DAYS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      const days = SHELF_LIFE_DAYS[key][storage];
      if (days > 0) return { days, key };
    }
  }

  return null;
}

export function addDaysToToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatDateDisplay(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function adjustIsoDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}
