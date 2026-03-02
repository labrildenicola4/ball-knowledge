'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { SafeImage } from '@/components/SafeImage';
import { useTheme } from '@/lib/theme';

interface MockCardProps {
  league: string;
  leagueBadge?: string;
  leagueLogo?: string;
  homeName: string;
  awayName: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  statusText: string;
  isLive: boolean;
  broadcast?: string;
  venue?: string;
  cardStyle?: React.CSSProperties;
  fontFamily?: string;
}

function MockCard({
  league,
  leagueBadge,
  leagueLogo,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  homeScore,
  awayScore,
  statusText,
  isLive,
  broadcast,
  cardStyle,
  fontFamily,
}: MockCardProps) {
  const { theme } = useTheme();
  const isFinal = statusText === 'Final';
  const homeWon = isFinal && (homeScore ?? 0) > (awayScore ?? 0);
  const awayWon = isFinal && (awayScore ?? 0) > (homeScore ?? 0);

  return (
    <div
      className="card-press p-3 md:p-5 transition-theme glass-match-card"
      style={{ ...cardStyle, fontFamily }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {leagueLogo && (
            <SafeImage
              src={leagueLogo}
              alt={league}
              className="h-4 w-4 object-contain"
              loading="lazy"
            />
          )}
          {leagueBadge && (
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {leagueBadge}
            </span>
          )}
          {!leagueBadge && !leagueLogo && (
            <span
              className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {league}
            </span>
          )}
          {broadcast && (
            <span
              className="text-[11px] font-medium"
              style={{ color: theme.textSecondary }}
            >
              {broadcast}
            </span>
          )}
        </div>
        <span
          className={`font-mono rounded-lg px-3 py-1 text-[15px] ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
          style={{ color: isLive ? '#fff' : theme.textSecondary, fontFamily: fontFamily || undefined }}
        >
          {isLive && '● '}
          {statusText}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center">
        {/* Away Team */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 pr-1 md:pr-2">
          <SafeImage
            src={awayLogo}
            alt={awayName}
            className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 object-contain logo-glow"
            loading="lazy"
          />
          <span
            className="text-base font-medium line-clamp-2"
            style={{
              color: awayWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
              fontWeight: awayWon ? 600 : 500,
              fontFamily,
            }}
          >
            {awayName}
          </span>
        </div>

        {/* Score */}
        <div
          className="font-mono rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-[17px] md:text-lg font-semibold flex-shrink-0 glass-score score-text"
          style={{ color: theme.text }}
        >
          {homeScore !== null && awayScore !== null
            ? `${awayScore} - ${homeScore}`
            : 'vs'}
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0 pl-1 md:pl-2 justify-end">
          <span
            className="text-base font-medium line-clamp-2 text-right"
            style={{
              color: homeWon ? theme.text : isFinal ? theme.textSecondary : theme.text,
              fontWeight: homeWon ? 600 : 500,
              fontFamily,
            }}
          >
            {homeName}
          </span>
          <SafeImage
            src={homeLogo}
            alt={homeName}
            className="h-8 w-8 md:h-9 md:w-9 flex-shrink-0 object-contain logo-glow"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}

const MOCK_CARDS: MockCardProps[] = [
  {
    league: 'NBA',
    leagueBadge: 'NBA',
    awayName: 'Lakers',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
    homeName: 'Celtics',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
    awayScore: 87,
    homeScore: 92,
    statusText: 'Q3 5:42',
    isLive: true,
    broadcast: 'ESPN',
  },
  {
    league: 'Premier League',
    leagueLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/23.png',
    homeName: 'Arsenal',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
    awayName: 'Man City',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
    homeScore: 1,
    awayScore: 2,
    statusText: "HT 45'",
    isLive: true,
  },
  {
    league: 'NHL',
    leagueBadge: 'NHL',
    awayName: 'Rangers',
    awayLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png',
    homeName: 'Bruins',
    homeLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png',
    awayScore: 3,
    homeScore: 1,
    statusText: 'Final',
    isLive: false,
  },
];

type Option = 'a' | 'b' | 'c';

interface ToggleButtonProps {
  label: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
}

function ToggleButton({ label, subtitle, active, onClick }: ToggleButtonProps) {
  const { theme, darkMode } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`tap-highlight rounded-full px-4 py-2.5 text-sm font-medium min-w-[100px] ${active ? 'glass-pill-active' : 'glass-pill'}`}
      style={{ color: active ? (darkMode ? '#fff' : theme.text) : theme.textSecondary }}
    >
      <div>{label}</div>
      <div className="text-[11px]">{subtitle}</div>
    </button>
  );
}

export default function ComparePage() {
  const { theme, darkMode } = useTheme();
  const [depthOption, setDepthOption] = useState<Option>('a');
  const [glassOption, setGlassOption] = useState<Option>('a');
  const [fontOption, setFontOption] = useState<Option>('a');

  // Load Google Fonts
  useEffect(() => {
    const interHref = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    const barlowHref = 'https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&display=swap';

    if (!document.querySelector(`link[href="${interHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = interHref;
      document.head.appendChild(link);
    }

    if (!document.querySelector(`link[href="${barlowHref}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = barlowHref;
      document.head.appendChild(link);
    }
  }, []);

  // Depth styles
  const getDepthStyle = (): React.CSSProperties | undefined => {
    if (depthOption === 'a') return undefined;
    if (depthOption === 'b') {
      return darkMode
        ? {
            boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4), 0 4px 12px rgba(120,160,100,0.06), inset 0 1px 0 rgba(180,210,150,0.18), inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 0 20px rgba(120,160,100,0.04)',
            transform: 'translateZ(0)',
          }
        : {
            boxShadow: '0 12px 40px rgba(40,70,35,0.08), 0 4px 16px rgba(40,70,35,0.04), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 4px rgba(40,70,35,0.03), inset 0 0 20px rgba(255,255,255,0.08)',
            transform: 'translateZ(0)',
          };
    }
    // c
    return darkMode
      ? {
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 6px 20px rgba(0,0,0,0.45), 0 6px 16px rgba(120,160,100,0.10), inset 0 1px 0 rgba(180,210,150,0.25), inset 0 -3px 6px rgba(0,0,0,0.2), inset 1px 0 0 rgba(120,160,100,0.06), inset -1px 0 0 rgba(120,160,100,0.06), inset 0 0 20px rgba(120,160,100,0.04)',
          transform: 'translateY(-1px) translateZ(0)',
        }
      : {
          boxShadow: '0 16px 48px rgba(40,70,35,0.10), 0 6px 20px rgba(40,70,35,0.05), inset 0 2px 0 rgba(255,255,255,1), inset 0 -3px 6px rgba(40,70,35,0.04), inset 1px 0 0 rgba(255,255,255,0.7), inset -1px 0 0 rgba(255,255,255,0.7), inset 0 0 20px rgba(255,255,255,0.08)',
          transform: 'translateY(-1px) translateZ(0)',
        };
  };

  // Glass styles
  const getGlassStyle = (): React.CSSProperties | undefined => {
    if (glassOption === 'a') return undefined;
    if (glassOption === 'b') {
      return darkMode
        ? { background: 'rgba(10,18,12,0.32)', borderColor: 'rgba(120,160,100,0.12)' }
        : { background: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.55)' };
    }
    // c
    return darkMode
      ? { background: 'rgba(10,18,12,0.18)', borderColor: 'rgba(120,160,100,0.15)' }
      : { background: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.45)' };
  };

  // Font families
  const getFontFamily = (): string | undefined => {
    if (fontOption === 'a') return "'Cormorant Garamond', Georgia, serif";
    if (fontOption === 'b') return "'Inter', system-ui, -apple-system, sans-serif";
    return "'Barlow Condensed', 'Barlow', system-ui, sans-serif";
  };

  const borderStyle = `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`;

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <Header />

      {/* Page Header */}
      <div
        className="px-4 py-4 glass-divider"
        style={{ borderBottom: borderStyle }}
      >
        <h1 className="text-2xl font-bold" style={{ color: theme.text }}>Compare Styles</h1>
        <p className="text-base mt-1" style={{ color: theme.textSecondary }}>Tap options to compare treatments</p>
      </div>

      <main className="flex-1 overflow-y-auto pb-24 px-2 sm:px-4 py-4">
        {/* Section 1: Card Depth */}
        <div className="mb-8">
          <div className="px-2 mb-4">
            <h1 className="text-xl font-bold" style={{ color: theme.text }}>Card Depth</h1>
            <p className="text-sm" style={{ color: theme.textSecondary }}>How much the cards float above the surface</p>
          </div>

          <div className="flex gap-3 justify-center mb-5">
            <ToggleButton label="A" subtitle="Current" active={depthOption === 'a'} onClick={() => setDepthOption('a')} />
            <ToggleButton label="B" subtitle="Elevated" active={depthOption === 'b'} onClick={() => setDepthOption('b')} />
            <ToggleButton label="C" subtitle="Immersive" active={depthOption === 'c'} onClick={() => setDepthOption('c')} />
          </div>

          <section className="rounded-xl overflow-hidden glass-section">
            <div className="px-4 py-3" style={{ borderBottom: borderStyle }}>
              <h2 className="text-[17px] font-medium" style={{ color: theme.text }}>Sample Games</h2>
            </div>
            <div className="grid grid-cols-1 gap-3.5 p-2 sm:p-3.5">
              {MOCK_CARDS.map((card, i) => (
                <MockCard key={i} {...card} cardStyle={getDepthStyle()} />
              ))}
            </div>
          </section>
        </div>

        {/* Section 2: Glass Intensity */}
        <div className="mb-8">
          <div className="px-2 mb-4">
            <h1 className="text-xl font-bold" style={{ color: theme.text }}>Glass Intensity</h1>
            <p className="text-sm" style={{ color: theme.textSecondary }}>How much of the surface shows through the frosted glass</p>
          </div>

          <div className="flex gap-3 justify-center mb-5">
            <ToggleButton label="A" subtitle="Heavy Frost" active={glassOption === 'a'} onClick={() => setGlassOption('a')} />
            <ToggleButton label="B" subtitle="Medium Frost" active={glassOption === 'b'} onClick={() => setGlassOption('b')} />
            <ToggleButton label="C" subtitle="Light Frost" active={glassOption === 'c'} onClick={() => setGlassOption('c')} />
          </div>

          <section className="rounded-xl overflow-hidden glass-section">
            <div className="px-4 py-3" style={{ borderBottom: borderStyle }}>
              <h2 className="text-[17px] font-medium" style={{ color: theme.text }}>Sample Games</h2>
            </div>
            <div className="grid grid-cols-1 gap-3.5 p-2 sm:p-3.5">
              {MOCK_CARDS.map((card, i) => (
                <MockCard key={i} {...card} cardStyle={getGlassStyle()} />
              ))}
            </div>
          </section>
        </div>

        {/* Section 3: Font Direction */}
        <div className="mb-8">
          <div className="px-2 mb-4">
            <h1 className="text-xl font-bold" style={{ color: theme.text }}>Font Direction</h1>
            <p className="text-sm" style={{ color: theme.textSecondary }}>How text feels across the card — serif, geometric, or athletic</p>
          </div>

          <div className="flex gap-3 justify-center mb-5">
            <ToggleButton label="A" subtitle="Serif" active={fontOption === 'a'} onClick={() => setFontOption('a')} />
            <ToggleButton label="B" subtitle="Geometric" active={fontOption === 'b'} onClick={() => setFontOption('b')} />
            <ToggleButton label="C" subtitle="Athletic" active={fontOption === 'c'} onClick={() => setFontOption('c')} />
          </div>

          <section className="rounded-xl overflow-hidden glass-section">
            <div className="px-4 py-3" style={{ borderBottom: borderStyle }}>
              <h2 className="text-[17px] font-medium" style={{ color: theme.text }}>Sample Games</h2>
            </div>
            <div className="grid grid-cols-1 gap-3.5 p-2 sm:p-3.5">
              {MOCK_CARDS.map((card, i) => (
                <MockCard key={i} {...card} fontFamily={getFontFamily()} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
