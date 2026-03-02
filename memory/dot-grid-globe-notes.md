# Dot Grid Pattern — Save for Interactive Globe

## The Pattern (from glass-test page)
CSS dot grid that creates a uniform point grid across the viewport. Used in glass-test as a background to test frosted glass visibility, but the pattern itself could be the foundation for an interactive globe visualization.

### Dark Mode
```css
background-image: radial-gradient(circle, rgba(120, 160, 100, 0.25) 1.5px, transparent 1.5px);
background-size: 24px 24px;
```

### Light Mode
```css
background-image: radial-gradient(circle, rgba(100, 130, 80, 0.15) 1.5px, transparent 1.5px);
background-size: 24px 24px;
```

### With Animated Color Pools
The glass-test version layers drifting color pools underneath the dot grid, creating a "lit from below" effect. Color pools use radial gradients with blur and drift animations.

## Globe Idea
- Dot grid mapped to a sphere (CSS 3D transforms or WebGL/Three.js)
- Dots could represent cities, stadiums, or league locations
- Color pools could highlight active regions (where live games are happening)
- Frosted glass overlay on top for the Ball Knowledge aesthetic
- Could be used on splash screen, loading state, or "All Sports" hub

## Reference
Full implementation: `app/glass-test/page.tsx` → `DotGridBackground` component
