import { useQuery } from '@tanstack/react-query';
import type { DietaryFilterId, Recipe, RecipeDifficulty } from '../types/recipes';
import { DIETARY_FILTER_OPTIONS } from '../data/mockRecipes';

export const RECIPE_SUGGESTIONS_QUERY_KEY = 'recipe_suggestions' as const;
export const RECIPE_SUGGESTIONS_STALE_TIME_MS = 10 * 60 * 1000;

// SET TO false BEFORE BUYING CREDITS / FOR PRODUCTION
const DEV_MOCK_CLAUDE_RESPONSE = true;

const MOCK_RECIPE_DELAY_MS = 1500;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT =
  'You are an Indian home cooking assistant. Given a list of ingredients, ' +
  'suggest 3 recipes ranked by how many of these ingredients they use, ' +
  'prioritising the ones expiring soonest. Strongly prefer Indian recipes ' +
  '(North Indian, South Indian, street food, tiffin) unless the ingredients ' +
  'clearly suit a non-Indian dish. Return JSON with fields: title, ' +
  'ingredients_used[], ingredients_needed[], time_minutes, servings, ' +
  'difficulty, instructions_brief.';

interface ClaudeRecipePayload {
  title: string;
  ingredients_used: string[];
  ingredients_needed: string[];
  time_minutes: number;
  servings: number;
  difficulty: string;
  instructions_brief: string;
}

function dietaryFilterLabel(filter: DietaryFilterId): string {
  return DIETARY_FILTER_OPTIONS.find((option) => option.id === filter)?.label ?? filter;
}

function slugifyTitle(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'recipe'}-${index}`;
}

function normalizeDifficulty(value: string): RecipeDifficulty {
  const lower = value.toLowerCase();
  if (lower.includes('hard')) return 'Hard';
  if (lower.includes('medium')) return 'Medium';
  return 'Easy';
}

function ingredientMatches(name: string, selectedNames: string[]): boolean {
  const normalized = name.toLowerCase();
  return selectedNames.some((selected) => selected.toLowerCase() === normalized);
}

function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    return fenced[1].trim();
  }

  const arrayStart = trimmed.indexOf('[');
  const objectStart = trimmed.indexOf('{');
  if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
    return trimmed.slice(arrayStart);
  }
  if (objectStart !== -1) {
    return trimmed.slice(objectStart);
  }

  return trimmed;
}

function parseRecipePayload(raw: unknown): ClaudeRecipePayload[] {
  let parsed = raw;

  if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const record = parsed as Record<string, unknown>;
    if (Array.isArray(record.recipes)) {
      parsed = record.recipes;
    }
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Recipe response was not a JSON array.');
  }

  return parsed.map((item, index) => {
    if (item == null || typeof item !== 'object') {
      throw new Error(`Recipe ${index + 1} was malformed.`);
    }

    const recipe = item as Record<string, unknown>;
    const title = typeof recipe.title === 'string' ? recipe.title.trim() : '';
    const ingredientsUsed = Array.isArray(recipe.ingredients_used)
      ? recipe.ingredients_used.filter((value): value is string => typeof value === 'string')
      : [];
    const ingredientsNeeded = Array.isArray(recipe.ingredients_needed)
      ? recipe.ingredients_needed.filter((value): value is string => typeof value === 'string')
      : [];
    const instructionsBrief =
      typeof recipe.instructions_brief === 'string' ? recipe.instructions_brief.trim() : '';

    if (!title || ingredientsUsed.length === 0 || !instructionsBrief) {
      throw new Error(`Recipe ${index + 1} was missing required fields.`);
    }

    const timeMinutes = Number(recipe.time_minutes);
    const servings = Number(recipe.servings);
    const difficulty =
      typeof recipe.difficulty === 'string' ? recipe.difficulty : 'Easy';

    if (!Number.isFinite(timeMinutes) || !Number.isFinite(servings)) {
      throw new Error(`Recipe ${index + 1} had invalid time or servings.`);
    }

    return {
      title,
      ingredients_used: ingredientsUsed,
      ingredients_needed: ingredientsNeeded,
      time_minutes: timeMinutes,
      servings,
      difficulty,
      instructions_brief: instructionsBrief,
    };
  });
}

function mapToRecipes(
  payloads: ClaudeRecipePayload[],
  selectedIngredients: string[],
  dietaryFilter: DietaryFilterId,
): Recipe[] {
  const dietary =
    dietaryFilter === 'any' ? ([] as DietaryFilterId[]) : ([dietaryFilter] as DietaryFilterId[]);

  return payloads.map((payload, index) => ({
    id: slugifyTitle(payload.title, index),
    title: payload.title,
    ingredients_used: payload.ingredients_used,
    ingredients_needed: payload.ingredients_needed,
    time_minutes: payload.time_minutes,
    servings: payload.servings,
    difficulty: normalizeDifficulty(payload.difficulty),
    instructions_brief: payload.instructions_brief,
    uses_expiring_item: payload.ingredients_used.some((name) =>
      ingredientMatches(name, selectedIngredients),
    ),
    dietary,
  }));
}

function mockDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildMockClaudeRecipeText(
  selectedIngredients: string[],
  dietaryFilter: DietaryFilterId,
): string {
  const primary = selectedIngredients[0] ?? 'Spinach';
  const secondary = selectedIngredients[1] ?? primary;
  const tertiary = selectedIngredients[2] ?? secondary;

  const noAlliumNeeded = ['Cumin', 'Ginger', 'Tomato', 'Turmeric', 'Coriander leaves'];

  const recipesByFilter: Record<DietaryFilterId, ClaudeRecipePayload[]> = {
    any: [
      {
        title: `${primary} Paneer Bhurji`,
        ingredients_used: [primary, secondary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Onion', 'Green chilli', 'Cumin', 'Ghee'],
        time_minutes: 25,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Sauté onions and spices, crumble paneer, fold in ${primary.toLowerCase()}, finish with coriander.`,
      },
      {
        title: `${secondary} Tomato Curry`,
        ingredients_used: [secondary, tertiary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Onion', 'Ginger', 'Garlic', 'Garam masala'],
        time_minutes: 30,
        servings: 3,
        difficulty: 'Medium',
        instructions_brief: `Cook tomatoes with masala base and simmer ${secondary.toLowerCase()} until rich and glossy.`,
      },
      {
        title: `${primary} Masala Dosa Filling`,
        ingredients_used: [primary],
        ingredients_needed: ['Potato', 'Mustard seeds', 'Curry leaves', 'Turmeric'],
        time_minutes: 35,
        servings: 4,
        difficulty: 'Medium',
        instructions_brief: `Temper mustard seeds, mash potatoes with ${primary.toLowerCase()} for a classic South Indian filling.`,
      },
    ],
    vegetarian: [
      {
        title: `${primary} Paneer Tikka`,
        ingredients_used: [primary, secondary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Paneer', 'Yogurt', 'Kashmiri chilli', 'Besan'],
        time_minutes: 28,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Marinate paneer and ${primary.toLowerCase()} in spiced yogurt, then grill until charred.`,
      },
      {
        title: `${secondary} Dal Tadka`,
        ingredients_used: [secondary],
        ingredients_needed: ['Toor dal', 'Tomato', 'Cumin', 'Ghee'],
        time_minutes: 32,
        servings: 3,
        difficulty: 'Easy',
        instructions_brief: `Pressure-cook dal, finish with a ghee tadka and fold in ${secondary.toLowerCase()}.`,
      },
      {
        title: `${primary} Stuffed Paratha`,
        ingredients_used: [primary, tertiary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Whole wheat flour', 'Ajwain', 'Green chilli', 'Ghee'],
        time_minutes: 30,
        servings: 2,
        difficulty: 'Medium',
        instructions_brief: `Knead dough, stuff with spiced ${primary.toLowerCase()}, and pan-roast with ghee.`,
      },
    ],
    vegan: [
      {
        title: `${primary} Chana Masala`,
        ingredients_used: [primary, secondary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Chickpeas', 'Tomato', 'Cumin', 'Coriander powder'],
        time_minutes: 30,
        servings: 3,
        difficulty: 'Easy',
        instructions_brief: `Simmer chickpeas with tomatoes and spices, folding in ${primary.toLowerCase()} near the end.`,
      },
      {
        title: `${secondary} Sambar`,
        ingredients_used: [secondary, tertiary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Toor dal', 'Drumstick', 'Tamarind', 'Sambar powder'],
        time_minutes: 35,
        servings: 4,
        difficulty: 'Medium',
        instructions_brief: `Cook dal and vegetables with tamarind and sambar powder, adding ${secondary.toLowerCase()} for bulk.`,
      },
      {
        title: `${primary} Coconut Poriyal`,
        ingredients_used: [primary],
        ingredients_needed: noAlliumNeeded,
        time_minutes: 18,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Temper mustard seeds, sauté ${primary.toLowerCase()} with coconut and curry leaves — no onion or garlic.`,
      },
    ],
    gluten_free: [
      {
        title: `${primary} Lemon Rice`,
        ingredients_used: [primary, secondary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Rice', 'Lemon', 'Mustard seeds', 'Peanuts'],
        time_minutes: 22,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Toss steamed rice with tempered spices, lemon juice, and sautéed ${primary.toLowerCase()}.`,
      },
      {
        title: `${secondary} Rasam`,
        ingredients_used: [secondary],
        ingredients_needed: ['Tomato', 'Tamarind', 'Black pepper', 'Curry leaves'],
        time_minutes: 20,
        servings: 3,
        difficulty: 'Easy',
        instructions_brief: `Simmer tamarind broth with pepper and tomatoes, adding ${secondary.toLowerCase()} before serving.`,
      },
      {
        title: `${primary} Idli Podi Bowl`,
        ingredients_used: [primary, tertiary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Rice flour', 'Urad dal flour', 'Sesame oil', 'Curry leaves'],
        time_minutes: 25,
        servings: 2,
        difficulty: 'Medium',
        instructions_brief: `Serve soft idlis with podi and a side of seasoned ${primary.toLowerCase()} — naturally gluten-free.`,
      },
    ],
    high_protein: [
      {
        title: `${primary} Paneer Bhurji`,
        ingredients_used: [primary, secondary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Paneer', 'Eggs', 'Green chilli', 'Cumin'],
        time_minutes: 22,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Scramble crumbled paneer with eggs and ${primary.toLowerCase()} for a protein-packed breakfast.`,
      },
      {
        title: `${secondary} Moong Dal Cheela`,
        ingredients_used: [secondary],
        ingredients_needed: ['Moong dal', 'Ginger', 'Green chilli', 'Coriander'],
        time_minutes: 25,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Blend soaked moong dal into batter, fold in ${secondary.toLowerCase()}, and cook thin savory crepes.`,
      },
      {
        title: `${primary} Soya Keema Matar`,
        ingredients_used: [primary, tertiary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Soya granules', 'Green peas', 'Tomato', 'Garam masala'],
        time_minutes: 28,
        servings: 3,
        difficulty: 'Medium',
        instructions_brief: `Brown soya granules with peas, tomatoes, and ${primary.toLowerCase()} for a hearty high-protein curry.`,
      },
    ],
    quick: [
      {
        title: `${primary} Poha`,
        ingredients_used: [primary, secondary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Flattened rice', 'Mustard seeds', 'Turmeric', 'Lemon'],
        time_minutes: 12,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Rinse poha, temper spices, and fold in ${primary.toLowerCase()} for a quick tiffin.`,
      },
      {
        title: `${secondary} Rava Upma`,
        ingredients_used: [secondary],
        ingredients_needed: ['Semolina', 'Curry leaves', 'Mustard seeds', 'Green chilli'],
        time_minutes: 15,
        servings: 2,
        difficulty: 'Easy',
        instructions_brief: `Roast rava, simmer with tempered spices, and mix in ${secondary.toLowerCase()} until fluffy.`,
      },
      {
        title: `${primary} Curd Rice`,
        ingredients_used: [primary, tertiary].filter((value, index, arr) => arr.indexOf(value) === index),
        ingredients_needed: ['Cooked rice', 'Yogurt', 'Mustard seeds', 'Curry leaves'],
        time_minutes: 10,
        servings: 1,
        difficulty: 'Easy',
        instructions_brief: `Mix rice with yogurt and a quick tadka, stirring in ${primary.toLowerCase()} for a cooling meal.`,
      },
    ],
  };

  const recipes = recipesByFilter[dietaryFilter];
  return `\`\`\`json\n${JSON.stringify(recipes, null, 2)}\n\`\`\``;
}

function parseRecipeResponseText(
  text: string,
  selectedIngredients: string[],
  dietaryFilter: DietaryFilterId,
): Recipe[] {
  const jsonText = extractJsonFromText(text);
  const parsed = JSON.parse(jsonText) as unknown;
  const payloads = parseRecipePayload(parsed);
  return mapToRecipes(payloads, selectedIngredients, dietaryFilter);
}

async function fetchClaudeRecipeText(
  selectedIngredients: string[],
  dietaryFilter: DietaryFilterId,
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Recipe suggestions are unavailable right now.');
  }

  const ingredientList = selectedIngredients.join(', ');
  const userMessage =
    `Ingredients (expiring soon, listed soonest first): ${ingredientList}\n` +
    `Dietary preference: ${dietaryFilterLabel(dietaryFilter)}\n\n` +
    'Return ONLY a JSON array of exactly 3 recipe objects with the requested fields.';

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
  } catch {
    throw new Error('Could not reach the recipe service.');
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many recipe requests. Please try again shortly.');
    }
    throw new Error('Could not load recipe suggestions.');
  }

  let body: {
    content?: Array<{ type?: string; text?: string }>;
  };

  try {
    body = (await response.json()) as typeof body;
  } catch {
    throw new Error('Could not read recipe suggestions.');
  }

  const text =
    body.content
      ?.filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('') ?? '';

  if (!text.trim()) {
    throw new Error('Could not read recipe suggestions.');
  }

  return text;
}

async function fetchRecipeSuggestions(
  selectedIngredients: string[],
  dietaryFilter: DietaryFilterId,
): Promise<Recipe[]> {
  let text: string;

  if (DEV_MOCK_CLAUDE_RESPONSE) {
    await mockDelay(MOCK_RECIPE_DELAY_MS);
    text = buildMockClaudeRecipeText(selectedIngredients, dietaryFilter);
  } else {
    text = await fetchClaudeRecipeText(selectedIngredients, dietaryFilter);
  }

  try {
    return parseRecipeResponseText(text, selectedIngredients, dietaryFilter);
  } catch {
    throw new Error('Could not read recipe suggestions.');
  }
}

export function useRecipeSuggestions(
  selectedIngredients: string[],
  dietaryFilter: DietaryFilterId,
) {
  const queryKeyIngredients = [...selectedIngredients].sort((a, b) => a.localeCompare(b));

  return useQuery({
    queryKey: [RECIPE_SUGGESTIONS_QUERY_KEY, queryKeyIngredients, dietaryFilter],
    queryFn: () => fetchRecipeSuggestions(selectedIngredients, dietaryFilter),
    staleTime: RECIPE_SUGGESTIONS_STALE_TIME_MS,
    enabled: selectedIngredients.length > 0,
  });
}
