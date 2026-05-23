# SHELFSENSE — AI PANTRY MANAGER · MASTER BUILD PROMPT

---

## PRODUCT CONTEXT

You are building **ShelfSense**, a mobile-only AI-powered pantry manager.
Stack: React Native + Expo + TypeScript + NativeWind + Supabase
Navigation: Expo Router with a persistent bottom tab bar (5 tabs).

Problem: People forget food items, miss expiry dates, and waste money.
Solution: A beautiful, intelligent pantry companion that tracks items, warns before they expire, suggests recipes from what's about to go bad, and shows users the real cost of their food waste.

**User story (north star):** A user opens the app, sees at a glance that their milk expires tomorrow and their spinach in 3 days. They tap "Recipes" and ShelfSense instantly suggests a spinach omelette and a milkshake. They make the omelette, mark it as used, and watch their "Waste Saved" counter tick up. That is the core loop. Every screen exists to serve it.

**Core screens:**
1. Dashboard     — urgency overview + quick stats + FAB
2. Pantry         — full item list, filterable, sortable
3. Scan & Add     — photo scan + manual entry form
4. Recipes        — AI suggestions from expiring ingredients
5. Insights       — waste cost, CO₂, trends, monthly report

**Tech rules (non-negotiable):**
- TypeScript strict mode everywhere. No `any`.
- All components are functional with typed props interfaces.
- Supabase for auth, database, and realtime updates.
- React Query for all data fetching and caching.
- React Native Reanimated for all animations.
- Expo Router for navigation (file-based, like Next.js).
- NativeWind for styling (Tailwind utility classes).
- Expo Camera
- Push notifications via Expo Notifications.
- Keep components small and composable. No god components.

---

## DESIGN SYSTEM

### Aesthetic Direction
"Organic luxury minimal" — like a high-end Japanese grocery store.
Warm off-white backgrounds, not stark white. Deep forest green accent.
Aged paper texture subtly layered over backgrounds. The app should feel like it was designed by someone who cares deeply about food and craft. Every element earns its place. Nothing is decorative without purpose.

### Color Palette
- Primary background:   #FAFAF8   (warm off-white, not pure white)
- Secondary background: #F1EFE8   (aged paper tone for cards/chips)
- Surface (cards):      #FFFFFF   (pure white for item cards only)
- Primary text:         #2C2C2A   (near-black, warm undertone)
- Secondary text:       #888780   (warm grey)
- Border:               #E5E3DC   (very subtle warm grey border)

Accent colors — use SPARINGLY, only for data and urgency signals:
- Teal (primary):       #1D9E75   (safe / good / brand)
- Amber (warning):      #BA7517   (expiring in 4–7 days)
- Red (critical):       #A32D2D   (expiring in 1–3 days / expired)
- Blue (info):          #2F5FA0   (neutral data, insights)

### Typography
- Display font:  Fraunces (serif, variable, expressive weight axis)
                 — used ONLY for large numbers and hero headlines
- Body font:     DM Sans (clean, friendly, geometric sans)
                 — used for all UI text, labels, buttons, metadata
- Mono font:     IBM Plex Mono (for stats, codes, data readouts)

Scale: 11 / 12 / 13 / 15 / 17 / 22 / 28 / 36px
Weight: 400 (body), 500 (labels/UI), 600 (headlines)
Letter-spacing: -0.5px on headlines, +0.04em on uppercase labels

### Spacing & Shape
- Base unit: 4px. All spacing is multiples of 4.
- Screen horizontal padding: 20px
- Card border-radius: 14px (standard), 20px (chips/badges), 28px (FAB)
- Card border: 0.5px solid #E5E3DC (hairline, not bold borders)
- Shadows: warm-tinted, low spread. Never harsh drop shadows.
  shadowColor: '#2C2C2A', shadowOpacity: 0.06, shadowRadius: 12

### Signature UI Details
1. **Urgency left-border rule**: Every item card has a 3px left border. Critical = red, Warning = amber, Good = teal. This is the visual grammar of the entire app. Keep it consistent everywhere.

2. **Stat numbers in Fraunces**: All key numbers (24 items, ₹340 saved, 12 days) use the display serif. This creates an editorial, premium feel that separates ShelfSense from every other utility app.

3. **Warm background texture**: Apply a subtle SVG noise overlay at 3% opacity on the primary background. Creates depth without weight.

4. **Floating Action Button**: Teal, 56px, spring animation on mount, teal glow shadow. The only fully saturated element on screen.

5. **Bottom tab bar**: Frosted glass effect (blur: 20, white at 85% opacity). Active tab shows a 4px teal underline indicator, not a filled bg. Tab icons are outline-only. Clean. No filled icon styles.

6. **Staggered entrance animations**: Every list renders with cards fading in from bottom, 60ms delay per item. Never instant render.

7. **Empty states**: Never show a blank screen. Every empty state has a large emoji, a 2-line headline in Fraunces, and a CTA button.

### Motion Principles
- Screen transitions: horizontal slide (Expo Router default stack).
- Card press: scale(0.97), opacity(0.85). Spring, 120ms.
- FAB entry: spring scale from 0 → 1, translateY 20 → 0, delay 400ms.
- Data load: skeleton shimmer (animated gradient, left to right).
- Number changes: count-up animation using Reanimated derived values.
- Modal sheet: slide up from bottom, spring, backdrop blur + dim.

---

## SCREEN 1: DASHBOARD

### Purpose
The first thing a user sees every day. It must answer in 3 seconds: "Do I have anything expiring soon, and what should I do about it?"

### Layout (top to bottom)

**1. Header row**
Left: Dynamic greeting ("Good morning / afternoon / evening") in DM Sans 13px warm grey. Below it: "Your pantry" in DM Sans 28px semibold, near-black, -0.5px letter spacing.
Right: Notification bell button (40px circle, #F1EFE8 background). Red dot indicator appears if any item expires within 3 days.

**2. Stats row** — 3 equal-width cards, horizontally spaced
- Card 1: Total items in pantry. Number in Fraunces 22px. Label: "Total items" in DM Sans 11px grey below.
- Card 2: Expiring soon (≤7 days). ACCENT card — teal light bg. Number in Fraunces teal. Label in teal. This card pops.
- Card 3: Money saved this month vs estimated waste. "₹340" format. Number in Fraunces. Label: "Saved / month".
All cards: #F1EFE8 bg, 12px radius, 14px padding.

**3. "Needs Attention" section** (only renders if urgent items exist)
Section title left-aligned: "Needs attention" DM Sans 15px 600.
Right side: teal link "Get recipes →" — taps to Recipes tab.
Below: Expiry item cards (see ITEM CARD spec below), sorted critical first, then warning. Max 3 shown, "+ N more" if overflow.

**4. "Coming up" section**
Same section title style: "Coming up". Shows items expiring in 8–30 days. Max 3. Same item card style.
Below list: "View all 24 items →" ghost button (border 0.5px, full width, centered text, 14px height, grey text).

**5. Floating Action Button (FAB)**
Position: absolute, bottom 32px, right 24px. Fixed to screen.
Size: 56px circle. Background: #1D9E75 (teal).
Icon: "+" in white, 28px, weight 300 (thin plus, not bold).
Shadow: shadowColor teal, opacity 0.4, radius 16, offset 0 6.
On press: navigates to Scan & Add screen.
Entry animation: spring scale from 0, delay 400ms after screen load.

### Item Card Spec
Height: auto (min ~52px). Background: #FFFFFF. Border-radius: 12px.
Border: 0.5px solid #E5E3DC. Margin-bottom: 8px.
Left border: 3px solid [urgency color] (see color palette).

Left side: Category emoji (24px) + item name (DM Sans 13px 500) + quantity · category (DM Sans 12px grey) stacked vertically.
Right side: Urgency badge pill — rounded, 10px text, matching bg color. "Expires today" / "Tomorrow" / "X days left"

Tap behaviour: navigates to item detail sheet (bottom sheet modal).

### Data
Fetch from Supabase `pantry_items` table filtered by user_id, ordered by expiry_date ASC. Use React Query with 5min stale time. Show skeleton shimmer (3 placeholder cards) while loading. Realtime subscription: re-fetch when pantry_items changes.

---

## SCREEN 2: PANTRY

### Purpose
The full inventory. Users browse, search, filter, and manage everything in their pantry. Power-user screen — dense but organized.

### Layout

**1. Header**
Title: "Pantry" — Fraunces 28px, left-aligned.
Right: Item count chip — "#24 items" in small teal pill.

**2. Search bar**
Full-width below header. Rounded rectangle, #F1EFE8 background.
Placeholder: "Search milk, spinach…" — 13px grey.
Search icon (magnifier) left-padded inside the input.
Clears with an ✕ button when text is present.
On focus: border color transitions to teal (0.5px → 1.5px teal).

**3. Category filter chips** — horizontally scrollable, no scrollbar
Pills: All · Fridge · Freezer · Pantry · Produce · Spices · Drinks
Default: "All" selected. Active pill: teal bg, white text.
Inactive: #F1EFE8 bg, grey text. Pill height 32px, radius 20px.

**4. Sort/filter row**
Left: "Sort: Expiry ↑" — tappable, cycles through: Expiry (soonest) · Expiry (latest) · Name A–Z · Date added
Right: Filter icon button — opens bottom sheet with status and category filters.

**5. Item list**
Grouped by urgency section if sort = Expiry:
Section headers: "Expiring soon", "This week", "This month", "Later"
Each section header: 11px uppercase DM Sans, grey, letter-spaced.
Swipe left to reveal: [🗑 Waste] [✓ Used] action buttons.
Swipe right: [✎ Edit] action button.

**6. Empty state**
Large 🫙 emoji (64px), headline in Fraunces 22px: "Your pantry is empty". Subtext in DM Sans 14px grey: "Tap the + button to add your first item." Teal CTA button: "Add item".

### Item Detail Bottom Sheet
Triggered by tapping any item card across the entire app.
Sheet slides up 75% of screen height. Backdrop dims + blurs.
Contains: drag handle, category emoji at 48px, item name in Fraunces 24px, expiry countdown ring (circular progress in teal/amber/red), info rows, action buttons row: [Mark Used ✓] [Log Waste 🗑] [Edit ✎] [Delete], and "Get recipe ideas →" teal text button.

---

## SCREEN 3: SCAN & ADD

### Purpose
Zero-friction item entry. The goal: open, scan, confirm, done — in under 10 seconds.

### Layout — Two Modes
The scan screen has NO barcode functionality.
Instead, it uses a two-step photo capture flow powered
by Claude Vision.

**Mode A: Scan (default)**
Vision call #1 also returns: item_type: "packaged" | "fresh"
This single flag determines which branch the flow takes.

--- BRANCH A: Packaged items (chips, biscuits, canned goods, etc.) ---

STEP 1 — Front of product
  Full-screen camera view. Overlay text: "Point at the
  front of the product". Large circular shutter button
  at the bottom (white, 72px, teal ring border).
  After capture: photo thumbnail shown top-right.
  Claude Vision call #1 extracts:
    - Product name
    - Brand
    - Category (maps to: dairy/produce/meat/pantry/
      freezer/spices/drinks)
    - Quantity / weight / volume
    - item_type: "packaged"

STEP 2 — Back or bottom of product
  Same camera UI. Overlay text: "Now point at the
  expiry date". Previous photo thumbnail still visible.
  After capture: Claude Vision call #2 extracts:
    - Expiry date (handles: DD/MM/YY, MM/YYYY,
      "Best Before", "Use By", "BBE", "Exp")
    - Normalises all formats to YYYY-MM-DD for storage

STEP 3 — Confirm form
  All fields pre-populated from Vision results.
  User can edit any field before saving.
  Fields: Name · Brand · Category (chip selector) ·
          Quantity · Expiry date (date picker)
  "Add to pantry" teal button — full width, 54px.

--- BRANCH B: Fresh / loose items (vegetables, fruits, grains, dairy) ---

STEP 1 — Single photo
  Same camera UI. Overlay text: "Point at your item".
  Claude Vision call #1 extracts:
    - Item name ("Spinach", "Tomatoes", "Basmati Rice")
    - Category
    - Quantity if visible
    - item_type: "fresh"
  No second photo is taken for fresh items.

STEP 2 — Storage location (replaces expiry photo step)
  Four chip buttons displayed: 🧊 Fridge · ❄️ Freezer · 🫙 Pantry · 🍌 Counter
  Overlay prompt: "Where will you store this?"
  User selects one chip before proceeding.

STEP 3 — Smart expiry suggestion
  App looks up item + storage location in the hardcoded
  SHELF_LIFE_DAYS table (TypeScript Record<string, Record<string, number>>).
  Shows helper text: "[Item] usually lasts [X] days in the [location]."
  Pre-fills expiry date = today + median shelf life days.
  User sees a simple +/− day adjuster instead of a full date picker.
  If item is not found in the table: leave expiry blank with red
  underline. User fills manually. Never block the flow.

SHELF_LIFE_DAYS reference table (hardcode in app):
  spinach:     { fridge: 6,  freezer: 90, pantry: 1,   counter: 1   }
  coriander:   { fridge: 7,  freezer: 30, pantry: 1,   counter: 1   }
  tomato:      { fridge: 7,  freezer: 60, pantry: 5,   counter: 5   }
  onion:       { fridge: 60, freezer: 90, pantry: 30,  counter: 30  }
  potato:      { fridge: 90, freezer: 90, pantry: 21,  counter: 14  }
  carrot:      { fridge: 21, freezer: 90, pantry: 7,   counter: 4   }
  capsicum:    { fridge: 10, freezer: 60, pantry: 4,   counter: 3   }
  banana:      { fridge: 7,  freezer: 90, pantry: 4,   counter: 4   }
  apple:       { fridge: 45, freezer: 90, pantry: 7,   counter: 7   }
  mango:       { fridge: 7,  freezer: 90, pantry: 4,   counter: 3   }
  milk:        { fridge: 4,  freezer: 90, pantry: 0,   counter: 0   }
  curd:        { fridge: 5,  freezer: 0,  pantry: 0,   counter: 0   }
  paneer:      { fridge: 4,  freezer: 60, pantry: 0,   counter: 0   }
  rice:        { fridge: 0,  freezer: 0,  pantry: 365, counter: 300 }
  dal:         { fridge: 0,  freezer: 0,  pantry: 365, counter: 300 }
  atta:        { fridge: 0,  freezer: 0,  pantry: 90,  counter: 60  }
  cooked_food: { fridge: 3,  freezer: 90, pantry: 0,   counter: 0   }

STEP 4 — Confirm form
  Same confirm screen as Branch A.
  Fresh items show this label beneath the expiry date field:
  "Based on typical shelf life · Adjust if needed"
  DM Sans 11px, #888780 warm grey.

--- SHARED RULES (both branches) ---

FALLBACK — If Vision fails on any field:
  That specific field is left blank with a red underline.
  User fills it manually. Never block the flow entirely.

LOADING STATE between photos and confirm:
  Animated "Reading your product…" with a subtle
  teal progress bar. Fraunces font. Not a spinner.

**Mode B: Manual entry**
Clean form on #FAFAF8 background. Fields: item name, category (chip selector), quantity + unit (side-by-side), expiry date (wheel picker), barcode (optional, collapsible).
All inputs: 54px height, 14px radius, #F1EFE8 bg, teal border on focus.
Labels: 11px uppercase DM Sans above each input, grey.
"Add to pantry" button: full-width, 54px, teal, spring scale animation on press.

### Post-Add Confirmation
Success toast slides in from top: "✓ [Item name] added to your pantry" — white text on #2C2C2A background, auto-dismisses after 2.5 seconds.

---

## SCREEN 4: RECIPES

### Purpose
Turn expiring food into meals. The most delightful screen. The AI element must feel magical, not mechanical.

### Layout

**1. Header**
Title: "Recipes" — Fraunces 28px.
Subhead: "Based on what's expiring soon" — DM Sans 13px grey.

**2. Expiring ingredients strip** — horizontal scroll
Ingredient chips of items expiring in ≤7 days. Each chip: emoji + name.
Teal border if selected (default all selected). Tap to deselect.
This is the filter for the AI query — tapping chips re-generates suggestions.

**3. Dietary filter chips** — second scrollable row
"Any · Vegetarian · Vegan · Gluten-free · High-protein · Quick (<20min)"

**4. Recipe cards** — vertical list
Each card: 100% width, #FFFFFF bg, 14px border-radius, 0.5px border.
Left (65%): Recipe name DM Sans 15px 600, ingredient tag pills (matched = teal, missing = grey), meta row "⏱ 20 min · 🔥 2 servings · Easy".
Right (35%): Recipe image placeholder (soft warm gradient rounded rectangle).
Below card: [↗ Full recipe] [♡ Save] micro buttons.
Urgency signal: small red dot + "Uses expiring item" if critical ingredient used.

**5. Loading state**
3 skeleton cards while Claude API call is in flight.
Animated "Checking your pantry…" text with cycling dots, DM Sans 13px teal.

### AI Integration
Call Claude API (claude-sonnet-4-20250514) with system prompt:
"You are a recipe chef assistant. Given a list of ingredients, suggest 3 recipes ranked by how many of these ingredients they use, prioritising the ones expiring soonest. Return JSON with fields: title, ingredients_used[], ingredients_needed[], time_minutes, servings, difficulty, instructions_brief."
Pass user's expiring items + selected dietary filter.
Cache results in React Query for 10 minutes.

---

## SCREEN 5: INSIGHTS

### Purpose
Show users the tangible impact of using ShelfSense. Positive reinforcement through data. Make the numbers feel rewarding — like a personal Spotify Wrapped.

### Layout

**1. Header**
Title: "Insights" — Fraunces 28px.
Right: Month picker — "May 2025 ↓" — taps to cycle months.

**2. Hero stat card**
Full-width. Background: deep teal (#0F6E56).
Large Fraunces number: "₹1,240" — white, 40px.
Label: "saved from waste this year" — DM Sans 13px white 70% opacity.
Sub-row: "↑ 12% vs last month" in small positive green.

**3. 2-col stat grid** (4 cards in 2x2)
- Items saved from waste (Fraunces teal number + "items")
- CO₂ saved (Fraunces number + "kg")
- Current pantry value (Fraunces number + "₹ estimated")
- Avg shelf use (Fraunces number + "% of shelf life used")

**4. Monthly trend chart**
Section title: "Waste over time". Bar chart: 6 months. Wasted (red 30% opacity) vs Saved (teal 40% opacity) stacked per bar. Bars: 8px border-radius top only. Animated growth on mount, staggered 50ms per bar. Use Victory Native or react-native-chart-kit.

**5. Most wasted categories**
Horizontal bar breakdown by category. Emoji + category + proportional bar + %. Max 5 categories.

**6. Share button**
"Share your May report →" — ghost button, full width, teal text.
Generates a shareable image card using React Native ViewShot.

---

## SUPABASE DATA MODEL

### Table: pantry_items
- id            uuid          PRIMARY KEY DEFAULT gen_random_uuid()
- user_id       uuid          NOT NULL REFERENCES auth.users
- name          text          NOT NULL
- category      text          NOT NULL  -- dairy/produce/meat/pantry/etc
- quantity      text          -- "1L", "500g", "3 units"
- expiry_date   date          NOT NULL
- added_date    timestamptz   DEFAULT now()
- barcode       text
- image_url     text
- est_cost      numeric       -- estimated purchase cost in INR
- status        text          DEFAULT 'active'  -- active/used/wasted

### Table: waste_log
- id            uuid          PRIMARY KEY DEFAULT gen_random_uuid()
- user_id       uuid          NOT NULL REFERENCES auth.users
- item_name     text          NOT NULL
- category      text
- wasted_on     date          DEFAULT now()
- est_cost      numeric
- reason        text          -- forgot/expired/opened/other

### Table: recipe_saves
- id            uuid          PRIMARY KEY DEFAULT gen_random_uuid()
- user_id       uuid          NOT NULL REFERENCES auth.users
- recipe_title  text          NOT NULL
- used_items    text[]        -- array of ingredient names
- saved_at      timestamptz   DEFAULT now()

### Table: user_preferences
- user_id         uuid    PRIMARY KEY REFERENCES auth.users
- dietary_pref    text    DEFAULT 'any'
- notify_days     int[]   DEFAULT '{7,3,1}'
- currency        text    DEFAULT 'INR'
- household_size  int     DEFAULT 1

### Row Level Security
Enable RLS on ALL tables.
Policy: users can only SELECT/INSERT/UPDATE/DELETE their own rows WHERE auth.uid() = user_id.

### Push Notifications
When a new item is added, schedule 3 local notifications:
- 7 days before expiry: "🥛 [Item] expires in a week"
- 3 days before expiry: "⚠️ [Item] expires in 3 days"
- 1 day before expiry:  "🚨 [Item] expires tomorrow"
Cancel scheduled notifications if item is marked used/wasted.