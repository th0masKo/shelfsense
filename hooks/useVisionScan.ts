import { useCallback, useState } from 'react';
import {
  normalizeCategoryFromVision,
  type PantryCategoryId,
} from '../constants/scanCategories';

// SET TO false BEFORE BUYING CREDITS / FOR PRODUCTION
const DEV_MOCK_VISION_RESPONSE = true;

const MOCK_VISION_DELAY_MS = 1500;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const VISION_MODEL = 'claude-haiku-4-5-20251001';

const FRONT_SYSTEM_PROMPT =
  "You are a food product recognition assistant. Return ONLY a valid JSON object — no markdown, no backticks, no explanation. Fields: name (string), brand (string), category (one of: vegetables/fruits/dairy/pulses_and_grains/masalas_and_spices/snacks_and_packaged/meat_and_seafood/drinks/condiments), quantity (string e.g. '1L', '500g', '3 units'). Return null for any field you cannot confidently detect.";

const BACK_SYSTEM_PROMPT =
  'You are an expiry date extraction assistant. Return ONLY a valid JSON object — no markdown, no backticks, no explanation. Fields: expiry_date (string, YYYY-MM-DD). Handle all label formats including: DD/MM/YY, MM/YYYY, Best Before, Use By, BBE, Exp, and Indian MFD+Shelf Life format (e.g. \'MFD: JAN 2025, Shelf Life: 9 Months\' → compute expiry as MFD date + shelf life duration). Return null if you cannot detect the date.';

export type ItemType = 'packaged' | 'fresh';

export interface FrontScanResult {
  name: string | null;
  brand: string | null;
  category: PantryCategoryId | null;
  quantity: string | null;
  item_type: ItemType | null;
  undetected: Set<string>;
}

export interface BackScanResult {
  expiry_date: string | null;
  undetected: Set<string>;
}

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(extractJsonText(text));
    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function readStringField(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function callVisionApi(base64: string, systemPrompt: string): Promise<string | null> {
  if (DEV_MOCK_VISION_RESPONSE) {
    await mockVisionDelay(MOCK_VISION_DELAY_MS);
    if (systemPrompt === FRONT_SYSTEM_PROMPT) {
      return buildMockFrontVisionText();
    }
    if (systemPrompt === BACK_SYSTEM_PROMPT) {
      return buildMockBackVisionText();
    }
    return null;
  }

  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-only-key': 'true',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: 'Analyze this image and return the JSON object.' },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[Vision] HTTP error', response.status, errBody);
      return null;
    }

    const data: unknown = await response.json();
    const content = (data as any)?.content;
    if (!Array.isArray(content) || content.length === 0) return null;
    const text = (content[0] as any)?.text;
    return typeof text === 'string' ? text : null;
  } catch (e) {
    console.error('[Vision] fetch error', e);
    return null;
  }
}

const FRESH_CATEGORIES = new Set<PantryCategoryId>(['vegetables', 'fruits']);

function inferItemType(
  explicit: string | null,
  category: PantryCategoryId | null,
): ItemType | null {
  if (explicit === 'packaged' || explicit === 'fresh') return explicit;
  if (category != null && FRESH_CATEGORIES.has(category)) return 'fresh';
  if (category != null) return 'packaged';
  return null;
}

function parseExpiryDate(raw: string | null): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (dmyMatch) {
    const day = Number.parseInt(dmyMatch[1], 10);
    const month = Number.parseInt(dmyMatch[2], 10);
    let year = Number.parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return null;
}

function mockVisionDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildMockFrontVisionText(): string {
  return JSON.stringify({
    name: 'Amul Taaza Toned Milk',
    brand: 'Amul',
    category: 'dairy',
    quantity: '1L',
  });
}

function buildMockBackVisionText(): string {
  return JSON.stringify({
    expiry_date: '15/08/26',
  });
}

export function useVisionScan() {
  const [isScanning, setIsScanning] = useState(false);

  const scanFront = useCallback(async (base64: string): Promise<FrontScanResult> => {
    const undetected = new Set<string>();
    setIsScanning(true);

    try {
      const text = await callVisionApi(base64, FRONT_SYSTEM_PROMPT);
      const obj = text != null ? parseJsonObject(text) : null;

      if (obj == null) {
        return {
          name: null,
          brand: null,
          category: null,
          quantity: null,
          item_type: null,
          undetected: new Set(['name', 'brand', 'category', 'quantity', 'item_type']),
        };
      }

      const name = readStringField(obj, 'name');
      const brand = readStringField(obj, 'brand');
      const quantity = readStringField(obj, 'quantity');
      const categoryRaw = readStringField(obj, 'category');
      const category = normalizeCategoryFromVision(categoryRaw);
      const item_type = inferItemType(readStringField(obj, 'item_type'), category);

      if (name == null) undetected.add('name');
      if (brand == null) undetected.add('brand');
      if (category == null) undetected.add('category');
      if (quantity == null) undetected.add('quantity');
      if (item_type == null) undetected.add('item_type');

      return { name, brand, category, quantity, item_type, undetected };
    } catch {
      return {
        name: null,
        brand: null,
        category: null,
        quantity: null,
        item_type: null,
        undetected: new Set(['name', 'brand', 'category', 'quantity', 'item_type']),
      };
    } finally {
      setIsScanning(false);
    }
  }, []);

  const scanBack = useCallback(async (base64: string): Promise<BackScanResult> => {
    const undetected = new Set<string>();
    setIsScanning(true);

    try {
      const text = await callVisionApi(base64, BACK_SYSTEM_PROMPT);
      const obj = text != null ? parseJsonObject(text) : null;

      if (obj == null) {
        undetected.add('expiry_date');
        return { expiry_date: null, undetected };
      }

      const expiry_date = parseExpiryDate(readStringField(obj, 'expiry_date'));
      if (expiry_date == null) undetected.add('expiry_date');

      return { expiry_date, undetected };
    } catch {
      undetected.add('expiry_date');
      return { expiry_date: null, undetected };
    } finally {
      setIsScanning(false);
    }
  }, []);

  return { isScanning, scanFront, scanBack };
}
