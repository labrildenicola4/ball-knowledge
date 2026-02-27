'use client';

import { memo } from 'react';
import { useTheme } from '@/lib/theme';
import { useOdds, UseOddsParams } from '@/lib/use-odds';

interface CompactOddsProps extends UseOddsParams {
  leftLabel: string;
  rightLabel: string;
  leftSide: 'home' | 'away';
}

export const CompactOdds = memo(function CompactOdds(props: CompactOddsProps) {
  const { theme } = useTheme();
  const { odds } = useOdds(props);

  if (!odds) return null;

  const hasDraw = odds.hasDraw ?? odds.draw > 0;
  const homePct = Math.round(odds.homeWin * 100);
  const awayPct = Math.round(odds.awayWin * 100);
  const drawPct = hasDraw ? Math.round(odds.draw * 100) : 0;

  // Match the card layout: left team gets left side, right team gets right side
  const leftIsHome = props.leftSide === 'home';
  const leftPct = leftIsHome ? homePct : awayPct;
  const rightPct = leftIsHome ? awayPct : homePct;
  const leftColor = leftIsHome ? theme.green : theme.red;
  const rightColor = leftIsHome ? theme.red : theme.green;

  return (
    <div style={{
      marginTop: 10,
      paddingTop: 8,
      borderTop: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          color: leftColor,
        }}>
          {props.leftLabel} <span style={{ fontWeight: 600 }}>{leftPct}%</span>
        </span>
        {hasDraw ? (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            fontWeight: 500,
            color: theme.gold,
          }}>
            Draw <span style={{ fontWeight: 600 }}>{drawPct}%</span>
          </span>
        ) : (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 7,
            color: 'rgba(138,133,120,0.5)',
          }}>
            Polymarket
          </span>
        )}
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 500,
          color: rightColor,
        }}>
          {props.rightLabel} <span style={{ fontWeight: 600 }}>{rightPct}%</span>
        </span>
      </div>
      <div style={{
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        gap: 1,
      }}>
        <div style={{
          width: `${leftPct}%`,
          backgroundColor: leftColor,
          borderRadius: '2px 0 0 2px',
          transition: 'width 0.5s ease',
        }} />
        {hasDraw && (
          <div style={{
            width: `${drawPct}%`,
            backgroundColor: theme.gold,
            transition: 'width 0.5s ease',
          }} />
        )}
        <div style={{
          width: `${rightPct}%`,
          backgroundColor: rightColor,
          borderRadius: '0 2px 2px 0',
          transition: 'width 0.5s ease',
        }} />
      </div>
      {hasDraw && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 7,
          color: 'rgba(138,133,120,0.5)',
          marginTop: 3,
          textAlign: 'right',
        }}>
          Polymarket
        </div>
      )}
    </div>
  );
});
