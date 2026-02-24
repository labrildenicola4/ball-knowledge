# iOS App Readiness Audit — Ball Knowledge

**Date:** 2026-02-24
**Status:** Apple Developer Account — processing
**App Logo:** In progress

---

## Executive Summary

Ball Knowledge is a **Next.js 14 Progressive Web App (PWA)** deployed on Vercel. There is **no native iOS project** (no Xcode project, no `ios/` directory, no Capacitor config). The app currently runs in Safari and can be added to the iOS home screen via "Add to Home Screen."

To ship on the **Apple App Store**, the project needs either:

1. **Option A — Native wrapper (Capacitor):** Wrap the existing web app in a Capacitor shell to produce an `.ipa` for App Store submission. Requires Apple Developer Account.
2. **Option B — Continue as PWA only:** No App Store listing. Users install via Safari. No Apple Developer Account needed.

This audit covers readiness for **both paths**.

---

## 1. Current Architecture

| Aspect | Status |
|---|---|
| Framework | Next.js 14.1.0 (App Router) |
| UI | React 18 + Tailwind CSS 3.4 |
| Backend | Supabase (PostgreSQL + Auth) |
| Hosting | Vercel (standalone output) |
| Auth | Google OAuth via Supabase |
| Data APIs | ESPN API, API-Football, Polymarket |
| PWA manifest | Present (`public/manifest.json`) |
| Native iOS project | **Not present** |
| Capacitor installed | **No** (referenced in `lib/haptics.ts` but not in `package.json`) |

---

## 2. PWA Readiness (Current State)

### 2.1 What's Working Well

| Item | Location | Status |
|---|---|---|
| `manifest.json` with name, display, theme | `public/manifest.json` | Done |
| `apple-mobile-web-app-capable` meta tag | `app/layout.tsx:51` | Done |
| `apple-mobile-web-app-status-bar-style` | `app/layout.tsx:52` | Done |
| `apple-mobile-web-app-title` | `app/layout.tsx:53` | Done |
| `viewport-fit: cover` | `app/layout.tsx:26` | Done |
| Safe area inset handling (top) | `components/Header.tsx:112` | Done |
| Safe area inset handling (bottom) | `components/BottomNav.tsx:60`, `app/layout.tsx:96` | Done |
| Safe area inset handling (left/right) | `app/globals.css:657-662` | Done |
| `-webkit-tap-highlight-color: transparent` | `app/globals.css:35` | Done |
| `touch-action: manipulation` | `app/globals.css:36` | Done |
| 44px minimum touch targets | `app/globals.css:674-678` | Done |
| `-webkit-backdrop-filter` prefixes | `app/globals.css` (throughout) | Done |
| `-webkit-overflow-scrolling: touch` | `app/globals.css:704` | Done |
| Dark mode support | `lib/theme.tsx` + CSS variables | Done |
| Theme color (light/dark variants) | `app/layout.tsx:27-30` | Done |
| `display: standalone` mode | `public/manifest.json:6` | Done |
| Portrait orientation lock | `public/manifest.json:9` | Done |
| Haptic feedback utility (Capacitor-ready) | `lib/haptics.ts` | Done |
| Hide-on-scroll bottom nav | `components/BottomNav.tsx` | Done |
| Page enter animations | `app/globals.css:782-788` | Done |
| iOS-native press feedback | `app/globals.css:766-771` | Done |

### 2.2 Critical Issues

#### MISSING: PWA Icons (`public/icons/`)
- **Problem:** `icon-192.png` and `icon-512.png` do **not exist**. The directory only contains a `README.md` placeholder.
- **Impact:** PWA install prompt will fail. Home screen icon will be a blank screenshot. `apple-touch-icon` in `layout.tsx:58` points to a nonexistent file.
- **Fix:** Generate `icon-192.png` (192x192) and `icon-512.png` (512x512) from the app logo (once finalized) and place in `public/icons/`.
- **Apple-specific:** Also need a `180x180` apple-touch-icon for best iOS results. The current 192px icon will work but a dedicated 180px is recommended.

#### MISSING: Splash Screens (`public/splash/`)
- **Problem:** `layout.tsx:61-85` references 5 splash screen images but the `public/splash/` directory does **not exist**.
- **Impact:** iOS standalone mode will show a white/blank screen during app load instead of a branded splash.
- **Required files:**
  - `splash-640x1136.png` (iPhone 5/SE 1st gen)
  - `splash-750x1334.png` (iPhone 6/7/8/SE 2-3)
  - `splash-1242x2208.png` (iPhone 6+/7+/8+)
  - `splash-1125x2436.png` (iPhone X/XS/11 Pro)
  - `splash-1284x2778.png` (iPhone 12-14 Pro Max)
- **Note:** Missing coverage for iPhone 14 Pro (1179x2556), iPhone 15 Pro Max (1290x2796), and iPhone 16 series.

#### MISSING: favicon.ico
- **Problem:** No `favicon.ico` in `public/`. Browsers and some iOS contexts will request this.
- **Fix:** Generate from app logo.

#### MISSING: Service Worker / Offline Support
- **Problem:** No service worker, no `next-pwa`, `serwist`, or `workbox` configuration found. The app is fully online-only.
- **Impact on PWA:** Modern PWA install criteria (Chrome) typically require a service worker. iOS Safari doesn't enforce this for "Add to Home Screen" but the experience degrades — no offline fallback page, no asset caching.
- **Impact on App Store:** If wrapping with Capacitor, this is less critical (WKWebView handles caching differently), but offline-first is still recommended for sports data already fetched.

#### manifest.json — `screenshots` Array Empty
- **Problem:** `public/manifest.json:28` has `"screenshots": []`.
- **Impact:** Modern browsers (Android Chrome especially) show a richer install dialog when screenshots are present. Low priority for iOS but good practice.

---

## 3. App Store Submission Readiness (Capacitor Path)

If pursuing an App Store listing, these are the requirements and gaps:

### 3.1 Apple Developer Account
- **Status:** Processing (acknowledged)
- **Required for:** Signing certificates, provisioning profiles, App Store Connect access, TestFlight

### 3.2 Native Shell (Not Yet Created)

| Requirement | Status | Notes |
|---|---|---|
| Capacitor installed | Missing | Not in `package.json` dependencies |
| `capacitor.config.ts` | Missing | Needs app ID, name, webDir config |
| `ios/` Xcode project | Missing | Generated by `npx cap add ios` |
| Podfile | Missing | Generated with Capacitor iOS |
| Info.plist | Missing | Generated, needs privacy keys |
| App icons (Xcode asset catalog) | Missing | Requires 1024x1024 + all device sizes |
| LaunchScreen.storyboard | Missing | Generated, needs customization |
| Signing & capabilities | Missing | Requires Developer Account |

### 3.3 App Store Connect Metadata (All Missing)

| Requirement | Status |
|---|---|
| App Name | "Ball Knowledge" (ready) |
| Bundle ID | Not configured (suggest: `com.ballknowledge.app`) |
| App Category | Sports |
| Age Rating | Likely 4+ (no objectionable content) |
| Privacy Policy URL | **Not found in codebase** — required by Apple |
| App description (4000 chars max) | Not drafted |
| Keywords (100 chars) | Not drafted |
| Screenshots (6.7", 6.5", 5.5" iPhones + iPad) | Not created |
| 1024x1024 App Store icon | Pending (logo in progress) |
| Support URL | **Not found in codebase** — required by Apple |
| Copyright | Not configured |
| Version number | `1.0.0` in package.json (usable) |

### 3.4 App Review Considerations

| Concern | Risk Level | Detail |
|---|---|---|
| Guideline 4.2 — Minimum Functionality | **Medium** | Apple rejects apps that are "just a website." The app needs native-feeling features beyond what Safari provides. Haptics (`lib/haptics.ts`) help. Consider adding: push notifications, widget, live activities, or native share sheet. |
| Guideline 5.1.1 — Data Collection | **Low** | Google OAuth + Supabase. Need a privacy policy and App Privacy details in App Store Connect. |
| Guideline 2.1 — Performance | **Low** | App appears performant. CSS contains `contain: layout style paint` and `translateZ(0)` GPU hints throughout. |
| Guideline 4.0 — Design | **Low** | UI already has iOS-native feel (glass morphism, safe areas, touch targets). |
| Guideline 3.1.1 — In-App Purchase | **N/A** | No paid features detected. |
| Guideline 5.1.2 — Data Use & Sharing | **Low** | Uses ESPN/API-Football data. Ensure terms allow redistribution in a native app context. |

---

## 4. iOS-Specific UX Audit

### 4.1 Good Practices Already in Place

- **Safe area insets:** Properly handled on all four edges (Header top, BottomNav bottom, body left/right, main content bottom padding).
- **Touch targets:** Global CSS enforces 44px min-height/min-width on buttons and links per Apple HIG.
- **Tap feedback:** `-webkit-tap-highlight-color: transparent` with custom `.tap-highlight` and `.card-press` animations.
- **Scroll behavior:** `-webkit-overflow-scrolling: touch` and `overscroll-behavior-x: none` for native-feeling scroll.
- **Scroll snap:** `scroll-snap-type: x mandatory` for horizontal scrolling carousels.
- **Backdrop filter:** All glass effects use `-webkit-backdrop-filter` prefix (required on iOS Safari).
- **User scaling disabled:** `maximumScale: 1, userScalable: false` prevents accidental zoom on forms.
- **Dark mode:** Full light/dark theme with system preference detection.
- **Font rendering:** Using system-compatible fonts with Google Fonts link preconnect.
- **Performance:** CSS `contain` property and `will-change` used appropriately. GPU-accelerated animations via `translateZ(0)`.
- **Hide scrollbars:** `::-webkit-scrollbar { display: none }` for clean iOS look.

### 4.2 Issues & Recommendations

| Issue | Severity | Detail |
|---|---|---|
| No pull-to-refresh | Low | iOS standalone PWAs don't have browser refresh. Users need a way to refresh data. The app uses SWR with auto-revalidation which partially mitigates this. |
| No offline state handling | Medium | No UI feedback when the device goes offline. API calls will silently fail. |
| No `apple-touch-icon` at 180x180 | Low | Using 192x192 which works but 180x180 is the correct Apple spec. |
| Haptics utility unused in BottomNav | Info | `lib/haptics.ts` has Capacitor haptics but `BottomNav.tsx:18` uses `navigator.vibrate` instead (which doesn't work on iOS). |
| No Dynamic Island / Live Activities | Info | Relevant for live sports scores but requires native code (not possible in PWA). Capacitor plugin available. |
| No keyboard handling | Low | Search input in Header.tsx doesn't dismiss keyboard on scroll or "Done" tap. iOS web keyboard management can be tricky. |
| `maximumScale: 1` accessibility concern | Info | Prevents pinch-to-zoom which is an accessibility issue per WCAG. Apple won't reject for this but worth noting. |

---

## 5. Dependencies & Third-Party Audit

### 5.1 Current Dependencies (package.json)

| Package | Version | iOS Concern |
|---|---|---|
| next | 14.1.0 | Stable, well-supported. Consider upgrading to 14.2+ for improved app router performance. |
| react / react-dom | 18.2.0 | Stable |
| @supabase/ssr | ^0.8.0 | Works in both web and Capacitor contexts |
| @supabase/supabase-js | ^2.39.0 | Works in both web and Capacitor contexts |
| swr | ^2.3.8 | Works in both web and Capacitor contexts |
| lucide-react | ^0.312.0 | SVG icons, works everywhere |
| tailwindcss | ^3.4.0 | Build-time only, no runtime concern |

### 5.2 Missing Dependencies (If Going Capacitor Route)

| Package | Purpose |
|---|---|
| `@capacitor/core` | Capacitor runtime |
| `@capacitor/cli` | Capacitor CLI tools |
| `@capacitor/ios` | iOS platform support |
| `@capacitor/haptics` | Native haptic feedback (referenced in `lib/haptics.ts`) |
| `@capacitor/push-notifications` | Push notifications (recommended for App Review) |
| `@capacitor/status-bar` | Status bar styling |
| `@capacitor/splash-screen` | Native splash screen |

---

## 6. Data & API Audit

| API | Usage | iOS Concern |
|---|---|---|
| ESPN API | Scores, standings, team data | Verify terms allow native app distribution |
| API-Football | Soccer fixtures, match details | API key rate limits may need adjustment for mobile traffic patterns |
| Polymarket API | Odds/predictions | Verify gambling-adjacent content won't trigger App Store Guideline 5.3 (gambling apps require specific licenses) |
| Supabase | Database + Auth | Google OAuth redirect flow needs testing in WKWebView (Capacitor handles this with plugins) |
| Google Fonts | Typography | Loaded via `<link>` — consider self-hosting for offline/performance |

### Polymarket / Odds Content — App Store Risk
Apple Guideline **5.3.3** states gambling and contest apps need to be geo-restricted to where they're legally permitted. If the app simply displays odds as informational content (not facilitating bets), this is likely acceptable, but it should be clearly positioned as informational.

---

## 7. Asset Checklist

### Required for PWA (Immediate)

| Asset | Status | Blocking? |
|---|---|---|
| `public/icons/icon-192.png` | MISSING | Yes |
| `public/icons/icon-512.png` | MISSING | Yes |
| `public/icons/apple-touch-icon-180.png` | MISSING | No (recommended) |
| `public/splash/splash-640x1136.png` | MISSING | No (cosmetic) |
| `public/splash/splash-750x1334.png` | MISSING | No (cosmetic) |
| `public/splash/splash-1242x2208.png` | MISSING | No (cosmetic) |
| `public/splash/splash-1125x2436.png` | MISSING | No (cosmetic) |
| `public/splash/splash-1284x2778.png` | MISSING | No (cosmetic) |
| `public/favicon.ico` | MISSING | No (recommended) |

### Required for App Store (When Ready)

| Asset | Status | Blocking? |
|---|---|---|
| 1024x1024 App Store icon (no transparency, no rounded corners) | MISSING | Yes |
| iPhone 6.7" screenshots (1290x2796) | MISSING | Yes |
| iPhone 6.5" screenshots (1284x2778) | MISSING | Yes |
| iPhone 5.5" screenshots (1242x2208) | MISSING | Yes |
| iPad Pro 12.9" screenshots (2048x2732) | MISSING | If supporting iPad |
| Privacy Policy URL | MISSING | Yes |
| Support URL | MISSING | Yes |

---

## 8. Recommended Next Steps (Priority Order)

### Phase 1 — Immediate (PWA Polish)
1. Generate app icons from finalized logo: 180x180, 192x192, 512x512, 1024x1024
2. Generate splash screen PNGs for all referenced iPhone sizes
3. Add `favicon.ico` to `public/`
4. Update `manifest.json` `icons` array to separate `any` and `maskable` purposes (current combined declaration can cause display issues)

### Phase 2 — Pre-Developer Account
5. Draft App Store metadata: description, keywords, category
6. Create a privacy policy page (can be a simple `/privacy` route)
7. Create a support page or email (`/support` or link)
8. Decide on push notification strategy (strongly recommended for App Review)
9. Add offline detection UI (banner when connection lost)

### Phase 3 — With Developer Account
10. Install Capacitor (`@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`)
11. Configure `capacitor.config.ts` with bundle ID
12. Run `npx cap add ios` to generate Xcode project
13. Configure signing with Developer Account certificates
14. Add `@capacitor/haptics` to activate existing haptics code
15. Test Google OAuth flow in WKWebView
16. Take App Store screenshots from device/simulator
17. Submit to TestFlight for testing
18. Submit to App Store Review

---

## 9. Risk Summary

| Risk | Level | Mitigation |
|---|---|---|
| App Review rejection for "website wrapper" (4.2) | **Medium** | Add native features: haptics, push notifications, share sheet |
| Polymarket odds content (5.3) | **Low-Medium** | Position as informational only, not facilitating gambling |
| Google OAuth in WKWebView | **Low** | Capacitor has established plugins for this |
| ESPN/API-Football data licensing for native app | **Unknown** | Review API terms of service |
| Missing all icon/splash assets | **High** | Blocked on logo finalization (acknowledged — in progress) |
| No offline support | **Low** | SWR caching helps; add service worker later |

---

*This is a read-only audit. No code changes were made.*
