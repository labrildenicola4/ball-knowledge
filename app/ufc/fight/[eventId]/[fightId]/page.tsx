'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useSafeBack } from '@/lib/use-safe-back';
import { BottomNav } from '@/components/BottomNav';
import { UFCFightDetail, UFCFighterProfile, UFCFightStats } from '@/lib/types/ufc';
import { SafeImage } from '@/components/SafeImage';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
});

const getHeadshot = (id: string) =>
  `https://a.espncdn.com/i/headshots/mma/players/full/${id}.png`;

// Stat comparison bar component
function StatBar({
  label,
  value1,
  value2,
  display1,
  display2,
}: {
  label: string;
  value1: number;
  value2: number;
  display1: string;
  display2: string;
}) {
  const { theme, darkMode } = useTheme();
  const total = value1 + value2;
  const pct1 = total > 0 ? (value1 / total) * 100 : 50;
  const pct2 = total > 0 ? (value2 / total) * 100 : 50;
  const f1Leads = value1 > value2;
  const f2Leads = value2 > value1;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span
          className="text-[12px] font-mono tabular-nums"
          style={{ color: f1Leads ? theme.accent : theme.text, fontWeight: f1Leads ? 600 : 400 }}
        >
          {display1}
        </span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
          {label}
        </span>
        <span
          className="text-[12px] font-mono tabular-nums"
          style={{ color: f2Leads ? theme.accent : theme.text, fontWeight: f2Leads ? 600 : 400 }}
        >
          {display2}
        </span>
      </div>
      <div className="flex gap-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.bgTertiary }}>
        <div
          className="h-full rounded-l-full transition-all"
          style={{
            width: `${pct1}%`,
            backgroundColor: f1Leads ? theme.accent : darkMode ? 'rgba(120, 160, 100, 0.2)' : theme.border,
          }}
        />
        <div
          className="h-full rounded-r-full transition-all"
          style={{
            width: `${pct2}%`,
            backgroundColor: f2Leads ? theme.accent : darkMode ? 'rgba(120, 160, 100, 0.2)' : theme.border,
          }}
        />
      </div>
    </div>
  );
}

// Profile comparison row
function ProfileRow({ label, value1, value2 }: { label: string; value1?: string; value2?: string }) {
  const { theme } = useTheme();
  if (!value1 && !value2) return null;
  return (
    <div className="flex items-center py-2" style={{ borderBottom: `1px solid rgba(120, 160, 100, 0.07)` }}>
      <span className="flex-1 text-right text-[12px] pr-3" style={{ color: theme.text }}>{value1 || '-'}</span>
      <span className="w-16 text-center text-[10px] uppercase tracking-wider flex-shrink-0" style={{ color: theme.textSecondary }}>{label}</span>
      <span className="flex-1 text-left text-[12px] pl-3" style={{ color: theme.text }}>{value2 || '-'}</span>
    </div>
  );
}

// Record breakdown row
function RecordRow({ label, value1, value2 }: { label: string; value1: number; value2: number }) {
  const { theme } = useTheme();
  return (
    <div className="flex items-center py-1.5">
      <span className="flex-1 text-right text-[12px] font-mono pr-3" style={{ color: theme.text }}>{value1}</span>
      <span className="w-20 text-center text-[10px] flex-shrink-0" style={{ color: theme.textSecondary }}>{label}</span>
      <span className="flex-1 text-left text-[12px] font-mono pl-3" style={{ color: theme.text }}>{value2}</span>
    </div>
  );
}

export default function UFCFightDetailPage() {
  const params = useParams();
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const eventId = params.eventId as string;
  const fightId = params.fightId as string;
  const goBack = useSafeBack(`/ufc/event/${eventId}`);

  const { data, error, isLoading } = useSWR<{ fight: UFCFightDetail }>(
    eventId && fightId ? `/api/ufc/fight/${fightId}?eventId=${eventId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const fight = data?.fight;

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" style={{ color: theme.accent }} />
        <p className="mt-4 text-[12px]" style={{ color: theme.textSecondary }}>Loading fight...</p>
      </div>
    );
  }

  if (error || !fight) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-[14px]" style={{ color: theme.red }}>Fight not found</p>
        <button onClick={goBack} className="mt-4 rounded-lg px-4 py-2 text-[12px] glass-pill">Go back</button>
      </div>
    );
  }

  const isFinal = fight.status === 'final';
  const isLive = fight.status === 'in_progress';
  const f1 = fight.fighter1;
  const f2 = fight.fighter2;
  const p1 = fight.fighter1Profile;
  const p2 = fight.fighter2Profile;
  const s1 = fight.fighter1Stats;
  const s2 = fight.fighter2Stats;

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      {/* Header */}
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <p className="text-[15px] font-semibold" style={{ color: theme.accent }}>UFC</p>
          <p className="text-[13px]" style={{ color: theme.textSecondary }}>
            {fight.weightClass || 'Fight Detail'}
          </p>
        </div>
        {isLive && (
          <span className="font-mono rounded-lg px-3 py-1 text-[12px] glass-badge-live" style={{ color: '#fff' }}>
            ● R{fight.round} {fight.clock}
          </span>
        )}
        <button onClick={toggleDarkMode} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          {darkMode ? <Sun size={18} style={{ color: theme.text }} /> : <Moon size={18} style={{ color: theme.text }} />}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Hero: Fighters Face-to-Face */}
        <section className="px-4 py-6 glass-section">
          {/* Weight class + rounds */}
          <div className="text-center mb-4">
            {fight.weightClass && (
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>
                {fight.weightClass}
              </span>
            )}
            {fight.scheduledRounds && (
              <span className="text-[11px] ml-2" style={{ color: theme.textSecondary }}>
                · {fight.scheduledRounds} Rounds
              </span>
            )}
          </div>

          {/* Fighters */}
          <div className="flex items-start">
            {/* Fighter 1 */}
            <div className="flex-1 text-center">
              <div
                className="mx-auto mb-3 h-20 w-20 rounded-full overflow-hidden"
                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
              >
                <SafeImage
                  src={p1?.headshot || getHeadshot(f1.id)}
                  alt={f1.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              {p1?.flag && (
                <SafeImage src={p1.flag} alt="" className="mx-auto h-4 w-6 object-contain mb-1" />
              )}
              <p className="text-[15px] font-semibold" style={{
                color: isFinal && f1.winner ? theme.text : isFinal ? theme.textSecondary : theme.text,
              }}>
                {f1.name}
              </p>
              {p1?.nickname && (
                <p className="text-[11px] italic" style={{ color: theme.textSecondary }}>
                  &ldquo;{p1.nickname}&rdquo;
                </p>
              )}
              <p className="text-[11px] font-mono mt-1" style={{ color: theme.textSecondary }}>
                {f1.record || `${p1?.record.wins}-${p1?.record.losses}-${p1?.record.draws}`}
              </p>
            </div>

            {/* Center: VS / Result */}
            <div className="flex flex-col items-center justify-center px-2 pt-6">
              <div
                className="font-mono rounded-xl px-4 py-2 text-[16px] font-bold glass-score"
                style={{ color: theme.text }}
              >
                {isFinal ? (fight.resultType || 'W') : isLive ? `R${fight.round}` : 'vs'}
              </div>
            </div>

            {/* Fighter 2 */}
            <div className="flex-1 text-center">
              <div
                className="mx-auto mb-3 h-20 w-20 rounded-full overflow-hidden"
                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
              >
                <SafeImage
                  src={p2?.headshot || getHeadshot(f2.id)}
                  alt={f2.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              {p2?.flag && (
                <SafeImage src={p2.flag} alt="" className="mx-auto h-4 w-6 object-contain mb-1" />
              )}
              <p className="text-[15px] font-semibold" style={{
                color: isFinal && f2.winner ? theme.text : isFinal ? theme.textSecondary : theme.text,
              }}>
                {f2.name}
              </p>
              {p2?.nickname && (
                <p className="text-[11px] italic" style={{ color: theme.textSecondary }}>
                  &ldquo;{p2.nickname}&rdquo;
                </p>
              )}
              <p className="text-[11px] font-mono mt-1" style={{ color: theme.textSecondary }}>
                {f2.record || `${p2?.record.wins}-${p2?.record.losses}-${p2?.record.draws}`}
              </p>
            </div>
          </div>

          {/* Result Banner */}
          {isFinal && (
            <div
              className="mt-4 rounded-xl p-3 text-center"
              style={{ backgroundColor: darkMode ? 'rgba(10, 18, 12, 0.4)' : theme.bgTertiary }}
            >
              <p className="text-[13px] font-semibold" style={{ color: theme.text }}>
                {f1.winner ? f1.name : f2.winner ? f2.name : 'Draw'} wins
              </p>
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                {fight.resultType && `by ${fight.resultType}`}
                {fight.round && ` · Round ${fight.round}`}
                {fight.clock && ` · ${fight.clock}`}
              </p>
              {fight.referee && (
                <p className="text-[10px] mt-1" style={{ color: theme.textSecondary }}>
                  Referee: {fight.referee}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Fighter Profiles Comparison */}
        {(p1 || p2) && (
          <section className="px-4 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
              Fighter Comparison
            </h2>
            <div className="rounded-xl overflow-hidden glass-card p-4">
              {/* Names header */}
              <div className="flex items-center pb-2 mb-1" style={{ borderBottom: `1px solid rgba(120, 160, 100, 0.07)` }}>
                <span className="flex-1 text-right text-[11px] font-semibold pr-3" style={{ color: theme.accent }}>
                  {f1.shortName || f1.name}
                </span>
                <span className="w-16 flex-shrink-0" />
                <span className="flex-1 text-left text-[11px] font-semibold pl-3" style={{ color: theme.accent }}>
                  {f2.shortName || f2.name}
                </span>
              </div>

              <ProfileRow label="Height" value1={p1?.height} value2={p2?.height} />
              <ProfileRow label="Weight" value1={p1?.weight} value2={p2?.weight} />
              <ProfileRow label="Reach" value1={p1?.reach} value2={p2?.reach} />
              <ProfileRow label="Stance" value1={p1?.stance} value2={p2?.stance} />
              <ProfileRow label="Age" value1={p1?.age?.toString()} value2={p2?.age?.toString()} />
              <ProfileRow label="Team" value1={p1?.association} value2={p2?.association} />

              {/* Record Breakdown */}
              {p1?.record && p2?.record && (
                <>
                  <div className="mt-3 mb-2">
                    <p className="text-[10px] uppercase tracking-wider text-center" style={{ color: theme.textSecondary }}>
                      Record Breakdown
                    </p>
                  </div>
                  <RecordRow label="KO/TKO Wins" value1={p1.record.tkoWins} value2={p2.record.tkoWins} />
                  <RecordRow label="SUB Wins" value1={p1.record.subWins} value2={p2.record.subWins} />
                  <RecordRow label="DEC Wins" value1={p1.record.decWins} value2={p2.record.decWins} />
                  <RecordRow label="KO/TKO Loss" value1={p1.record.tkoLosses} value2={p2.record.tkoLosses} />
                  <RecordRow label="SUB Loss" value1={p1.record.subLosses} value2={p2.record.subLosses} />
                  <RecordRow label="DEC Loss" value1={p1.record.decLosses} value2={p2.record.decLosses} />
                  {(p1.record.titleWins > 0 || p2.record.titleWins > 0) && (
                    <RecordRow label="Title Wins" value1={p1.record.titleWins} value2={p2.record.titleWins} />
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Fight Stats */}
        {isFinal && s1 && s2 && (
          <section className="px-4 py-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: theme.textSecondary }}>
              Fight Statistics
            </h2>
            <div className="rounded-xl overflow-hidden glass-card p-4">
              {/* Fighter name labels */}
              <div className="flex justify-between mb-3">
                <span className="text-[11px] font-semibold" style={{ color: theme.accent }}>{f1.shortName || f1.name}</span>
                <span className="text-[11px] font-semibold" style={{ color: theme.accent }}>{f2.shortName || f2.name}</span>
              </div>

              <StatBar
                label="Knockdowns"
                value1={s1.knockdowns}
                value2={s2.knockdowns}
                display1={String(s1.knockdowns)}
                display2={String(s2.knockdowns)}
              />
              <StatBar
                label="Sig. Strikes"
                value1={s1.sigStrikesLanded}
                value2={s2.sigStrikesLanded}
                display1={`${s1.sigStrikesLanded}/${s1.sigStrikesAttempted}`}
                display2={`${s2.sigStrikesLanded}/${s2.sigStrikesAttempted}`}
              />
              <StatBar
                label="Total Strikes"
                value1={s1.totalStrikesLanded}
                value2={s2.totalStrikesLanded}
                display1={`${s1.totalStrikesLanded}/${s1.totalStrikesAttempted}`}
                display2={`${s2.totalStrikesLanded}/${s2.totalStrikesAttempted}`}
              />
              <StatBar
                label="Takedowns"
                value1={s1.takedownsLanded}
                value2={s2.takedownsLanded}
                display1={`${s1.takedownsLanded}/${s1.takedownsAttempted}`}
                display2={`${s2.takedownsLanded}/${s2.takedownsAttempted}`}
              />
              <StatBar
                label="Sub. Attempts"
                value1={s1.submissionAttempts}
                value2={s2.submissionAttempts}
                display1={String(s1.submissionAttempts)}
                display2={String(s2.submissionAttempts)}
              />

              {/* Control Time */}
              <div className="flex justify-between items-center py-2 mt-1" style={{ borderTop: `1px solid rgba(120, 160, 100, 0.07)` }}>
                <span className="text-[12px] font-mono" style={{ color: theme.text }}>{s1.controlTime}</span>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>Ctrl Time</span>
                <span className="text-[12px] font-mono" style={{ color: theme.text }}>{s2.controlTime}</span>
              </div>

              {/* Strike Breakdown */}
              <div className="mt-3 mb-2">
                <p className="text-[10px] uppercase tracking-wider text-center" style={{ color: theme.textSecondary }}>
                  Significant Strike Breakdown
                </p>
              </div>
              <StatBar
                label="Head"
                value1={s1.headStrikesLanded}
                value2={s2.headStrikesLanded}
                display1={String(s1.headStrikesLanded)}
                display2={String(s2.headStrikesLanded)}
              />
              <StatBar
                label="Body"
                value1={s1.bodyStrikesLanded}
                value2={s2.bodyStrikesLanded}
                display1={String(s1.bodyStrikesLanded)}
                display2={String(s2.bodyStrikesLanded)}
              />
              <StatBar
                label="Leg"
                value1={s1.legStrikesLanded}
                value2={s2.legStrikesLanded}
                display1={String(s1.legStrikesLanded)}
                display2={String(s2.legStrikesLanded)}
              />
            </div>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
