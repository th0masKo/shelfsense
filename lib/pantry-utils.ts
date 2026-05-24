import { colors, type Urgency } from '../constants/theme';
import type {
  ItemStatus,
  PantryItem,
  PantrySection,
  SortMode,
  StorageLocation,
} from '../types/pantry';

export const CATEGORY_CHIPS: { key: 'all' | StorageLocation; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fridge', label: 'Fridge' },
  { key: 'freezer', label: 'Freezer' },
  { key: 'pantry', label: 'Pantry' },
  { key: 'produce', label: 'Produce' },
  { key: 'spices', label: 'Spices' },
  { key: 'drinks', label: 'Drinks' },
];

export const SORT_OPTIONS: { mode: SortMode; label: string }[] = [
  { mode: 'expiry_asc', label: 'Expiry (soonest)' },
  { mode: 'expiry_desc', label: 'Expiry (latest)' },
  { mode: 'name_asc', label: 'Name A–Z' },
  { mode: 'date_added', label: 'Date added' },
];

export const SECTION_LABELS: Record<PantrySection, string> = {
  expiring_soon: 'Expiring soon',
  this_week: 'This week',
  this_month: 'This month',
  later: 'Later',
};

export const SECTION_ORDER: PantrySection[] = [
  'expiring_soon',
  'this_week',
  'this_month',
  'later',
];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = parseDate(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getUrgency(daysLeft: number): Urgency {
  if (daysLeft <= 3) return 'critical';
  if (daysLeft <= 7) return 'warning';
  return 'good';
}

export function urgencyBorderColor(urgency: Urgency): string {
  if (urgency === 'critical') return colors.red;
  if (urgency === 'warning') return colors.amber;
  return colors.teal;
}

export function urgencyAccentColor(urgency: Urgency): string {
  return urgencyBorderColor(urgency);
}

export function urgencyBadgeBg(urgency: Urgency): string {
  if (urgency === 'critical') return colors.redLight;
  if (urgency === 'warning') return colors.amberLight;
  return colors.tealLight;
}

export function urgencyBadgeText(urgency: Urgency): string {
  return urgencyBorderColor(urgency);
}

export function formatExpiryBadge(daysLeft: number): string {
  if (daysLeft < 0) return 'Expired';
  if (daysLeft === 0) return 'Expires today';
  if (daysLeft === 1) return 'Tomorrow';
  return `${daysLeft} days left`;
}

export function getPantrySection(daysLeft: number): PantrySection {
  if (daysLeft <= 7) return 'expiring_soon';
  if (daysLeft <= 14) return 'this_week';
  if (daysLeft <= 30) return 'this_month';
  return 'later';
}

export function sortItems(items: PantryItem[], mode: SortMode): PantryItem[] {
  const copy = [...items];
  switch (mode) {
    case 'expiry_asc':
      return copy.sort(
        (a, b) => parseDate(a.expiryDate).getTime() - parseDate(b.expiryDate).getTime(),
      );
    case 'expiry_desc':
      return copy.sort(
        (a, b) => parseDate(b.expiryDate).getTime() - parseDate(a.expiryDate).getTime(),
      );
    case 'name_asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'date_added':
      return copy.sort(
        (a, b) => parseDate(b.addedDate).getTime() - parseDate(a.addedDate).getTime(),
      );
    default:
      return copy;
  }
}

export function groupBySection(
  items: PantryItem[],
): { section: PantrySection; items: PantryItem[] }[] {
  const buckets: Record<PantrySection, PantryItem[]> = {
    expiring_soon: [],
    this_week: [],
    this_month: [],
    later: [],
  };

  for (const item of items) {
    const days = daysUntilExpiry(item.expiryDate);
    buckets[getPantrySection(days)].push(item);
  }

  return SECTION_ORDER.filter((s) => buckets[s].length > 0).map((section) => ({
    section,
    items: buckets[section],
  }));
}

export function filterItems(
  items: PantryItem[],
  query: string,
  storage: 'all' | StorageLocation,
  statusFilter: ItemStatus | 'all',
  categoryFilter: string | 'all',
): PantryItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (statusFilter === 'all') {
      if (item.status !== 'active') return false;
    } else if (item.status !== statusFilter) {
      return false;
    }
    if (storage !== 'all' && item.storage !== storage) return false;
    if (categoryFilter !== 'all' && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }
    if (q.length > 0) {
      const haystack = `${item.name} ${item.category} ${item.quantity}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
