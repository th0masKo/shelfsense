export interface MonthlyTrend {
  month: string;       // "Jan", "Feb", etc.
  wasted: number;      // ₹ wasted that month
  saved: number;       // ₹ saved that month
}

export interface CategoryWaste {
  category: string;    // one of the 9 categories: Vegetables, Fruits, Dairy, Pulses & Grains, Masalas & Spices, Snacks & Packaged, Meat & Seafood, Drinks, Condiments
  emoji: string;
  percent: number;     // 0-100
}

export interface InsightsData {
  selectedMonth: string;          // "May 2026"
  heroStat: {
    totalSavedThisYear: number;   // ₹
    percentVsLastMonth: number;   // e.g. 12 (positive) or -8 (negative)
  };
  statGrid: {
    itemsSaved: number;
    mealsSaved: number;
    pantryValue: number;          // ₹ estimated current value
    avgShelfLifeUsedPercent: number;
  };
  trend: MonthlyTrend[];           // 6 entries
  categoryBreakdown: CategoryWaste[]; // max 5, sorted desc by percent
}

export const MOCK_MONTHS = [
  'May 2026',
  'Apr 2026',
  'Mar 2026',
  'Feb 2026',
  'Jan 2026',
  'Dec 2025',
];

export const mockInsightsData: Record<string, InsightsData> = {
  'May 2026': {
    selectedMonth: 'May 2026',
    heroStat: {
      totalSavedThisYear: 4820,
      percentVsLastMonth: 12,
    },
    statGrid: {
      itemsSaved: 42,
      mealsSaved: 18,
      pantryValue: 2450,
      avgShelfLifeUsedPercent: 78,
    },
    trend: [
      { month: 'Dec', wasted: 420, saved: 680 },
      { month: 'Jan', wasted: 380, saved: 710 },
      { month: 'Feb', wasted: 310, saved: 780 },
      { month: 'Mar', wasted: 290, saved: 850 },
      { month: 'Apr', wasted: 250, saved: 920 },
      { month: 'May', wasted: 180, saved: 1240 },
    ],
    categoryBreakdown: [
      { category: 'Vegetables', emoji: '🥦', percent: 35 },
      { category: 'Fruits', emoji: '🍎', percent: 25 },
      { category: 'Dairy', emoji: '🥛', percent: 20 },
      { category: 'Snacks & Packaged', emoji: '🍪', percent: 12 },
      { category: 'Condiments', emoji: '🍯', percent: 8 },
    ],
  },
  'Apr 2026': {
    selectedMonth: 'Apr 2026',
    heroStat: {
      totalSavedThisYear: 3580,
      percentVsLastMonth: 8,
    },
    statGrid: {
      itemsSaved: 35,
      mealsSaved: 14,
      pantryValue: 2100,
      avgShelfLifeUsedPercent: 74,
    },
    trend: [
      { month: 'Nov', wasted: 450, saved: 600 },
      { month: 'Dec', wasted: 420, saved: 680 },
      { month: 'Jan', wasted: 380, saved: 710 },
      { month: 'Feb', wasted: 310, saved: 780 },
      { month: 'Mar', wasted: 290, saved: 850 },
      { month: 'Apr', wasted: 250, saved: 920 },
    ],
    categoryBreakdown: [
      { category: 'Vegetables', emoji: '🥦', percent: 38 },
      { category: 'Dairy', emoji: '🥛', percent: 22 },
      { category: 'Fruits', emoji: '🍎', percent: 18 },
      { category: 'Pulses & Grains', emoji: '🌾', percent: 12 },
      { category: 'Masalas & Spices', emoji: '🌶️', percent: 10 },
    ],
  },
  'Mar 2026': {
    selectedMonth: 'Mar 2026',
    heroStat: {
      totalSavedThisYear: 2660,
      percentVsLastMonth: 9,
    },
    statGrid: {
      itemsSaved: 29,
      mealsSaved: 11,
      pantryValue: 1980,
      avgShelfLifeUsedPercent: 71,
    },
    trend: [
      { month: 'Oct', wasted: 480, saved: 580 },
      { month: 'Nov', wasted: 450, saved: 600 },
      { month: 'Dec', wasted: 420, saved: 680 },
      { month: 'Jan', wasted: 380, saved: 710 },
      { month: 'Feb', wasted: 310, saved: 780 },
      { month: 'Mar', wasted: 290, saved: 850 },
    ],
    categoryBreakdown: [
      { category: 'Vegetables', emoji: '🥦', percent: 40 },
      { category: 'Fruits', emoji: '🍎', percent: 20 },
      { category: 'Dairy', emoji: '🥛', percent: 15 },
      { category: 'Drinks', emoji: '🥤', percent: 15 },
      { category: 'Meat & Seafood', emoji: '🥩', percent: 10 },
    ],
  },
  'Feb 2026': {
    selectedMonth: 'Feb 2026',
    heroStat: {
      totalSavedThisYear: 1810,
      percentVsLastMonth: -5, // Negative change
    },
    statGrid: {
      itemsSaved: 24,
      mealsSaved: 9,
      pantryValue: 2250,
      avgShelfLifeUsedPercent: 68,
    },
    trend: [
      { month: 'Sep', wasted: 460, saved: 520 },
      { month: 'Oct', wasted: 480, saved: 580 },
      { month: 'Nov', wasted: 450, saved: 600 },
      { month: 'Dec', wasted: 420, saved: 680 },
      { month: 'Jan', wasted: 380, saved: 710 },
      { month: 'Feb', wasted: 310, saved: 780 },
    ],
    categoryBreakdown: [
      { category: 'Vegetables', emoji: '🥦', percent: 32 },
      { category: 'Dairy', emoji: '🥛', percent: 28 },
      { category: 'Fruits', emoji: '🍎', percent: 20 },
      { category: 'Snacks & Packaged', emoji: '🍪', percent: 12 },
      { category: 'Drinks', emoji: '🥤', percent: 8 },
    ],
  },
  'Jan 2026': {
    selectedMonth: 'Jan 2026',
    heroStat: {
      totalSavedThisYear: 1030,
      percentVsLastMonth: 4,
    },
    statGrid: {
      itemsSaved: 26,
      mealsSaved: 10,
      pantryValue: 1850,
      avgShelfLifeUsedPercent: 70,
    },
    trend: [
      { month: 'Aug', wasted: 500, saved: 480 },
      { month: 'Sep', wasted: 460, saved: 520 },
      { month: 'Oct', wasted: 480, saved: 580 },
      { month: 'Nov', wasted: 450, saved: 600 },
      { month: 'Dec', wasted: 420, saved: 680 },
      { month: 'Jan', wasted: 380, saved: 710 },
    ],
    categoryBreakdown: [
      { category: 'Dairy', emoji: '🥛', percent: 30 },
      { category: 'Vegetables', emoji: '🥦', percent: 28 },
      { category: 'Fruits', emoji: '🍎', percent: 22 },
      { category: 'Condiments', emoji: '🍯', percent: 12 },
      { category: 'Pulses & Grains', emoji: '🌾', percent: 8 },
    ],
  },
  'Dec 2025': {
    selectedMonth: 'Dec 2025',
    heroStat: {
      totalSavedThisYear: 320,
      percentVsLastMonth: 15,
    },
    statGrid: {
      itemsSaved: 22,
      mealsSaved: 8,
      pantryValue: 1620,
      avgShelfLifeUsedPercent: 65,
    },
    trend: [
      { month: 'Jul', wasted: 520, saved: 430 },
      { month: 'Aug', wasted: 500, saved: 480 },
      { month: 'Sep', wasted: 460, saved: 520 },
      { month: 'Oct', wasted: 480, saved: 580 },
      { month: 'Nov', wasted: 450, saved: 600 },
      { month: 'Dec', wasted: 420, saved: 680 },
    ],
    categoryBreakdown: [
      { category: 'Vegetables', emoji: '🥦', percent: 36 },
      { category: 'Fruits', emoji: '🍎', percent: 24 },
      { category: 'Dairy', emoji: '🥛', percent: 20 },
      { category: 'Masalas & Spices', emoji: '🌶️', percent: 12 },
      { category: 'Snacks & Packaged', emoji: '🍪', percent: 8 },
    ],
  },
};
