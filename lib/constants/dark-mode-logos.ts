// Dark mode logo variants
// Add entries here when a league logo needs a custom dark mode version
// Key: league slug, Value: path to dark mode logo in /public/logos/

export const DARK_MODE_LOGOS: Record<string, string> = {
  // Add custom dark mode logos here as needed:
  // 'league-slug': '/logos/league-white.svg',
};

// Leagues that look good with white silhouette filter (brightness(0) invert(1))
// Use this for simple logos that don't need custom assets
// By slug (for soccer hub page)
export const WHITE_FILTER_LEAGUES = [
  'ligue-1',
  'champions-league',
];

// By league code (for MatchCard, calendar, etc.)
export const WHITE_FILTER_LEAGUE_CODES = [
  'FL1',  // Ligue 1
  'CL',   // Champions League
];

// Helper function to get the appropriate logo for current theme
export function getThemedLogo(
  slug: string,
  defaultLogo: string,
  darkMode: boolean
): string {
  if (!darkMode) return defaultLogo;

  // Check if we have a custom dark mode logo
  if (DARK_MODE_LOGOS[slug]) {
    return DARK_MODE_LOGOS[slug];
  }

  // Otherwise return the default
  return defaultLogo;
}

// Helper to check if a league should use the white filter (by slug)
export function shouldUseWhiteFilter(slug: string): boolean {
  return WHITE_FILTER_LEAGUES.includes(slug);
}

// Helper to check if a league should use the white filter (by code)
export function shouldUseWhiteFilterByCode(code: string): boolean {
  return WHITE_FILTER_LEAGUE_CODES.includes(code);
}
