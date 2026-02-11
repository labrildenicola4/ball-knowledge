'use client';

import { useState } from 'react';
import {
  NFL_TEAMS,
  NBA_TEAMS,
  MLB_TEAMS as MLB_SEARCH_TEAMS,
  COLLEGE_BASKETBALL_TEAMS,
  COLLEGE_FOOTBALL_TEAMS,
  TEAMS as SOCCER_TEAMS,
  SEARCHABLE_SOCCER_LEAGUES,
} from '@/lib/search-data';

type LogoEntry = { name: string; logo: string };

const sections: { title: string; teams: LogoEntry[] }[] = [
  {
    title: 'NFL',
    teams: NFL_TEAMS.map((t) => ({ name: t.name, logo: t.logo })),
  },
  {
    title: 'NBA',
    teams: NBA_TEAMS.map((t) => ({ name: t.name, logo: t.logo })),
  },
  {
    title: 'MLB',
    teams: MLB_SEARCH_TEAMS.map((t) => ({ name: t.name, logo: t.logo })),
  },
  {
    title: 'NCAA Basketball',
    teams: COLLEGE_BASKETBALL_TEAMS.map((t) => ({ name: t.name, logo: t.logo })),
  },
  {
    title: 'NCAA Football',
    teams: COLLEGE_FOOTBALL_TEAMS.map((t) => ({ name: t.name, logo: t.logo })),
  },
  {
    title: 'Soccer Leagues',
    teams: SEARCHABLE_SOCCER_LEAGUES.map((l) => ({ name: l.name, logo: l.logo })),
  },
  {
    title: 'Soccer Teams',
    teams: SOCCER_TEAMS.map((t) => ({ name: t.name, logo: t.logo })),
  },
];

const SHADOW_FILTER =
  'drop-shadow(0 0 1px rgba(245, 242, 235, 0.3)) drop-shadow(0 0 4px rgba(245, 242, 235, 0.08))';
const WHITE_OUTLINE_SHADOW =
  'drop-shadow(0 0 1px rgba(255,255,255,0.6)) drop-shadow(0 0 2px rgba(255,255,255,0.3))';
const WHITE_FILTER = 'brightness(0) invert(1)';

export default function DebugLogosPage() {
  const [whiteBacking, setWhiteBacking] = useState(false);
  const [logoShadow, setLogoShadow] = useState(false);
  const [whiteOutline, setWhiteOutline] = useState(false);
  const [whiteFilter, setWhiteFilter] = useState(false);

  return (
    <div style={{ backgroundColor: '#0a0f0a', color: '#f5f2eb', minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Logo Dark Mode Audit</h1>
        <button
          onClick={() => setWhiteBacking(!whiteBacking)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #2a352a',
            backgroundColor: whiteBacking ? '#4a5d3a' : '#1c241c',
            color: '#f5f2eb',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {whiteBacking ? 'White backing: ON' : 'White backing: OFF'}
        </button>
        <button
          onClick={() => setLogoShadow(!logoShadow)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #2a352a',
            backgroundColor: logoShadow ? '#6b4c8a' : '#1c241c',
            color: '#f5f2eb',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {logoShadow ? 'Logo shadow: ON' : 'Logo shadow: OFF'}
        </button>
        <button
          onClick={() => setWhiteOutline(!whiteOutline)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #2a352a',
            backgroundColor: whiteOutline ? '#3a6b8a' : '#1c241c',
            color: '#f5f2eb',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {whiteOutline ? 'White outline: ON' : 'White outline: OFF'}
        </button>
        <button
          onClick={() => setWhiteFilter(!whiteFilter)}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #2a352a',
            backgroundColor: whiteFilter ? '#8a3a3a' : '#1c241c',
            color: '#f5f2eb',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {whiteFilter ? 'White filter: ON' : 'White filter: OFF'}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, fontSize: 12, color: '#a8b5a0' }}>
        <span>Left = dark bg{logoShadow ? ' + shadow' : ''}{whiteBacking ? ' + white backing' : ''}{whiteOutline ? ' + outline' : ''}{whiteFilter ? ' + white filter' : ''}</span>
        <span>Right = white bg (reference)</span>
      </div>

      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#a8b5a0' }}>
            {section.title} ({section.teams.length})
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            {section.teams.map((team, i) => {
              const filters: string[] = [];
              if (logoShadow) filters.push(SHADOW_FILTER);
              if (whiteOutline) filters.push(WHITE_OUTLINE_SHADOW);
              if (whiteFilter) filters.push(WHITE_FILTER);
              const filterValue = filters.length > 0 ? filters.join(' ') : undefined;

              return (
              <div
                key={`${section.title}-${i}`}
                style={{
                  border: '1px solid #2a352a',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Dark background */}
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: '#0a0f0a',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #2a352a',
                      position: 'relative',
                    }}
                  >
                    {whiteBacking && (
                      <div
                        style={{
                          position: 'absolute',
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255,255,255,0.15)',
                        }}
                      />
                    )}
                    <img
                      src={team.logo}
                      alt={team.name}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'contain',
                        position: 'relative',
                        filter: filterValue,
                      }}
                      loading="lazy"
                    />
                  </div>
                  {/* White background */}
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={team.logo}
                      alt={team.name}
                      style={{ width: 48, height: 48, objectFit: 'contain' }}
                      loading="lazy"
                    />
                  </div>
                </div>
                <span style={{ fontSize: 11, textAlign: 'center', color: '#a8b5a0' }}>
                  {team.name}
                </span>
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
