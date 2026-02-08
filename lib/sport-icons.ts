// Custom SVG icons for sports that don't have league logos
// These are data URIs so they can be used directly in img src attributes
// Using theme gold color (#c4a35a) for outline style

// Soccer ball - outline with pentagon pattern
export const SOCCER_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="42" fill="none" stroke="#c4a35a" stroke-width="5"/>
  <polygon points="50,20 61,35 56,50 44,50 39,35" fill="none" stroke="#c4a35a" stroke-width="3"/>
  <line x1="50" y1="20" x2="50" y2="8" stroke="#c4a35a" stroke-width="3"/>
  <line x1="61" y1="35" x2="75" y2="28" stroke="#c4a35a" stroke-width="3"/>
  <line x1="56" y1="50" x2="72" y2="58" stroke="#c4a35a" stroke-width="3"/>
  <line x1="44" y1="50" x2="28" y2="58" stroke="#c4a35a" stroke-width="3"/>
  <line x1="39" y1="35" x2="25" y2="28" stroke="#c4a35a" stroke-width="3"/>
  <line x1="56" y1="50" x2="62" y2="68" stroke="#c4a35a" stroke-width="3"/>
  <line x1="44" y1="50" x2="38" y2="68" stroke="#c4a35a" stroke-width="3"/>
  <line x1="62" y1="68" x2="50" y2="80" stroke="#c4a35a" stroke-width="3"/>
  <line x1="38" y1="68" x2="50" y2="80" stroke="#c4a35a" stroke-width="3"/>
</svg>
`)}`;

// Basketball - outline with characteristic curved lines
export const BASKETBALL_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="42" fill="none" stroke="#c4a35a" stroke-width="5"/>
  <path d="M50 8 L50 92" stroke="#c4a35a" stroke-width="3" fill="none"/>
  <path d="M8 50 L92 50" stroke="#c4a35a" stroke-width="3" fill="none"/>
  <path d="M18 22 Q50 50 18 78" stroke="#c4a35a" stroke-width="3" fill="none"/>
  <path d="M82 22 Q50 50 82 78" stroke="#c4a35a" stroke-width="3" fill="none"/>
</svg>
`)}`;

// American Football - outline with laces
export const FOOTBALL_ICON = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <ellipse cx="50" cy="50" rx="42" ry="24" fill="none" stroke="#c4a35a" stroke-width="5" transform="rotate(-45 50 50)"/>
  <line x1="50" y1="32" x2="50" y2="68" stroke="#c4a35a" stroke-width="3" stroke-linecap="round"/>
  <line x1="44" y1="40" x2="56" y2="40" stroke="#c4a35a" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="43" y1="50" x2="57" y2="50" stroke="#c4a35a" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="44" y1="60" x2="56" y2="60" stroke="#c4a35a" stroke-width="2.5" stroke-linecap="round"/>
</svg>
`)}`;
