# Going Native: React Native vs SwiftUI

## What We Have Now
- **Next.js** (web framework) + **Capacitor** (wraps our website in a native shell)
- The app runs inside Safari (WKWebView) on your iPhone
- Think of it as: a really nice website wearing an app costume
- We get web features (CSS, HTML, JavaScript) but NOT native iOS features

## The Two Native Options

### React Native (with Expo)
- **Language:** TypeScript (same as what we use now)
- **What it is:** Facebook/Meta's framework for building real native apps using JavaScript
- **How it works:** You write TypeScript/React code, but it renders REAL native iOS components (not a webpage)
- **Expo:** A toolkit on top of React Native that handles builds, updates, and deployment. Think of Expo as the "easy button" for React Native
- **Key fact:** ~70-80% of our existing code logic can be reused

### SwiftUI
- **Language:** Swift (Apple's own programming language — totally different from TypeScript)
- **What it is:** Apple's native UI framework, built into every iPhone
- **How it works:** You write Swift code in Xcode, Apple's development tool
- **Key fact:** 0% of our existing code can be reused — full ground-up rewrite
- **Key fact:** Claude is now built INTO Xcode 26.3 (February 2026) — it can write SwiftUI, see previews, and iterate autonomously

---

## The Same Card in All Three Frameworks

### What You Have Now (Next.js / Web)
```tsx
// Web — uses HTML elements (div, span, img) + CSS classes
<Link href={`/match/${match.id}`}>
  <div className="p-3 glass-match-card">
    <div className="flex items-center justify-between">
      <img src={match.leagueLogo} className="h-5 w-5" />
      <span className="text-sm uppercase">{match.league}</span>
      <span className="glass-badge-live">{match.time}</span>
    </div>
    <div className="flex items-center">
      <img src={match.homeLogo} className="h-8 w-8" />
      <span className="text-base font-medium">{match.home}</span>
      <div className="glass-score font-mono">{score}</div>
      <span className="text-base font-medium">{match.away}</span>
      <img src={match.awayLogo} className="h-8 w-8" />
    </div>
  </div>
</Link>
```

### React Native (Expo) — Same Language, Different Components
```tsx
// React Native — uses native components (View, Text, Image) + NativeWind (Tailwind)
// Notice: still TypeScript, still React, still looks familiar
<Pressable onPress={() => router.push(`/match/${match.id}`)}>
  <View className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
    <View className="flex-row items-center justify-between">
      <Image source={{ uri: match.leagueLogo }} className="h-5 w-5" />
      <Text className="text-sm uppercase">{match.league}</Text>
      <Text className="bg-red-500/20 px-3 py-1 rounded-lg">{match.time}</Text>
    </View>
    <View className="flex-row items-center">
      <Image source={{ uri: match.homeLogo }} className="h-8 w-8" />
      <Text className="text-base font-medium">{match.home}</Text>
      <Text className="font-mono bg-white/5 px-3 py-2 rounded-lg">{score}</Text>
      <Text className="text-base font-medium">{match.away}</Text>
      <Image source={{ uri: match.awayLogo }} className="h-8 w-8" />
    </View>
  </View>
</Pressable>
```

**What changed:**
- `<div>` becomes `<View>` (a native container, not HTML)
- `<span>` becomes `<Text>` (native text, not HTML)
- `<img>` becomes `<Image source={{ uri: url }}>` (native image loader)
- `<Link href>` becomes `<Pressable onPress>` (native tap handler)
- `flex` becomes `flex-row` (React Native defaults to vertical, web defaults to horizontal)
- Everything else looks almost identical

### SwiftUI — Different Language Entirely
```swift
// SwiftUI — Swift language, modifier chains instead of CSS classes
NavigationLink(destination: MatchDetailView(matchId: match.id)) {
    VStack(spacing: 12) {
        HStack {
            AsyncImage(url: URL(string: match.leagueLogo)) { image in
                image.resizable().aspectRatio(contentMode: .fit)
            } placeholder: { Color.clear }
            .frame(width: 20, height: 20)

            Text(match.league)
                .font(.caption)
                .textCase(.uppercase)

            Spacer()

            Text(match.time)
                .font(.system(.caption, design: .monospaced))
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(Color.red.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }

        HStack {
            AsyncImage(url: URL(string: match.homeLogo)) { ... }
                .frame(width: 32, height: 32)
            Text(match.home).font(.body).fontWeight(.medium)
            Spacer()
            Text(score)
                .font(.system(.body, design: .monospaced))
                .padding(12)
                .background(.ultraThinMaterial) // NATIVE glass — one line!
                .clipShape(RoundedRectangle(cornerRadius: 8))
            Spacer()
            Text(match.away).font(.body).fontWeight(.medium)
            AsyncImage(url: URL(string: match.awayLogo)) { ... }
                .frame(width: 32, height: 32)
        }
    }
    .padding(12)
    .background(.ultraThinMaterial) // Real Apple liquid glass
    .clipShape(RoundedRectangle(cornerRadius: 16))
}
```

**What changed:**
- Completely different language (Swift, not TypeScript)
- No CSS at all — every style is a "modifier" chained with dots
- `.background(.ultraThinMaterial)` = Apple's NATIVE frosted glass in ONE line
  (vs our 15+ lines of CSS backdrop-filter, rgba, box-shadow, etc.)
- `HStack` = horizontal layout, `VStack` = vertical layout (instead of flex-row/flex-col)
- `NavigationLink` = built-in navigation (no router library)
- Type system is stricter — Swift uses `Int?` (optional) instead of `number | null`

---

## Backend & API: What Breaks, What Stays

### Our Current Backend Stack
- Next.js API routes on Vercel (e.g., `/api/match/[id]/route.ts`)
- Supabase for caching (PostgreSQL + auth)
- ESPN REST API + API-Football for data
- SWR for client-side data fetching

### React Native: Almost Nothing Changes

| What | Status | Details |
|------|--------|---------|
| API routes on Vercel | **No change** | Mobile app just calls same URLs via fetch() |
| Supabase | **Tiny change** | Same JS SDK, just swap localStorage for AsyncStorage |
| SWR | **No change** | Works identically in React Native |
| API helper files (lib/) | **Reuse 90%+** | Same TypeScript, same fetch calls |
| Data types (lib/types/) | **Reuse 100%** | Identical TypeScript interfaces |
| Theme system | **Reuse ~80%** | Same React Context, adapt CSS vars to RN styles |

### SwiftUI: Everything Client-Side Must Be Rewritten

| What | Status | Details |
|------|--------|---------|
| API routes on Vercel | **No change** | Swift app calls same URLs |
| Supabase | **Different SDK** | Must use `supabase-swift` — different API, full rewrite |
| SWR | **No equivalent** | Use Swift async/await + @Published properties |
| API helper files | **100% rewrite** | All TypeScript must become Swift |
| Data types | **100% rewrite** | Swift uses `Codable` structs instead of TS interfaces |
| Theme system | **100% rewrite** | SwiftUI uses @Environment, not React Context |

---

## Cost Comparison

### Development Cost (Time to Feature Parity)

| | React Native (Expo) | SwiftUI |
|---|---|---|
| Code reuse from current app | 60-80% | 0% |
| Estimated rebuild time | 2-3 months | 4-6 months |
| Language learning curve | None (still TypeScript) | Significant (new language) |
| AI coding assistance | Excellent (Claude Code, same as now) | Good (Claude in Xcode 26.3) |

### Ongoing Costs

| | React Native (Expo) | SwiftUI |
|---|---|---|
| Apple Developer Account | $99/year | $99/year |
| EAS Build (Expo cloud builds) | Free tier: 30 builds/month | N/A (use Xcode on Mac) |
| Vercel (API routes) | Same as now | Same as now |
| Supabase | Same as now | Same as now |
| Android support | Included (same codebase) | Requires separate Kotlin app |
| Hosting | Same Vercel backend | Same Vercel backend |

### Maintenance Cost

| Factor | React Native (Expo) | SwiftUI |
|---|---|---|
| Expo SDK updates | Every ~3 months (usually smooth) | N/A |
| SwiftUI updates | N/A | Yearly at WWDC (usually additive) |
| Dependency management | Moderate (npm packages) | Low (Apple-managed) |
| Bug fix deployment | **Instant** (OTA updates, no App Store review) | 1-3 days (requires App Store review) |
| Codebases to maintain | 1 (covers iOS + Android + optionally web) | 2 (web stays separate from iOS) |

---

## The OTA Update Advantage (React Native)

This is a BIG deal for a live sports app:

**React Native (Expo):** If a score is displaying wrong at 2am during a Premier League match, you can:
1. Fix the code
2. Run `eas update` from terminal
3. Users get the fix within minutes — NO App Store review

**SwiftUI:** Same bug at 2am:
1. Fix the code
2. Build in Xcode
3. Submit to App Store
4. Wait 24-48 hours for Apple review
5. Users finally get the fix 1-3 days later

For a live scores app, this is critical.

---

## Claude + Xcode 26.3 (The Game Changer)

### What Happened
- **September 2025:** Claude Sonnet became available in Xcode 26 as a coding assistant
- **February 2026:** Xcode 26.3 launched with the full **Claude Agent SDK** — the same brain that powers Claude Code, now inside Xcode

### What Claude Can Do in Xcode
- **Write SwiftUI code** and see the preview render
- **Take screenshots** of what it built and check if it looks right
- **Iterate autonomously** — finds bugs, fixes them, verifies the fix
- **Search Apple's documentation** directly while building
- **Explore your entire project** — understands how files connect
- **Run builds and tests** to verify code works

### Real-World Proof
A developer shipped a 20,000-line macOS app (called "Context") built **95% by Claude Code** using SwiftUI. Fewer than 1,000 lines written by hand.

### What This Means for You
SwiftUI was previously a harder option because Claude Code worked better with web/TypeScript. Now Claude is equally capable in both:
- **Claude Code** (terminal) = your current workflow for Next.js/TypeScript
- **Claude in Xcode** = same agentic capabilities for Swift/SwiftUI
- **They can even connect** via MCP — Claude Code can talk to Xcode

---

## What's Actually Different Day-to-Day

### React Native Developer Experience
```
Your workflow stays almost the same:
1. Open VS Code / Cursor
2. Tell Claude Code what to build
3. Claude writes TypeScript/React
4. See changes on your phone via Expo Go app (live reload)
5. Deploy: `eas build` + `eas submit`
6. Hotfix: `eas update` (instant, no App Store)
```

### SwiftUI Developer Experience
```
New workflow:
1. Open Xcode
2. Tell Claude (in Xcode) what to build
3. Claude writes Swift/SwiftUI
4. See changes in Xcode Previews (or on connected iPhone)
5. Deploy: Archive > Upload to App Store Connect
6. Hotfix: Archive > Upload > Wait for Apple review (1-3 days)
```

---

## The Transition: How It Would Actually Work

### Phase 1: Keep Current App Running
- Don't touch the existing Next.js + Capacitor app
- It keeps working, users keep using it

### Phase 2: Build Native Shell
- Set up new React Native (Expo) OR SwiftUI project
- Build the home page first (game cards, filters, sections)
- Point it at your SAME Vercel API routes (no backend changes)
- Compare side by side with your web version

### Phase 3: Screen by Screen Migration
- Match detail page
- Team pages
- Standings
- Calendar
- Search
- Each screen is independent — ship when ready

### Phase 4: Native-Only Features
- Real Apple liquid glass (UIGlassEffect) — SwiftUI only
- Native haptics (beyond what Capacitor provides)
- Native transitions and gestures
- Live Activities on lock screen
- Dynamic Island integration for live scores
- Widgets for home screen scores

### Phase 5: App Store Launch
- Submit native app
- Keep web app running (it's your fallback + Android solution)
- Gradually sunset the Capacitor wrapper

---

## Which Files Transfer to React Native (Expo)

### Reuse Directly (copy & adapt)
- `lib/types/*.ts` — All type definitions (100% reusable)
- `lib/constants/*.ts` — Leagues, nations, tournaments (100% reusable)
- `lib/search-data.ts` — Search logic (100% reusable)
- `lib/api-football.ts` — API calls (95% reusable, just fetch())
- `lib/api-espn-*.ts` — ESPN helpers (95% reusable)
- `lib/use-favorites.ts` — Favorites logic (90% reusable)
- `lib/theme.tsx` — Theme values (reuse colors/values, adapt delivery)
- `lib/haptics.ts` — Replace with expo-haptics (same concept)
- `app/api/**` — ALL server routes stay on Vercel unchanged

### Must Rebuild for React Native
- All components (MatchCard, NBAGameCard, etc.) — same logic, different JSX
- `app/globals.css` — No CSS; recreate as StyleSheet or NativeWind
- Navigation — Replace Next.js pages with Expo Router screens
- `app/layout.tsx` — Replace with Expo's root layout

### Must Rebuild Completely for SwiftUI
- Everything. Every single file. New language, new framework.
- Server API routes still stay on Vercel though.

---

## Bottom Line

| | React Native (Expo) | SwiftUI |
|---|---|---|
| **Best for** | Fastest path to native, code reuse, iOS + Android | Best possible iOS experience, Apple ecosystem all-in |
| **Time to rebuild** | 2-3 months | 4-6 months |
| **New language?** | No (TypeScript) | Yes (Swift) |
| **Glass effect** | Better than web, not as good as native Apple | `.ultraThinMaterial` = Apple's real liquid glass |
| **Claude support** | Claude Code (excellent) | Claude in Xcode 26.3 (excellent, new) |
| **Android** | Included | Separate app needed |
| **OTA updates** | Yes (instant fixes) | No (App Store review required) |
| **Risk** | Low (proven path, huge community) | Medium (full rewrite, iOS-only) |
| **My recommendation** | **Start here** if going native | Consider for v3 if iOS-only is fine |

### My Honest Take
If I were advising you as your technical partner:

1. **Right now:** Stay on Next.js + Capacitor. Ship the product, get users, validate.
2. **If going native:** React Native + Expo first. You keep TypeScript, reuse 70%+ of code, get Android for free, and ship OTA updates instantly.
3. **Long term:** If Ball Knowledge becomes iOS-focused and you want the absolute premium Apple experience, SwiftUI rewrite with Claude in Xcode. But only when the product is proven and the feature set is stable.

The Claude + Xcode 26.3 integration makes the SwiftUI option more viable than it was 6 months ago. But React Native is still the pragmatic move for a one-person team who needs to iterate fast.
