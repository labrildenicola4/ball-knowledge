# Learning Path: From Prompter to Product Lead

This guide is designed to help you transition from "prompting" code to "reading" and understanding it. You don't need to memorize syntax to be an effective lead; you just need to understand the **logic** and **flow**.

We will learn by **Reverse Engineering**: looking at your working code and breaking it down.

---

## Phase 1: The "Face" (Frontend Components)
**Goal:** Understand how the visual parts are built and how they get data.

### Concept: Components
Think of a Component as a custom LEGO brick. You build small bricks (`Button`, `Card`) and assemble them into larger structures (`Header`, `Page`).

### 🔎 Case Study: `components/LeagueTabs.tsx`
[Open this file](file:///Users/miliabril/Desktop/ball-knowledge-v4/components/LeagueTabs.tsx) and look at the code.

**1. The Setup (Imports & Props)**
```typescript
// Imports tools we need from other files
import { useTheme } from '@/lib/theme';

// "Props" are the settings for this brick.
// Here, this component accepts two settings:
// 1. activeLeague: Which one is currently clicked?
// 2. onLeagueChange: What function do I run when clicked?
interface LeagueTabsProps {
  activeLeague: string;
  onLeagueChange: (leagueId: string) => void;
}
```

**2. The Data (Static Lists)**
Lines 5-28 define `const leagues`. This is a hardcoded list.
*   **PM Insight:** If you wanted to add "MLS" to your tabs, you would just add a line here. You don't need to ask an AI to "rewrite the logic," just "add an item to the array."

**3. The Rendering (Mapping)**
Lines 43-56 are the magic. instead of writing 10 `<button>` tags, we use `.map()`:
```typescript
{leagues.map((league) => (
  <button ... >
    {league.icon} {league.name}
  </button>
))}
```
*   **PM Insight:** If a bug appears on *all* buttons, the issue is inside this loop. If it's only on *one*, it's likely bad data in the list.

### 🎯 Mini-Exercise
1.  Open `components/LeagueTabs.tsx`.
2.  Find the `leagues` list.
3.  Change the icon for 'Premier' from 🏴󠁧󠁢󠁥󠁮󠁧󠁿 to 🦁.
4.  Save and see the change instantly on your local site (`npm run dev`).

---

## Phase 2: The "Brain" (Data & APIs)
**Goal:** Understand where data comes from and how expensive/difficult it is to get.

### Concept: The API Request
Your app doesn't "know" the score. It asks a server [API-Football](https://www.api-football.com/documentation-v3) for the score. This takes time, which is why we use `async` (wait for it) and `await` (it's here).

### 🔎 Case Study: `lib/api-football.ts`
[Open this file](file:///Users/miliabril/Desktop/ball-knowledge-v4/lib/api-football.ts).

**1. The Credentials**
```typescript
const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY!;
```
*   **PM Insight:** `process.env` means "Environment Variable". These are secrets. If your API stops working, the first question is "Is the API Key valid?" and "Is it in the `.env` file?"

**2. The Fetch Function**
Look at the `fetchApi` function (around line 26).
*   **Caching (Lines 40-44):** The code checks a `cache` before asking the internet.
    *   *Why?* APIs cost money per call. Caching saves money and makes the app faster.
*   **Error Handling (Lines 60-78):** It checks `!response.ok` or `data.errors`.
    *   *PM Insight:* If the app says "API Error", this is the code reporting it.

### 🎯 Mini-Exercise
1.  In `lib/api-football.ts`, look for `console.log`.
2.  Specifically line 46: `console.log('[API-Football] Fetching: ${url}');`.
3.  This refers to your **Server Terminal** (where you run `npm run dev`), not the browser console.
4.  Watch your terminal while you click around the app. You will see exactly what data is being requested in real-time.

---

## Phase 3: The "Skeleton" (Routing)
**Goal:** Understand how the URL (`/nba/team/123`) maps to a file.

### Concept: File-System Routing
Next.js uses folders to create URLs.

*   URL: `/basketball` -> File: `app/basketball/page.tsx`
*   URL: `/nba/team/123` -> File: `app/nba/team/[id]/page.tsx`

**PM Insight:**
If you want to change the layout of the **Team Details** page, you don't look in `components`. You look in `app/nba/team/[id]/page.tsx`. That file acts as the "Traffic Controller", calling simpler components like `<MatchLineup />` or `<Header />`.

---

## Challenge: Adding a New League (MLS)

Ready to graduate? Let's add Major League Soccer (MLS) to your app.

**Step 1: Get the ID**
The API-Football ID for MLS is **253**.

**Step 2: Update the Logic (`lib/constants/leagues.ts`)**
1.  Find `export const LEAGUES`.
2.  Add this line:
    ```typescript
    { key: 'mls', slug: 'major-league-soccer', id: 253, code: 'MLS', name: 'Major League Soccer', shortName: 'MLS', country: 'USA', type: 'league' },
    ```
3.  Scroll down to `LEAGUE_ID_TO_CODE` and add:
    ```typescript
    253: 'MLS',
    ```
4.  Scroll down to `CODE_TO_LEAGUE_KEY` and add:
    ```typescript
    'MLS': 'mls',
    ```

**Step 3: Update the UI (`components/LeagueTabs.tsx`)**
1.  Find `const leagues`.
2.  Add this line:
    ```typescript
    { id: 'mls', name: 'MLS', icon: '🇺🇸' },
    ```

**Step 4: Verify**
Run `npm run dev` and click the new "MLS" tab. If you see matches, you just successfully shipped a new feature!

---

## Recommended Learning Resources

1.  **"Just JavaScript" by Dan Abramov:** Excellent mental models for how code works.
2.  **Tailwind CSS Cheat Sheet:** [nerdcave.com/tailwind](https://nerdcave.com/tailwind-cheat-sheet). Great for understanding styling.
3.  **Vercel/Next.js Documentation:** Very readable, even for non-devs. Read the "Basic Features" section.

## Terminology for PMs

*   **Client-Side (Frontend):** Runs on the user's phone/laptop. (React, CSS).
*   **Server-Side (Backend):** Runs on Vercel's computers. (API calls, Database secrets).
*   **Deployment:** The process of moving code from your laptop (Local) to the internet (Production).
*   **Environmental Variables:** Secrets (API keys) that live outside the code for security.

---

**Next Step:** Choose one small visual tweak (e.g., "Make the live score red") and try to find the specific line of code that controls it using your new "Inspect" skills.
