'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { BottomNav } from '@/components/BottomNav';

// Mock data - replace with API call
const mockMatchDetails = {
  1: {
    league: 'LaLiga',
    date: 'Jan 12',
    venue: 'Santiago Bernabéu',
    attendance: '78,234',
    status: 'FT',
    home: {
      name: 'Real Madrid',
      shortName: 'RMA',
      logo: '⚪',
      score: 2,
      possession: 58,
      shots: 14,
      shotsOnTarget: 6,
      corners: 7,
      fouls: 11,
      form: ['W', 'W', 'D', 'W', 'W'],
      scorers: [{ name: 'Vinícius Jr.', minute: 23 }, { name: 'Bellingham', minute: 67 }],
      lineup: {
        formation: '4-3-3',
        coach: 'Carlo Ancelotti',
        players: [
          { number: 1, name: 'Courtois', position: 'GK' },
          { number: 2, name: 'Carvajal', position: 'RB' },
          { number: 4, name: 'Alaba', position: 'CB' },
          { number: 22, name: 'Rüdiger', position: 'CB' },
          { number: 23, name: 'Mendy', position: 'LB' },
          { number: 8, name: 'Kroos', position: 'CM' },
          { number: 12, name: 'Camavinga', position: 'CM', subOut: 78 },
          { number: 5, name: 'Bellingham', position: 'CM', goal: 67 },
          { number: 11, name: 'Rodrygo', position: 'RW' },
          { number: 7, name: 'Vinícius Jr.', position: 'LW', goal: 23, assist: 67 },
          { number: 14, name: 'Joselu', position: 'ST' },
        ],
        subs: [{ number: 10, name: 'Modric', position: 'CM', subIn: 78 }],
      },
    },
    away: {
      name: 'Barcelona',
      shortName: 'BAR',
      logo: '🔵',
      score: 1,
      possession: 42,
      shots: 9,
      shotsOnTarget: 3,
      corners: 4,
      fouls: 14,
      form: ['W', 'L', 'W', 'W', 'D'],
      scorers: [{ name: 'Lewandowski', minute: 55 }],
      lineup: {
        formation: '4-3-3',
        coach: 'Xavi Hernández',
        players: [
          { number: 1, name: 'ter Stegen', position: 'GK' },
          { number: 2, name: 'Cancelo', position: 'RB' },
          { number: 4, name: 'Araujo', position: 'CB', yellow: 82 },
          { number: 15, name: 'Christensen', position: 'CB' },
          { number: 3, name: 'Baldé', position: 'LB' },
          { number: 8, name: 'Pedri', position: 'CM' },
          { number: 6, name: 'Gavi', position: 'CM', yellow: 34 },
          { number: 20, name: 'F. de Jong', position: 'CM' },
          { number: 11, name: 'Raphinha', position: 'RW', assist: 55 },
          { number: 9, name: 'Lewandowski', position: 'ST', goal: 55 },
          { number: 19, name: 'Yamal', position: 'LW' },
        ],
        subs: [{ number: 21, name: 'F. Torres', position: 'RW' }],
      },
    },
    timeline: [
      { minute: 23, team: 'home', event: 'goal', player: 'Vinícius Jr.', assist: 'Bellingham' },
      { minute: 34, team: 'away', event: 'yellow', player: 'Gavi' },
      { minute: 55, team: 'away', event: 'goal', player: 'Lewandowski', assist: 'Raphinha' },
      { minute: 67, team: 'home', event: 'goal', player: 'Bellingham', assist: 'Vinícius Jr.' },
      { minute: 78, team: 'home', event: 'sub', playerIn: 'Modric', playerOut: 'Camavinga' },
      { minute: 82, team: 'away', event: 'yellow', player: 'Araujo' },
    ],
    h2h: { total: 10, homeWins: 4, draws: 3, awayWins: 3 },
  },
};

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');
  const [lineupView, setLineupView] = useState<'pitch' | 'list'>('list');

  const matchId = Number(params.id);
  const match = mockMatchDetails[matchId as keyof typeof mockMatchDetails];

  if (!match) {
    return <div>Match not found</div>;
  }

  const team = activeTeam === 'home' ? match.home : match.away;

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const FormBadge = ({ result }: { result: string }) => {
    const colors = { W: theme.green, D: theme.gold, L: theme.red };
    return (
      <span
        className="form-badge"
        style={{ backgroundColor: colors[result as keyof typeof colors] }}
      >
        {result}
      </span>
    );
  };

  const StatBar = ({ label, homeValue, awayValue, isPercentage = false }: {
    label: string;
    homeValue: number;
    awayValue: number;
    isPercentage?: boolean;
  }) => {
    const total = homeValue + awayValue;
    const homePercent = (homeValue / total) * 100;
    return (
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-[13px]">
          <span className="font-mono">{homeValue}{isPercentage ? '%' : ''}</span>
          <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>{label}</span>
          <span className="font-mono">{awayValue}{isPercentage ? '%' : ''}</span>
        </div>
        <div className="flex h-1 overflow-hidden rounded" style={{ backgroundColor: theme.bgTertiary }}>
          <div style={{ width: `${homePercent}%`, backgroundColor: theme.accent }} />
          <div style={{ width: `${100 - homePercent}%`, backgroundColor: theme.sepia }} />
        </div>
      </div>
    );
  };

  const Card = ({ children, title, className = '' }: { children: React.ReactNode; title?: string; className?: string }) => (
    <div
      className={`scroll-snap-start flex-shrink-0 rounded-xl p-5 ${className}`}
      style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, minWidth: '300px' }}
    >
      {title && (
        <h3 className="mb-4 text-[9px] font-semibold uppercase tracking-wider" style={{ color: theme.textSecondary }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col transition-theme" style={{ backgroundColor: theme.bg, paddingBottom: '80px' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${theme.border}` }}
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.accent }}>{match.league}</p>
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>{match.date}</p>
        </div>
      </header>

      {/* Score */}
      <section className="px-4 py-6" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="mb-3 flex items-center justify-center gap-5">
          <div className="flex-1 text-center">
            <div className="mb-2 text-4xl">{match.home.logo}</div>
            <p className="font-display text-sm font-medium">{match.home.name}</p>
          </div>
          <div className="text-center">
            <div className="mb-2 flex items-center gap-3">
              <span className="font-mono text-5xl font-light">{match.home.score}</span>
              <span className="text-xl" style={{ color: theme.textSecondary }}>–</span>
              <span className="font-mono text-5xl font-light">{match.away.score}</span>
            </div>
            <span
              className="font-mono rounded-full px-3 py-1 text-[10px] tracking-wider"
              style={{ backgroundColor: theme.bgTertiary, color: theme.textSecondary }}
            >
              {match.status}
            </span>
          </div>
          <div className="flex-1 text-center">
            <div className="mb-2 text-4xl">{match.away.logo}</div>
            <p className="font-display text-sm font-medium">{match.away.name}</p>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-1">
            <MapPin size={11} color={theme.textSecondary} />
            <span className="text-[11px]" style={{ color: theme.textSecondary }}>{match.venue}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={11} color={theme.textSecondary} />
            <span className="text-[11px]" style={{ color: theme.textSecondary }}>{match.attendance}</span>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="relative flex-1 py-4">
        {/* Scroll buttons - desktop only */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 shadow-lg md:flex"
          style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full p-2 shadow-lg md:flex"
          style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
        >
          <ChevronRight size={16} />
        </button>

        <div
          ref={scrollRef}
          className="scroll-snap-x flex gap-3 overflow-x-auto px-4 md:flex-row"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Scorers */}
          <Card title="Scorers">
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="mb-2 text-[10px] tracking-wider" style={{ color: theme.textSecondary }}>{match.home.shortName}</p>
                {match.home.scorers.map((s, i) => (
                  <p key={i} className="mb-1 text-[13px]">
                    ⚽ {s.name} <span className="font-mono text-[11px]" style={{ color: theme.textSecondary }}>{s.minute}'</span>
                  </p>
                ))}
              </div>
              <div className="w-px" style={{ backgroundColor: theme.border }} />
              <div className="flex-1">
                <p className="mb-2 text-[10px] tracking-wider" style={{ color: theme.textSecondary }}>{match.away.shortName}</p>
                {match.away.scorers.map((s, i) => (
                  <p key={i} className="mb-1 text-[13px]">
                    ⚽ {s.name} <span className="font-mono text-[11px]" style={{ color: theme.textSecondary }}>{s.minute}'</span>
                  </p>
                ))}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <Card title="Stats" className="min-w-[320px]">
            <StatBar label="Possession" homeValue={match.home.possession} awayValue={match.away.possession} isPercentage />
            <StatBar label="Shots" homeValue={match.home.shots} awayValue={match.away.shots} />
            <StatBar label="On Target" homeValue={match.home.shotsOnTarget} awayValue={match.away.shotsOnTarget} />
            <StatBar label="Corners" homeValue={match.home.corners} awayValue={match.away.corners} />
            <StatBar label="Fouls" homeValue={match.home.fouls} awayValue={match.away.fouls} />
          </Card>

          {/* Form */}
          <Card title="Form">
            <div className="mb-5">
              <p className="mb-2 text-[12px]" style={{ color: theme.textSecondary }}>{match.home.name}</p>
              <div className="flex gap-1">
                {match.home.form.map((f, i) => <FormBadge key={i} result={f} />)}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[12px]" style={{ color: theme.textSecondary }}>{match.away.name}</p>
              <div className="flex gap-1">
                {match.away.form.map((f, i) => <FormBadge key={i} result={f} />)}
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Timeline" className="min-w-[340px]">
            <div className="mb-4 flex items-center py-1">
              <span className="font-mono text-[9px]" style={{ color: theme.textSecondary }}>0'</span>
              <div className="relative mx-2 h-5 flex-1 rounded" style={{ backgroundColor: theme.bgTertiary }}>
                {match.timeline.map((e, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px]"
                    style={{ left: `${(e.minute / 90) * 100}%` }}
                  >
                    {e.event === 'goal' ? '⚽' : e.event === 'yellow' ? '🟨' : '🔄'}
                  </div>
                ))}
              </div>
              <span className="font-mono text-[9px]" style={{ color: theme.textSecondary }}>90'</span>
            </div>
            <div className="max-h-36 overflow-y-auto">
              {match.timeline.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i < match.timeline.length - 1 ? `1px solid ${theme.border}` : 'none' }}
                >
                  <span className="font-mono w-7 text-[11px]" style={{ color: theme.textSecondary }}>{e.minute}'</span>
                  <span className="text-[12px]">{e.event === 'goal' ? '⚽' : e.event === 'yellow' ? '🟨' : '🔄'}</span>
                  <span className="flex-1 text-[12px]">{e.player || `${e.playerIn} ↔ ${e.playerOut}`}</span>
                  <span className="text-[9px]" style={{ color: theme.textSecondary }}>
                    {e.team === 'home' ? match.home.shortName : match.away.shortName}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* H2H */}
          <Card title="Head to Head">
            <p className="mb-4 text-[11px]" style={{ color: theme.textSecondary }}>Last {match.h2h.total} meetings</p>
            <div className="flex justify-between text-center">
              <div>
                <p className="font-mono text-3xl font-light" style={{ color: theme.accent }}>{match.h2h.homeWins}</p>
                <p className="text-[10px]" style={{ color: theme.textSecondary }}>{match.home.shortName}</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-light" style={{ color: theme.gold }}>{match.h2h.draws}</p>
                <p className="text-[10px]" style={{ color: theme.textSecondary }}>Draws</p>
              </div>
              <div>
                <p className="font-mono text-3xl font-light" style={{ color: theme.sepia }}>{match.h2h.awayWins}</p>
                <p className="text-[10px]" style={{ color: theme.textSecondary }}>{match.away.shortName}</p>
              </div>
            </div>
          </Card>

          {/* Lineups */}
          <Card title="Lineups" className="min-w-[340px]">
            {/* Team toggle */}
            <div className="mb-3 flex rounded-lg p-1" style={{ backgroundColor: theme.bgTertiary }}>
              <button
                onClick={() => setActiveTeam('home')}
                className="flex-1 rounded-md py-2 text-[11px]"
                style={{
                  backgroundColor: activeTeam === 'home' ? theme.bg : 'transparent',
                  color: activeTeam === 'home' ? theme.text : theme.textSecondary,
                }}
              >
                {match.home.shortName} ({match.home.lineup.formation})
              </button>
              <button
                onClick={() => setActiveTeam('away')}
                className="flex-1 rounded-md py-2 text-[11px]"
                style={{
                  backgroundColor: activeTeam === 'away' ? theme.bg : 'transparent',
                  color: activeTeam === 'away' ? theme.text : theme.textSecondary,
                }}
              >
                {match.away.shortName} ({match.away.lineup.formation})
              </button>
            </div>

            {/* Player list */}
            <div className="max-h-64 overflow-y-auto">
              {team.lineup.players.map((player) => (
                <div
                  key={player.number}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: `1px solid ${theme.border}` }}
                >
                  <span
                    className="font-mono flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                    style={{ backgroundColor: activeTeam === 'home' ? theme.accent : theme.sepia }}
                  >
                    {player.number}
                  </span>
                  <span className="flex-1 text-[12px]">{player.name}</span>
                  <span className="text-[10px]" style={{ color: theme.textSecondary }}>{player.position}</span>
                  <div className="flex gap-1">
                    {player.goal && <span className="text-[10px]">⚽</span>}
                    {player.assist && <span className="text-[10px]">👟</span>}
                    {player.yellow && <span className="text-[9px]">🟨</span>}
                    {player.subOut && <span className="text-[10px]" style={{ color: theme.textSecondary }}>↩{player.subOut}'</span>}
                    {player.subIn && <span className="text-[10px]" style={{ color: theme.accent }}>↪{player.subIn}'</span>}
                  </div>
                </div>
              ))}
              <p className="mt-3 rounded-md p-2 text-center text-[11px]" style={{ backgroundColor: theme.bgTertiary }}>
                Manager: {team.lineup.coach}
              </p>
            </div>
          </Card>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
