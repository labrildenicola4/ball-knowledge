# UI Layer Architecture — Ball Knowledge

## 4-Layer System
Glass effects live on their own layer. Content sits above, completely independent.

**Visual page:** `localhost:3000/layers` (interactive, tap to expand)

---

## The Stack (bottom → top)

### Layer 0 — Background
**What it is:** Full-screen animated background. Sets the mood, provides color for glass to refract.
**What lives here:** Aurora orbs, morphing blobs, color bands, mesh gradients, dot grid, future dynamic sport surfaces
**Key CSS:** `position: fixed`, `z-index: 0`, `radial-gradient`, `filter: blur(40px)`, `@keyframes`
**💡 Tip:** More visual contrast here = more visible glass effect. This is what you see THROUGH the glass.

### Layer 1 — Glass Section
**What it is:** Container grouping cards. Frosted panel with subtle blur.
**What lives here:** "LIVE NOW" header, "7 PM ET" time groups, "Completed" sections, divider lines, count badges
**Key CSS:** `glass-section` class, `backdrop-filter: blur()`, low-opacity rgba background, subtle borders
**💡 Tip:** Creates first level of depth. Cards sit INSIDE these sections.

### Layer 2 — Glass Card (NO content here)
**What it is:** The frosted glass surface of each game card. Gets blur, distortion, shimmer, specular. Content does NOT live here.
**What lives here:** `backdrop-filter: blur()`, SVG distortion (`feTurbulence`), specular highlight band, edge lines, shimmer animation, glass texture, box shadow
**Key CSS:** `glass-match-card` class, `position: absolute; inset: 0`, `filter: url(#glass-distort)`, `@keyframes shimmerSweep`
**💡 KEY INSIGHT:** This layer is `position: absolute`. It's a SIBLING to the content, NOT a parent. CSS filters here do NOT affect content.

### Layer 3 — Content Objects (top)
**What it is:** Solid, opaque objects sitting ON TOP of the glass. Zero transparency.
**What lives here:** Team logos (dark circle backing), team names (bold + text-shadow), score box (solid dark bg), status badges (solid red/dark), league badges (opaque pills)
**Key CSS:** `position: relative; z-index: 5`, `backgroundColor: rgba(0,0,0,0.6-0.7)`, `color: #ffffff`, `textShadow`, `boxShadow`, `filter: brightness(1.2)` on logos, `font-weight: bold`
**💡 Tip:** These are PHYSICAL OBJECTS on a glass table. Never transparent, never blurred, never filtered by the glass below.

---

## Card HTML Structure

```
Wrapper (position: relative, border-radius: 16px, NO filters)
├── LAYER 2: Glass Surface (position: absolute, inset: 0)
│   ├── glass-match-card class (backdrop-filter, blur)
│   ├── SVG distortion filter
│   ├── Specular highlight band (top gradient)
│   ├── Edge lines (side gradients)
│   ├── Shimmer sweep (animated gradient)
│   └── Glass texture (radial gradients)
│
└── LAYER 3: Content (position: relative, z-index: 5)
    ├── [logo] Team Name    ● Q3 5:42
    │   dark    bold white   solid red
    │   circle  text-shadow  box-shadow
    │
    └── [logo] Team A  87-92  Team B [logo]
        opaque  bold   solid   bold  opaque
        backing #fff   dark    #fff  backing
```

**Critical:** Content is a SIBLING to the glass, not a child. This prevents CSS filter inheritance.

---

## Architecture Rules

1. **🔒 Never put content inside the glass layer** — CSS filter on a parent creates a stacking context that washes out ALL children.
2. **🎯 Glass surface is position: absolute** — Fills the wrapper with `inset: 0`. Content sits beside it with higher z-index.
3. **💎 Content objects are fully opaque** — Logos: dark circle backings (rgba 0.6+). Text: #ffffff with text-shadow. Scores: rgba 0.7+ backgrounds.
4. **🌊 Background contrast drives glass visibility** — Glass is only as visible as the background behind it. More color in Layer 0 = more obvious frost.
5. **⚡ Animations live on glass layer only** — Shimmer, distortion, specular highlights — all Layer 2. Content stays still and crisp.

---

## Quick Target Guide

| You say... | Target | Fix |
|---|---|---|
| "Make glass more visible" | Layer 0 (Background) | Add more color contrast |
| "Glass feels flat" | Layer 2 (Glass) | Add specular / shimmer / distort |
| "Text is hard to read" | Layer 3 (Content) | Increase text-shadow, darker backings |
| "Cards blend together" | Layer 1 (Section) | Increase section bg opacity or borders |
| "Want more depth" | All layers | More spread between layer opacities |
| "Logos look washed out" | Layer 3 (Content) | Darker circle backing, brighter filter |

---

## Reference Pages
- **Glass Lab** (test backgrounds + glass treatments): `app/glass-test/page.tsx` → `/glass-test`
- **Layer Diagram** (interactive visual): `app/layers/page.tsx` → `/layers`
