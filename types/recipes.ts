export interface ExpiringIngredient {
  id: string;
  emoji: string;
  name: string;
}

export type DietaryFilterId =
  | 'any'
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'high_protein'
  | 'quick';

export type RecipeDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: string;
  title: string;
  ingredients_used: string[];
  ingredients_needed: string[];
  time_minutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  instructions_brief: string;
  uses_expiring_item: boolean;
  dietary: DietaryFilterId[];
}
