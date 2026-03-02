'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/theme';
import { SafeImage } from '@/components/SafeImage';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

// ─── Options ──────────────────────────────────────────────────────
type BgOption = 'orbs' | 'morphBlobs' | 'colorBands' | 'meshGradient' | 'dotGrid';
type GlassOption = 'current' | 'specular' | 'distort' | 'shimmer' | 'full';

const BG_OPTIONS: { key: BgOption; label: string; subtitle: string }[] = [
  { key: 'orbs', label: 'Orbs', subtitle: 'Current' },
  { key: 'morphBlobs', label: 'Blobs', subtitle: 'Lava lamp' },
  { key: 'colorBands', label: 'Bands', subtitle: 'Stripes' },
  { key: 'meshGradient', label: 'Mesh', subtitle: 'Gradient' },
  { key: 'dotGrid', label: 'Grid', subtitle: 'Dots + color' },
];

const GLASS_OPTIONS: { key: GlassOption; label: string; subtitle: string }[] = [
  { key: 'current', label: 'Current', subtitle: 'Flat frost' },
  { key: 'specular', label: 'Specular', subtitle: 'Light band' },
  { key: 'distort', label: 'Distort', subtitle: 'SVG warp' },
  { key: 'shimmer', label: 'Shimmer', subtitle: 'Light sweep' },
  { key: 'full', label: 'Full', subtitle: 'All combined' },
];

// ─── SVG Filters (defined once, referenced by cards) ─────────────
function GlassFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* Subtle organic distortion — simulates glass refraction */}
        <filter id="glass-distort-subtle">
          <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Medium distortion */}
        <filter id="glass-distort-medium">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="4" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Organic glass surface texture — applied to the highlight overlay */}
        <filter id="glass-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" seed="3" result="noise" />
          <feColorMatrix type="luminanceToAlpha" in="noise" result="alphanoise" />
          <feComponentTransfer in="alphanoise" result="threshold">
            <feFuncA type="linear" slope="0.15" intercept="0" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="threshold" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

// ─── Mock Card ────────────────────────────────────────────────────
function MockCard({
  league, leagueBadge, leagueLogo, homeName, awayName,
  homeLogo, awayLogo, homeScore, awayScore, statusText,
  isLive, broadcast, glassMode,
}: {
  league: string; leagueBadge?: string; leagueLogo?: string;
  homeName: string; awayName: string;
  homeLogo: string; awayLogo: string;
  homeScore: number | null; awayScore: number | null;
  statusText: string; isLive: boolean; broadcast?: string;
  glassMode: GlassOption;
}) {
  const { theme, darkMode } = useTheme();

  const showSpecular = glassMode === 'specular' || glassMode === 'full';
  const showDistort = glassMode === 'distort' || glassMode === 'full';
  const showShimmer = glassMode === 'shimmer' || glassMode === 'full';

  // Extra card styles for distort mode
  const cardStyle: React.CSSProperties = showDistort ? {
    filter: 'url(#glass-distort-subtle)',
  } : {};

  // Enhanced box shadow for specular/full
  const specularShadow = showSpecular
    ? darkMode
      ? '0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200,230,170,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 0 20px rgba(120,160,100,0.06)'
      : '0 12px 40px rgba(40,70,35,0.08), 0 4px 16px rgba(40,70,35,0.04), inset 0 2px 0 rgba(255,255,255,1), inset 0 -2px 4px rgba(40,70,35,0.04), inset 0 0 20px rgba(255,255,255,0.1)'
    : undefined;

  return (
    // Outer wrapper — clean, no filters, just positioning
    <div className="card-press" style={{ position: 'relative', borderRadius: 16 }}>

      {/* ═══ LAYER 1: Glass surface — gets ALL the blur/distortion/shimmer ═══ */}
      <div
        className="glass-match-card transition-theme"
        style={{
          position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden',
          ...(showDistort ? { filter: 'url(#glass-distort-subtle)' } : {}),
          ...(specularShadow ? { boxShadow: specularShadow } : {}),
        }}
      >
        {/* Specular highlight band */}
        {showSpecular && (
          <>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
              background: darkMode
                ? 'linear-gradient(180deg, rgba(180, 220, 150, 0.12) 0%, rgba(150, 190, 120, 0.04) 30%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 100%)',
              borderRadius: '16px 16px 0 0',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
              background: darkMode
                ? 'linear-gradient(90deg, transparent 0%, rgba(200, 240, 170, 0.35) 30%, rgba(220, 255, 190, 0.5) 50%, rgba(200, 240, 170, 0.35) 70%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.7) 30%, rgba(255, 255, 255, 0.95) 50%, rgba(255, 255, 255, 0.7) 70%, transparent 100%)',
              borderRadius: '16px 16px 0 0',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: '5%', right: '5%', height: '1px',
              background: darkMode
                ? 'linear-gradient(90deg, transparent 0%, rgba(120, 160, 100, 0.15) 50%, transparent 100%)'
                : 'linear-gradient(90deg, transparent 0%, rgba(200, 220, 180, 0.3) 50%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '10%', bottom: '10%', left: 0, width: '1px',
              background: darkMode
                ? 'linear-gradient(180deg, rgba(180, 220, 150, 0.15), rgba(120, 160, 100, 0.05), rgba(180, 220, 150, 0.1))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2), rgba(255,255,255,0.4))',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', top: '10%', bottom: '10%', right: 0, width: '1px',
              background: darkMode
                ? 'linear-gradient(180deg, rgba(180, 220, 150, 0.1), rgba(120, 160, 100, 0.03), rgba(180, 220, 150, 0.08))'
                : 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1), rgba(255,255,255,0.3))',
              pointerEvents: 'none',
            }} />
          </>
        )}

        {/* Shimmer sweep */}
        {showShimmer && (
          <div style={{
            position: 'absolute', inset: 0,
            background: darkMode
              ? 'linear-gradient(105deg, transparent 0%, transparent 35%, rgba(180, 220, 150, 0.08) 45%, rgba(200, 240, 170, 0.14) 50%, rgba(180, 220, 150, 0.08) 55%, transparent 65%, transparent 100%)'
              : 'linear-gradient(105deg, transparent 0%, transparent 35%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 55%, transparent 65%, transparent 100%)',
            backgroundSize: '250% 100%',
            animation: 'shimmerSweep 3s ease-in-out infinite',
            borderRadius: '16px',
            pointerEvents: 'none',
          }} />
        )}

        {/* Glass surface texture */}
        {showSpecular && (
          <div style={{
            position: 'absolute', inset: 0,
            background: darkMode
              ? 'radial-gradient(ellipse at 30% 20%, rgba(140, 180, 110, 0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(100, 140, 80, 0.04) 0%, transparent 50%)'
              : 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
            borderRadius: '16px',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* ═══ LAYER 2: Content — completely independent, NO filters inherit ═══ */}
      <div className="p-3 md:p-5" style={{ position: 'relative', zIndex: 5 }}>
        {/* Top row: league info + status badge */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {leagueLogo ? (
              <div style={{
                width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.12)',
              }}>
                <SafeImage src={leagueLogo} alt={league} className="h-4 w-4 object-contain" style={{ filter: 'brightness(1.1)' }} />
              </div>
            ) : leagueBadge ? (
              <span className="rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{
                backgroundColor: darkMode ? 'rgba(255,255,255,0.18)' : theme.accent,
                color: '#ffffff',
                boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.15)',
                letterSpacing: '0.08em',
              }}>
                {leagueBadge}
              </span>
            ) : null}
            {broadcast && (
              <span className="text-[11px] font-bold uppercase tracking-wide" style={{
                color: darkMode ? '#ffffff' : '#2a3a22',
                textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
              }}>{broadcast}</span>
            )}
            {!broadcast && !leagueLogo && (
              <span className="text-sm uppercase tracking-wider font-bold" style={{
                color: darkMode ? '#ffffff' : '#2a3a22',
                textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
              }}>{league}</span>
            )}
          </div>
          {/* Status badge — fully opaque */}
          <span className="font-mono rounded-lg px-3 py-1 text-[14px] font-bold" style={{
            backgroundColor: isLive
              ? (darkMode ? '#c62828' : '#b71c1c')
              : (darkMode ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)'),
            color: isLive ? '#ffffff' : (darkMode ? '#ffffff' : '#2a3a22'),
            boxShadow: isLive
              ? '0 3px 10px rgba(198,40,40,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
              : (darkMode ? '0 3px 8px rgba(0,0,0,0.5)' : '0 2px 6px rgba(0,0,0,0.1)'),
          }}>
            {isLive && '● '}{statusText}
          </span>
        </div>

        {/* Teams + Score row */}
        <div className="flex items-center">
          {/* Away team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
            <div style={{
              width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
              boxShadow: darkMode ? '0 3px 10px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <SafeImage src={awayLogo} alt={awayName} className="h-7 w-7 object-contain" style={{ filter: darkMode ? 'brightness(1.2)' : 'none' }} />
            </div>
            <span className="text-base font-bold line-clamp-2" style={{
              color: darkMode ? '#ffffff' : '#1a2a12',
              textShadow: darkMode ? '0 1px 5px rgba(0,0,0,0.9)' : 'none',
            }}>{awayName}</span>
          </div>

          {/* Score — solid opaque box */}
          <div className="font-mono rounded-xl px-3.5 py-2 text-[17px] font-bold flex-shrink-0" style={{
            backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)',
            color: darkMode ? '#ffffff' : '#1a2a12',
            boxShadow: darkMode
              ? '0 4px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 3px 10px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,1)',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}>
            {homeScore !== null ? `${awayScore} - ${homeScore}` : 'vs'}
          </div>

          {/* Home team */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pl-1 justify-end">
            <span className="text-base font-bold line-clamp-2 text-right" style={{
              color: darkMode ? '#ffffff' : '#1a2a12',
              textShadow: darkMode ? '0 1px 5px rgba(0,0,0,0.9)' : 'none',
            }}>{homeName}</span>
            <div style={{
              width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: darkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
              boxShadow: darkMode ? '0 3px 10px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.12)',
            }}>
              <SafeImage src={homeLogo} alt={homeName} className="h-7 w-7 object-contain" style={{ filter: darkMode ? 'brightness(1.2)' : 'none' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Background Renderers ─────────────────────────────────────────

function MorphBlobsBackground({ darkMode }: { darkMode: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes morphBlob1 {
          0%, 100% { border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%; transform: translate(0, 0) rotate(0deg) scale(1); }
          25% { border-radius: 60% 40% 30% 70% / 40% 60% 40% 60%; transform: translate(8vw, 10vh) rotate(90deg) scale(1.15); }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: translate(-5vw, 15vh) rotate(180deg) scale(0.9); }
          75% { border-radius: 50% 40% 50% 60% / 35% 55% 45% 65%; transform: translate(10vw, -5vh) rotate(270deg) scale(1.1); }
        }
        @keyframes morphBlob2 {
          0%, 100% { border-radius: 50% 50% 40% 60% / 40% 60% 50% 50%; transform: translate(0, 0) rotate(0deg) scale(1); }
          25% { border-radius: 35% 65% 55% 45% / 55% 35% 65% 45%; transform: translate(-12vw, -8vh) rotate(-90deg) scale(1.2); }
          50% { border-radius: 60% 40% 45% 55% / 45% 55% 40% 60%; transform: translate(5vw, -12vh) rotate(-180deg) scale(0.85); }
          75% { border-radius: 45% 55% 60% 40% / 60% 40% 55% 45%; transform: translate(-8vw, 5vh) rotate(-270deg) scale(1.1); }
        }
        @keyframes morphBlob3 {
          0%, 100% { border-radius: 60% 40% 50% 50% / 50% 50% 40% 60%; transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { border-radius: 40% 60% 60% 40% / 40% 60% 50% 50%; transform: translate(6vw, -8vh) rotate(120deg) scale(1.15); }
          66% { border-radius: 50% 50% 40% 60% / 60% 40% 60% 40%; transform: translate(-10vw, 3vh) rotate(240deg) scale(0.9); }
        }
        .morph-blob-1 { animation: morphBlob1 6s ease-in-out infinite; }
        .morph-blob-2 { animation: morphBlob2 7s ease-in-out infinite; }
        .morph-blob-3 { animation: morphBlob3 5s ease-in-out infinite; }
      `}</style>
      <div className="morph-blob-1" style={{
        position: 'absolute', width: '70vw', height: '70vw', maxWidth: 600, maxHeight: 600,
        top: '-5%', left: '-10%',
        background: darkMode
          ? 'radial-gradient(circle, rgba(20, 80, 40, 0.85) 0%, rgba(15, 60, 30, 0.4) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(180, 200, 140, 0.6) 0%, rgba(160, 180, 120, 0.3) 50%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div className="morph-blob-2" style={{
        position: 'absolute', width: '60vw', height: '60vw', maxWidth: 500, maxHeight: 500,
        top: '25%', right: '-15%',
        background: darkMode
          ? 'radial-gradient(circle, rgba(120, 140, 40, 0.8) 0%, rgba(90, 110, 30, 0.35) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(200, 180, 120, 0.55) 0%, rgba(180, 160, 100, 0.25) 50%, transparent 70%)',
        filter: 'blur(35px)',
      }} />
      <div className="morph-blob-3" style={{
        position: 'absolute', width: '65vw', height: '65vw', maxWidth: 550, maxHeight: 550,
        bottom: '-5%', left: '5%',
        background: darkMode
          ? 'radial-gradient(circle, rgba(30, 90, 70, 0.8) 0%, rgba(20, 70, 55, 0.35) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(190, 170, 130, 0.55) 0%, rgba(170, 150, 110, 0.25) 50%, transparent 70%)',
        filter: 'blur(35px)',
      }} />
    </div>
  );
}

function ColorBandsBackground({ darkMode }: { darkMode: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes bandSlide {
          0% { transform: translateX(-50%) rotate(-25deg); }
          100% { transform: translateX(0%) rotate(-25deg); }
        }
        .color-bands { animation: bandSlide 8s linear infinite; }
      `}</style>
      <div className="color-bands" style={{
        position: 'absolute', inset: '-50%', width: '200%', height: '200%',
        background: darkMode
          ? `repeating-linear-gradient(-25deg, rgba(10,30,15,0.9) 0px, rgba(10,30,15,0.9) 60px, rgba(25,70,35,0.7) 60px, rgba(25,70,35,0.7) 120px, rgba(80,100,30,0.5) 120px, rgba(80,100,30,0.5) 180px, rgba(15,50,40,0.7) 180px, rgba(15,50,40,0.7) 240px, rgba(40,80,50,0.6) 240px, rgba(40,80,50,0.6) 300px, rgba(10,30,15,0.9) 300px)`
          : `repeating-linear-gradient(-25deg, rgba(245,240,230,0.9) 0px, rgba(245,240,230,0.9) 60px, rgba(200,190,160,0.5) 60px, rgba(200,190,160,0.5) 120px, rgba(180,200,150,0.4) 120px, rgba(180,200,150,0.4) 180px, rgba(220,210,180,0.5) 180px, rgba(220,210,180,0.5) 240px, rgba(190,180,150,0.4) 240px, rgba(190,180,150,0.4) 300px, rgba(245,240,230,0.9) 300px)`,
      }} />
    </div>
  );
}

function MeshGradientBackground({ darkMode }: { darkMode: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes meshRotate { 0% { transform: rotate(0deg) scale(1.2); } 100% { transform: rotate(360deg) scale(1.2); } }
        .mesh-layer { animation: meshRotate 20s linear infinite; }
        .mesh-layer-reverse { animation: meshRotate 25s linear infinite reverse; }
      `}</style>
      <div className="mesh-layer" style={{
        position: 'absolute', inset: '-20%', width: '140%', height: '140%',
        background: darkMode
          ? 'conic-gradient(from 0deg at 30% 40%, rgba(20,80,40,0.8), rgba(80,100,30,0.6), rgba(15,50,40,0.8), rgba(40,90,50,0.7), rgba(20,80,40,0.8))'
          : 'conic-gradient(from 0deg at 30% 40%, rgba(220,210,180,0.6), rgba(180,200,150,0.4), rgba(200,180,140,0.5), rgba(190,210,160,0.4), rgba(220,210,180,0.6))',
        filter: 'blur(60px)', opacity: 0.8,
      }} />
      <div className="mesh-layer-reverse" style={{
        position: 'absolute', inset: '-10%', width: '120%', height: '120%',
        background: darkMode
          ? 'conic-gradient(from 180deg at 70% 60%, rgba(30,90,70,0.7), rgba(100,120,40,0.5), rgba(10,40,25,0.8), rgba(50,80,40,0.6), rgba(30,90,70,0.7))'
          : 'conic-gradient(from 180deg at 70% 60%, rgba(200,190,150,0.5), rgba(170,190,130,0.3), rgba(230,220,190,0.5), rgba(190,180,140,0.4), rgba(200,190,150,0.5))',
        filter: 'blur(50px)', opacity: 0.7,
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: '10%', width: '60vw', height: '60vw', maxWidth: 500, maxHeight: 500,
        background: darkMode
          ? 'radial-gradient(circle, rgba(60,120,40,0.5) 0%, transparent 60%)'
          : 'radial-gradient(circle, rgba(180,170,130,0.4) 0%, transparent 60%)',
        filter: 'blur(40px)',
      }} />
    </div>
  );
}

function DotGridBackground({ darkMode }: { darkMode: boolean }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
      <style>{`
        @keyframes poolDrift1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(10vw,8vh) scale(1.3); } }
        @keyframes poolDrift2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-8vw,-10vh) scale(1.2); } }
        .pool-1 { animation: poolDrift1 8s ease-in-out infinite; }
        .pool-2 { animation: poolDrift2 10s ease-in-out infinite; }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: darkMode
          ? 'radial-gradient(circle, rgba(120,160,100,0.25) 1.5px, transparent 1.5px)'
          : 'radial-gradient(circle, rgba(100,130,80,0.15) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px', opacity: 0.8,
      }} />
      <div className="pool-1" style={{
        position: 'absolute', width: '50vw', height: '50vw', maxWidth: 400, maxHeight: 400,
        top: '10%', left: '5%', borderRadius: '50%',
        background: darkMode
          ? 'radial-gradient(circle, rgba(30,100,50,0.7) 0%, transparent 60%)'
          : 'radial-gradient(circle, rgba(180,200,140,0.5) 0%, transparent 60%)',
        filter: 'blur(30px)',
      }} />
      <div className="pool-2" style={{
        position: 'absolute', width: '45vw', height: '45vw', maxWidth: 350, maxHeight: 350,
        bottom: '15%', right: '0%', borderRadius: '50%',
        background: darkMode
          ? 'radial-gradient(circle, rgba(90,110,40,0.6) 0%, transparent 60%)'
          : 'radial-gradient(circle, rgba(200,180,130,0.4) 0%, transparent 60%)',
        filter: 'blur(25px)',
      }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function GlassTestPage() {
  const { theme, darkMode } = useTheme();
  const [bgOption, setBgOption] = useState<BgOption>('orbs');
  const [glassOption, setGlassOption] = useState<GlassOption>('current');

  const mockCards = [
    { league: 'NBA', leagueBadge: 'NBA', homeName: 'Celtics', awayName: 'Lakers', homeLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', homeScore: 92, awayScore: 87, statusText: 'Q3 5:42', isLive: true, broadcast: 'ESPN' },
    { league: 'Premier League', leagueLogo: 'https://a.espncdn.com/combiner/i?img=/i/leaguelogos/soccer/500/23.png&w=40&h=40', homeName: 'Arsenal', awayName: 'Man City', homeLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png', homeScore: 1, awayScore: 2, statusText: 'HT 45\'', isLive: true },
    { league: 'NHL', leagueBadge: 'NHL', homeName: 'Bruins', awayName: 'Rangers', homeLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png', homeScore: 1, awayScore: 3, statusText: 'Final', isLive: false },
    { league: 'MLB', leagueBadge: 'MLB', homeName: 'Yankees', awayName: 'Red Sox', homeLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png', awayLogo: 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png', homeScore: null, awayScore: null, statusText: '7:05 PM', isLive: false },
  ];

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      {/* SVG filters for glass distortion */}
      <GlassFilters />

      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmerSweep {
          0% { background-position: 250% 0; }
          50% { background-position: -50% 0; }
          100% { background-position: 250% 0; }
        }
      `}</style>

      {/* Hide the global aurora orbs when using a different background */}
      {bgOption !== 'orbs' && (
        <style>{`
          body > .aurora-container { display: none !important; }
        `}</style>
      )}

      {/* Render selected background */}
      {bgOption === 'morphBlobs' && <MorphBlobsBackground darkMode={darkMode} />}
      {bgOption === 'colorBands' && <ColorBandsBackground darkMode={darkMode} />}
      {bgOption === 'meshGradient' && <MeshGradientBackground darkMode={darkMode} />}
      {bgOption === 'dotGrid' && <DotGridBackground darkMode={darkMode} />}

      <Header />

      {/* Page Title — solid text, no glass parent */}
      <div className="px-4 py-4" style={{
        position: 'relative',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        <div className="glass-divider" style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'relative', zIndex: 5 }}>
          <h1 className="text-2xl font-bold" style={{
            color: darkMode ? '#ffffff' : '#1a2a12',
            textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
          }}>Glass Lab</h1>
          <p className="text-sm mt-1 font-medium" style={{
            color: darkMode ? 'rgba(255,255,255,0.7)' : '#4a5a42',
            textShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.6)' : 'none',
          }}>
            Mix backgrounds + glass treatments
          </p>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24 px-2 sm:px-4 py-4">
        {/* Background Toggle — solid labels */}
        <div className="mb-2">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{
            color: darkMode ? '#ffffff' : '#1a2a12',
            textShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.7)' : 'none',
          }}>Background</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {BG_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setBgOption(opt.key)}
                className={`flex flex-col items-center px-3 py-2 min-w-[62px] rounded-xl transition-all ${bgOption === opt.key ? 'glass-pill-active' : 'glass-pill'}`}
                style={{ color: bgOption === opt.key ? (darkMode ? '#fff' : theme.text) : theme.textSecondary }}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[9px] mt-0.5 opacity-70">{opt.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Glass Treatment Toggle — solid labels */}
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 px-2" style={{
            color: darkMode ? '#ffffff' : '#1a2a12',
            textShadow: darkMode ? '0 1px 3px rgba(0,0,0,0.7)' : 'none',
          }}>Glass Treatment</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {GLASS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setGlassOption(opt.key)}
                className={`flex flex-col items-center px-3 py-2 min-w-[62px] rounded-xl transition-all ${glassOption === opt.key ? 'glass-pill-active' : 'glass-pill'}`}
                style={{ color: glassOption === opt.key ? (darkMode ? '#fff' : theme.text) : theme.textSecondary }}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[9px] mt-0.5 opacity-70">{opt.subtitle}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ LIVE NOW section — two-layer split ═══ */}
        <section style={{ position: 'relative', borderRadius: 12 }}>
          {/* Glass surface */}
          <div className="glass-section" style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden' }} />
          {/* Content — independent layer */}
          <div style={{ position: 'relative', zIndex: 5 }}>
            <div className="px-4 py-3" style={{
              borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}>
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 10px rgba(239,68,68,0.7)',
                }} />
                <h2 className="text-[15px] font-bold uppercase tracking-wider" style={{
                  color: darkMode ? '#ff6b6b' : '#c62828',
                  textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
                }}>Live Now</h2>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{
                  backgroundColor: '#c62828',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(198,40,40,0.5)',
                }}>2</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3.5 p-2 sm:p-3.5">
              {mockCards.filter(c => c.isLive).map((card, i) => (
                <MockCard key={`live-${i}`} {...card} glassMode={glassOption} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7 PM ET section — two-layer split ═══ */}
        <section style={{ position: 'relative', borderRadius: 12, marginTop: 16 }}>
          {/* Glass surface */}
          <div className="glass-section" style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden' }} />
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 5 }}>
            <div className="px-4 py-3" style={{
              borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}>
              <h2 className="text-[17px] font-bold" style={{
                color: darkMode ? '#ffffff' : '#1a2a12',
                textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
              }}>7 PM ET</h2>
            </div>
            <div className="grid grid-cols-1 gap-3.5 p-2 sm:p-3.5">
              {mockCards.filter(c => !c.isLive).map((card, i) => (
                <MockCard key={`upcoming-${i}`} {...card} glassMode={glassOption} />
              ))}
            </div>
          </div>
        </section>

        {/* ═══ Completed section — two-layer split ═══ */}
        <section style={{ position: 'relative', borderRadius: 12, marginTop: 16 }}>
          {/* Glass surface */}
          <div className="glass-section" style={{ position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden' }} />
          {/* Content */}
          <div style={{ position: 'relative', zIndex: 5 }}>
            <div className="px-4 py-3" style={{
              borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}>
              <h2 className="text-[17px] font-bold" style={{
                color: darkMode ? 'rgba(255,255,255,0.75)' : '#4a5a42',
                textShadow: darkMode ? '0 1px 4px rgba(0,0,0,0.8)' : 'none',
              }}>Completed</h2>
            </div>
            <div className="grid grid-cols-1 gap-3.5 p-2 sm:p-3.5">
              <MockCard league="NHL" leagueBadge="NHL" homeName="Bruins" awayName="Rangers" homeLogo="https://a.espncdn.com/i/teamlogos/nhl/500/bos.png" awayLogo="https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png" homeScore={1} awayScore={3} statusText="Final" isLive={false} glassMode={glassOption} />
              <MockCard league="NBA" leagueBadge="NBA" homeName="Warriors" awayName="Suns" homeLogo="https://a.espncdn.com/i/teamlogos/nba/500/gs.png" awayLogo="https://a.espncdn.com/i/teamlogos/nba/500/phx.png" homeScore={118} awayScore={105} statusText="Final" isLive={false} glassMode={glassOption} />
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
