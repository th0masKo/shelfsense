import type { PantryItem, Urgency } from '../types/pantry';
import { daysUntilExpiry, formatExpiryBadge, getUrgency } from './pantry-utils';

export interface DashboardListItem {
  id: string;
  emoji: string;
  name: string;
  quantity: string;
  category: string;
  badge: string;
  urgency: Urgency;
}

export function toDashboardListItem(item: PantryItem): DashboardListItem {
  const daysLeft = daysUntilExpiry(item.expiryDate);
  return {
    id: item.id,
    emoji: item.emoji,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    badge: formatExpiryBadge(daysLeft),
    urgency: getUrgency(daysLeft),
  };
}

export function getActiveItems(items: PantryItem[]): PantryItem[] {
  return items.filter((item) => item.status === 'active');
}

export function getNeedsAttentionItems(items: PantryItem[]): DashboardListItem[] {
  return getActiveItems(items)
    .filter((item) => daysUntilExpiry(item.expiryDate) <= 7)
    .sort((a, b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate))
    .map(toDashboardListItem);
}

export function getComingUpItems(items: PantryItem[]): DashboardListItem[] {
  return getActiveItems(items)
    .filter((item) => {
      const days = daysUntilExpiry(item.expiryDate);
      return days >= 8 && days <= 30;
    })
    .sort((a, b) => daysUntilExpiry(a.expiryDate) - daysUntilExpiry(b.expiryDate))
    .map(toDashboardListItem);
}

export function getExpiringSoonCount(items: PantryItem[]): number {
  return getActiveItems(items).filter((item) => daysUntilExpiry(item.expiryDate) <= 7).length;
}

export function hasCriticalExpiry(items: PantryItem[]): boolean {
  return getActiveItems(items).some((item) => daysUntilExpiry(item.expiryDate) <= 3);
}
