'use client';

// Olive Glass — 6 intensity levels from whisper to maximum.

const T: Record<string, string> = {
  Lakers: '#FDB927', Celtics: '#007A33', Chiefs: '#E31837', Bills: '#00338D',
  Yankees: '#1C2841', 'Red Sox': '#BD3039',
};

interface C {
  away: string; home: string; as: string; hs: string;
  badge: string; time: string; live: boolean; final: boolean;
  broadcast?: string;
}

const DATA: C[] = [
  { away: 'Lakers', home: 'Celtics', as: '112', hs: '108', badge: 'NBA', time: 'Q4 3:42', live: true, final: false, broadcast: 'ESPN' },
  { away: 'Chiefs', home: 'Bills', as: '24', hs: '21', badge: 'NFL', time: 'Final', live: false, final: true, broadcast: 'FOX' },
  { away: 'Yankees', home: 'Red Sox', as: '0', hs: '0', badge: 'MLB', time: '7:05 PM', live: false, final: false, broadcast: 'Feb 12' },
];

const mono = "'JetBrains Mono', monospace";
const cg = "'Cormorant Garamond', serif";
const pf = "'Playfair Display', serif";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARD COMPONENT — parameterized by intensity
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface CardStyle {
  cardBg: string;
  blur: string;
  border: string;
  borderTop: string;
  shadow: string;
  liveBg: string;
  liveColor: string;
  liveBorder: string;
  liveShadow: string;
  timeBg: string;
  timeBorder: string;
  timeColor: string;
  badgeColor: string;
  secondaryColor: string;
  logoSize: number;
  logoShadow: string;
  scoreFontSize: number;
  scoreShadow: string;
}

function Card({ away, home, as: aS, hs: hS, badge, time, live, final: fin, broadcast, s }: C & { s: CardStyle }) {
  return (
    <div style={{
      background: s.cardBg,
      backdropFilter: s.blur, WebkitBackdropFilter: s.blur,
      border: s.border, borderTop: s.borderTop,
      borderRadius: 12, padding: 15,
      boxShadow: s.shadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: cg, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: s.badgeColor }}>{badge}</span>
          <span style={{ fontSize: 9, fontWeight: 500, color: s.secondaryColor, fontFamily: cg }}>{broadcast}</span>
        </div>
        {live ? (
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, borderRadius: 8, padding: '4px 12px', background: s.liveBg, border: s.liveBorder, color: s.liveColor, boxShadow: s.liveShadow }}>● {time}</span>
        ) : (
          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 400, borderRadius: 8, padding: s.timeBg !== 'transparent' ? '4px 12px' : undefined, background: s.timeBg, border: s.timeBorder, color: s.timeColor }}>{time}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, paddingRight: 6 }}>
          <div style={{ width: s.logoSize, height: s.logoSize, borderRadius: '50%', flexShrink: 0, backgroundColor: T[away] || '#333', boxShadow: s.logoShadow }} />
          <span style={{ fontFamily: cg, fontSize: 16, fontWeight: 700, color: fin ? '#8b9683' : '#f5f2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{away}</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: s.scoreFontSize, fontWeight: 700, color: '#c4a35a', padding: '4px 8px', flexShrink: 0, textShadow: s.scoreShadow }}>
          {live || fin ? `${aS} - ${hS}` : 'vs'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, paddingLeft: 6, justifyContent: 'flex-end' }}>
          <span style={{ fontFamily: cg, fontSize: 16, fontWeight: 700, color: fin ? '#8b9683' : '#f5f2eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, textAlign: 'right' as const }}>{home}</span>
          <div style={{ width: s.logoSize, height: s.logoSize, borderRadius: '50%', flexShrink: 0, backgroundColor: T[home] || '#333', boxShadow: s.logoShadow }} />
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6 STYLE PRESETS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const S1: CardStyle = {
  cardBg: 'rgba(20, 26, 20, 0.88)',
  blur: 'blur(8px)',
  border: '1px solid rgba(42, 53, 42, 0.9)',
  borderTop: '1px solid rgba(42, 53, 42, 0.9)',
  shadow: '0 1px 4px rgba(0,0,0,0.15)',
  liveBg: 'rgba(196,90,90,0.12)', liveColor: '#c45a5a', liveBorder: 'none', liveShadow: 'none',
  timeBg: 'transparent', timeBorder: 'none', timeColor: '#a8b5a0',
  badgeColor: '#a8b5a0', secondaryColor: '#8b9683',
  logoSize: 32, logoShadow: 'none',
  scoreFontSize: 18, scoreShadow: '0 2px 4px rgba(0,0,0,0.3)',
};

const S2: CardStyle = {
  cardBg: 'rgba(20, 26, 20, 0.78)',
  blur: 'blur(12px) saturate(1.1)',
  border: '1px solid rgba(42, 53, 42, 0.7)',
  borderTop: '1px solid rgba(196, 163, 90, 0.06)',
  shadow: '0 2px 6px rgba(0,0,0,0.2)',
  liveBg: 'rgba(196,90,90,0.12)', liveColor: '#c45a5a', liveBorder: '1px solid rgba(196,90,90,0.08)', liveShadow: 'none',
  timeBg: 'rgba(255,255,255,0.02)', timeBorder: '1px solid rgba(255,255,255,0.03)', timeColor: '#a8b5a0',
  badgeColor: '#a8b5a0', secondaryColor: '#8b9683',
  logoSize: 32, logoShadow: 'none',
  scoreFontSize: 18, scoreShadow: '0 2px 4px rgba(0,0,0,0.3)',
};

const S3: CardStyle = {
  cardBg: 'rgba(20, 26, 20, 0.65)',
  blur: 'blur(16px) saturate(1.2)',
  border: '1px solid rgba(42, 53, 42, 0.5)',
  borderTop: '1px solid rgba(196, 163, 90, 0.1)',
  shadow: '0 2px 10px rgba(0,0,0,0.25), 0 0 1px rgba(196, 163, 90, 0.04)',
  liveBg: 'rgba(196,90,90,0.15)', liveColor: '#c45a5a', liveBorder: '1px solid rgba(196,90,90,0.1)', liveShadow: '0 1px 3px rgba(0,0,0,0.1)',
  timeBg: 'rgba(255,255,255,0.03)', timeBorder: '1px solid rgba(255,255,255,0.05)', timeColor: '#a8b5a0',
  badgeColor: 'rgba(168, 181, 160, 0.7)', secondaryColor: '#8b9683',
  logoSize: 32, logoShadow: '0 1px 4px rgba(0,0,0,0.15)',
  scoreFontSize: 18, scoreShadow: '0 2px 4px rgba(0,0,0,0.3)',
};

const S4: CardStyle = {
  cardBg: 'rgba(20, 26, 20, 0.55)',
  blur: 'blur(20px) saturate(1.3)',
  border: '1px solid rgba(196, 163, 90, 0.12)',
  borderTop: '1px solid rgba(196, 163, 90, 0.15)',
  shadow: '0 3px 12px rgba(0,0,0,0.3), 0 0 1px rgba(196, 163, 90, 0.06)',
  liveBg: 'rgba(196,90,90,0.18)', liveColor: '#e07070', liveBorder: '1px solid rgba(196,90,90,0.15)', liveShadow: '0 2px 6px rgba(0,0,0,0.15)',
  timeBg: 'rgba(255,255,255,0.04)', timeBorder: '1px solid rgba(255,255,255,0.06)', timeColor: '#a8b5a0',
  badgeColor: 'rgba(168, 181, 160, 0.6)', secondaryColor: '#7a8a72',
  logoSize: 32, logoShadow: '0 2px 5px rgba(0,0,0,0.2)',
  scoreFontSize: 18, scoreShadow: '0 2px 6px rgba(0,0,0,0.35)',
};

const S5: CardStyle = {
  cardBg: 'rgba(20, 26, 20, 0.45)',
  blur: 'blur(24px) saturate(1.4)',
  border: '1px solid rgba(196, 163, 90, 0.15)',
  borderTop: '1px solid rgba(196, 163, 90, 0.2)',
  shadow: '0 4px 16px rgba(0,0,0,0.3), 0 0 2px rgba(196, 163, 90, 0.06), inset 0 1px 0 rgba(255,255,255,0.02)',
  liveBg: 'rgba(196,90,90,0.2)', liveColor: '#e07070', liveBorder: '1px solid rgba(196,90,90,0.18)', liveShadow: '0 2px 8px rgba(196,90,90,0.08)',
  timeBg: 'rgba(255,255,255,0.04)', timeBorder: '1px solid rgba(255,255,255,0.07)', timeColor: '#a8b5a0',
  badgeColor: 'rgba(168, 181, 160, 0.5)', secondaryColor: '#7a8a72',
  logoSize: 36, logoShadow: '0 2px 6px rgba(0,0,0,0.25)',
  scoreFontSize: 20, scoreShadow: '0 2px 8px rgba(0,0,0,0.4)',
};

const S6: CardStyle = {
  cardBg: 'rgba(20, 26, 20, 0.35)',
  blur: 'blur(28px) saturate(1.5)',
  border: '1px solid rgba(196, 163, 90, 0.2)',
  borderTop: '1px solid rgba(196, 163, 90, 0.25)',
  shadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 3px rgba(196, 163, 90, 0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
  liveBg: 'rgba(196,90,90,0.22)', liveColor: '#e88', liveBorder: '1px solid rgba(196,90,90,0.2)', liveShadow: '0 0 10px rgba(196,90,90,0.1), 0 2px 6px rgba(0,0,0,0.2)',
  timeBg: 'rgba(255,255,255,0.05)', timeBorder: '1px solid rgba(255,255,255,0.08)', timeColor: '#b8c4b0',
  badgeColor: 'rgba(168, 181, 160, 0.5)', secondaryColor: '#7a8a72',
  logoSize: 36, logoShadow: '0 3px 8px rgba(0,0,0,0.3)',
  scoreFontSize: 20, scoreShadow: '0 3px 8px rgba(0,0,0,0.4)',
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHONE + HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Phone({ borderColor, children }: { borderColor: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 375, width: '100%', border: `1px solid ${borderColor}`, borderRadius: 20, overflow: 'hidden', backgroundColor: '#0a0f0a', position: 'relative' as const }}>
      {children}
    </div>
  );
}

function Label({ name, subtitle, color }: { name: string; subtitle: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' as const, marginBottom: 8 }}>
      <div style={{ fontFamily: pf, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color }}>{name}</div>
      <div style={{ fontFamily: cg, fontSize: 10, fontWeight: 500, fontStyle: 'italic' as const, color: '#6b7a63', marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ height: 44, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4 }}>
      <span style={{ fontSize: 10, fontFamily: mono, color: '#a8b5a0' }}>9:41</span>
    </div>
  );
}

function Cards({ style: s }: { style: CardStyle }) {
  return (
    <div style={{ padding: '0 4px 16px 4px' }}>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        {DATA.map((c, i) => <Card key={i} {...c} s={s} />)}
      </div>
    </div>
  );
}

interface Orb { top?: string; bottom?: string; left?: string; right?: string; size: number; color: string; blur: number }

function Orbs({ orbs }: { orbs: Orb[] }) {
  return (
    <>
      {orbs.map((o, i) => (
        <div key={i} style={{
          position: 'absolute' as const,
          top: o.top, bottom: o.bottom, left: o.left, right: o.right,
          width: o.size, height: o.size, borderRadius: '50%',
          background: o.color, filter: `blur(${o.blur}px)`,
        }} />
      ))}
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function PreviewCardsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060806' }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');` }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{
          fontFamily: pf, fontWeight: 700, color: '#c4a35a',
          fontSize: 13, letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          textAlign: 'center' as const, marginBottom: 24,
        }}>
          Olive Glass — Intensity Options
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, justifyItems: 'center' }}>

          {/* 1: WHISPER */}
          <div>
            <Label name="Whisper" subtitle="Barely there glass, hint of gold" color="#6b7a63" />
            <Phone borderColor="#2a352a">
              <StatusBar />
              <Cards style={S1} />
            </Phone>
          </div>

          {/* 2: SUBTLE */}
          <div>
            <Label name="Subtle" subtitle="Gentle glass, soft gold edge" color="#8b9683" />
            <Phone borderColor="rgba(42, 53, 42, 0.7)">
              <div style={{ position: 'absolute' as const, top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: 100, height: 100, borderRadius: '50%', background: 'rgba(74, 93, 58, 0.08)', filter: 'blur(60px)' }} />
              <div style={{ position: 'relative' as const, zIndex: 1 }}>
                <StatusBar />
                <Cards style={S2} />
              </div>
            </Phone>
          </div>

          {/* 3: BALANCED */}
          <div>
            <Label name="Balanced" subtitle="Clear glass, gold edges visible" color="#a8b5a0" />
            <Phone borderColor="rgba(196, 163, 90, 0.08)">
              <Orbs orbs={[
                { top: '20%', left: '10%', size: 130, color: 'rgba(74, 93, 58, 0.1)', blur: 50 },
                { bottom: '30%', right: '10%', size: 100, color: 'rgba(196, 163, 90, 0.04)', blur: 50 },
              ]} />
              <div style={{ position: 'relative' as const, zIndex: 1 }}>
                <StatusBar />
                <Cards style={S3} />
              </div>
            </Phone>
          </div>

          {/* 4: RICH */}
          <div>
            <Label name="Rich" subtitle="Deep glass, warm gold presence" color="#c4a35a" />
            <Phone borderColor="rgba(196, 163, 90, 0.1)">
              <Orbs orbs={[
                { top: '15%', left: '5%', size: 150, color: 'rgba(74, 93, 58, 0.12)', blur: 50 },
                { bottom: '25%', right: '8%', size: 110, color: 'rgba(196, 163, 90, 0.05)', blur: 50 },
              ]} />
              <div style={{ position: 'relative' as const, zIndex: 1 }}>
                <StatusBar />
                <Cards style={S4} />
              </div>
            </Phone>
          </div>

          {/* 5: DEEP */}
          <div>
            <Label name="Deep" subtitle="More glass, more gold, more depth" color="#c4a35a" />
            <Phone borderColor="rgba(196, 163, 90, 0.12)">
              <Orbs orbs={[
                { top: '12%', left: '5%', size: 160, color: 'rgba(74, 93, 58, 0.15)', blur: 45 },
                { bottom: '20%', right: '5%', size: 120, color: 'rgba(196, 163, 90, 0.06)', blur: 45 },
                { top: '60%', left: '60%', size: 80, color: 'rgba(74, 93, 58, 0.08)', blur: 40 },
              ]} />
              <div style={{ position: 'relative' as const, zIndex: 1 }}>
                <StatusBar />
                <Cards style={S5} />
              </div>
            </Phone>
          </div>

          {/* 6: MAXIMUM */}
          <div>
            <Label name="Maximum" subtitle="Full glass depth, bold gold, all layers" color="#c4a35a" />
            <Phone borderColor="rgba(196, 163, 90, 0.15)">
              <Orbs orbs={[
                { top: '10%', left: '5%', size: 180, color: 'rgba(74, 93, 58, 0.18)', blur: 40 },
                { bottom: '18%', right: '5%', size: 140, color: 'rgba(196, 163, 90, 0.08)', blur: 40 },
                { top: '55%', left: '55%', size: 90, color: 'rgba(74, 93, 58, 0.1)', blur: 35 },
              ]} />
              <div style={{ position: 'relative' as const, zIndex: 1 }}>
                <StatusBar />
                <Cards style={S6} />
              </div>
            </Phone>
          </div>
        </div>
      </div>
    </div>
  );
}
