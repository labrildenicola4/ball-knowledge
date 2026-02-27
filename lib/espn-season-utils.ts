// Dynamic season year calculation and playoff date helpers for NFL & CFB

/**
 * Get the current NFL season year.
 * NFL seasons span Sep–Feb, so Jan–May uses the previous calendar year.
 */
export function getCurrentNFLSeason(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  return month <= 4 ? now.getFullYear() - 1 : now.getFullYear();
}

/**
 * Get the current CFB season year.
 * Same calendar logic as NFL: Sep–Dec is the season year, Jan–May is previous year.
 */
export function getCurrentCFBSeason(): number {
  const now = new Date();
  const month = now.getMonth();
  return month <= 4 ? now.getFullYear() - 1 : now.getFullYear();
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/**
 * Get the nth occurrence of a day-of-week in a given month.
 * @param year - Full year
 * @param month - 0-indexed month (0=Jan, 11=Dec)
 * @param dayOfWeek - 0=Sunday, 6=Saturday
 * @param n - 1-indexed occurrence (1=first, 2=second, etc.)
 */
function getNthDayOfMonth(year: number, month: number, dayOfWeek: number, n: number): Date {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const firstOccurrence = 1 + ((dayOfWeek - firstDow + 7) % 7);
  return new Date(year, month, firstOccurrence + (n - 1) * 7);
}

/** Format a Date as YYYYMMDD string */
function fmt(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** Add days to a date (returns new Date) */
function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

// ---------------------------------------------------------------------------
// NFL playoff date ranges
// ---------------------------------------------------------------------------

/**
 * Get the Super Bowl date range string (YYYYMMDD-YYYYMMDD, ±1 day).
 * Super Bowl = 2nd Sunday of February in the year after the season.
 */
export function getSuperBowlDateRange(season: number): string {
  const sbSunday = getNthDayOfMonth(season + 1, 1, 0, 2); // 2nd Sunday of Feb
  return `${fmt(addDays(sbSunday, -1))}-${fmt(addDays(sbSunday, 1))}`;
}

/**
 * Get NFL playoff date range strings for a given season.
 * Ranges are intentionally a bit wide to avoid missing games.
 */
export function getNFLPlayoffDateRanges(season: number): {
  wildCard: string;
  divisional: string;
  confChamp: string;
  superBowl: string;
} {
  const ny = season + 1;
  const wcSat = getNthDayOfMonth(ny, 0, 6, 2); // 2nd Saturday of January

  return {
    wildCard: `${fmt(wcSat)}-${fmt(addDays(wcSat, 3))}`,                // Sat–Tue
    divisional: `${fmt(addDays(wcSat, 7))}-${fmt(addDays(wcSat, 8))}`,  // Next Sat–Sun
    confChamp: `${fmt(addDays(wcSat, 14))}-${fmt(addDays(wcSat, 15))}`, // 2 wks later Sat–Sun
    superBowl: getSuperBowlDateRange(season),
  };
}

// ---------------------------------------------------------------------------
// CFP date ranges
// ---------------------------------------------------------------------------

/**
 * Get CFP date range strings for a given season.
 * Ranges are intentionally a bit wide to avoid missing games.
 */
export function getCFPDateRanges(season: number): {
  firstRound: string;
  quarterfinals: string;
  semifinals: string;
  championship: string;
} {
  const ny = season + 1;

  // First Round: 3rd Saturday of December in season year (±1 day)
  const frSat = getNthDayOfMonth(season, 11, 6, 3);

  // Quarterfinals: Dec 31 through Jan 2
  const dec31 = new Date(season, 11, 31);
  const jan2 = new Date(ny, 0, 2);

  // Semifinals: 2nd Thursday of January, 3-day range (Thu–Sat)
  const semiThurs = getNthDayOfMonth(ny, 0, 4, 2);

  // Championship: 3rd Monday of January, 3-day range (Mon–Wed)
  const champMon = getNthDayOfMonth(ny, 0, 1, 3);

  return {
    firstRound: `${fmt(addDays(frSat, -1))}-${fmt(addDays(frSat, 1))}`,
    quarterfinals: `${fmt(dec31)}-${fmt(jan2)}`,
    semifinals: `${fmt(semiThurs)}-${fmt(addDays(semiThurs, 2))}`,
    championship: `${fmt(champMon)}-${fmt(addDays(champMon, 2))}`,
  };
}
