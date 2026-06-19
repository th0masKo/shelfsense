import type { DietaryFilterId, ExpiringIngredient, Recipe } from '../types/recipes';

export const MOCK_EXPIRING_INGREDIENTS: ExpiringIngredient[] = [
  { id: 'spinach', emoji: '🥬', name: 'Spinach' },
  { id: 'milk', emoji: '🥛', name: 'Milk' },
  { id: 'tomatoes', emoji: '🍅', name: 'Tomatoes' },
  { id: 'paneer', emoji: '🧀', name: 'Paneer' },
  { id: 'coriander', emoji: '🌿', name: 'Coriander' },
];

export const DIETARY_FILTER_OPTIONS: { id: DietaryFilterId; label: string }[] = [
  { id: 'any', label: 'Any' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'high_protein', label: 'High-protein' },
  { id: 'quick', label: 'Quick (<20min)' },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'palak-paneer-bhurji',
    title: 'Palak Paneer Bhurji',
    ingredients_used: ['Spinach', 'Paneer', 'Coriander'],
    ingredients_needed: ['Onion', 'Green chilli', 'Cumin'],
    time_minutes: 25,
    servings: 2,
    difficulty: 'Easy',
    instructions_brief:
      'Sauté onions and spices, crumble paneer, fold in wilted spinach, finish with fresh coriander.',
    uses_expiring_item: true,
    dietary: ['vegetarian', 'high_protein'],
  },
  {
    id: 'tomato-paneer-curry',
    title: 'Tomato Paneer Curry',
    ingredients_used: ['Tomatoes', 'Paneer'],
    ingredients_needed: ['Ginger', 'Garlic', 'Garam masala', 'Cream'],
    time_minutes: 35,
    servings: 3,
    difficulty: 'Medium',
    instructions_brief:
      'Simmer tomatoes into a masala base, add paneer cubes, and cook until rich and glossy.',
    uses_expiring_item: true,
    dietary: ['vegetarian', 'high_protein', 'gluten_free'],
  },
  {
    id: 'spinach-smoothie',
    title: 'Spinach Banana Smoothie',
    ingredients_used: ['Spinach', 'Milk'],
    ingredients_needed: ['Banana', 'Honey'],
    time_minutes: 5,
    servings: 1,
    difficulty: 'Easy',
    instructions_brief:
      'Blend spinach with milk and banana until smooth — a quick breakfast using up greens.',
    uses_expiring_item: true,
    dietary: ['vegetarian', 'quick'],
  },
];
