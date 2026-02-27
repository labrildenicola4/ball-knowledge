'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { tapMedium } from '@/lib/haptics';
import { UFCFight } from '@/lib/types/ufc';
import { useFavorites } from '@/lib/use-favorites';
import { SafeImage } from '@/components/SafeImage';

interface UFCFightCardProps {
  fight: UFCFight;
  eventId: string;
}

export const UFCFightCard = memo(function UFCFightCard({ fight, eventId }: UFCFightCardProps) {
  const { theme, darkMode } = useTheme();
  const { toggleFavorite, isFavorite, isLoggedIn } = useFavorites();
  const isLive = fight.status === 'in_progress';
  const isFinal = fight.status === 'final';

  return (
    <Link href={`/ufc/fight/${eventId}/${fight.id}`}>
      <div className="card-press cursor-pointer p-4 md:p-5 transition-theme glass-match-card">
        {/* Header: weight class + status */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded px-2 py-0.5 text-[10px] font-medium uppercase"
              style={{ backgroundColor: theme.accent, color: '#fff' }}>
              UFC
            </span>
            {fight.weightClass && (
              <span className="text-[11px] font-medium" style={{ color: theme.textSecondary }}>
                {fight.weightClass}
              </span>
            )}
          </div>
          <span className={`font-mono rounded-lg px-3 py-1 text-[12px] ${isLive ? 'glass-badge-live' : 'glass-badge'}`}
            style={{ color: isLive ? '#fff' : theme.textSecondary }}>
            {isLive ? `● R${fight.round} ${fight.clock}` : isFinal ? (fight.resultType || 'Final') : fight.startTime}
          </span>
        </div>

        {/* Fighters */}
        <div className="flex items-center">
          {/* Fighter 1 */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              {fight.fighter1.id && (
                <SafeImage
                  src={`https://a.espncdn.com/i/headshots/mma/players/full/${fight.fighter1.id}.png`}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  loading="lazy"
                />
              )}
              <span className="text-[15px] font-medium truncate cursor-pointer"
                style={{
                  color: isFinal && fight.fighter1.winner ? theme.text : isFinal ? theme.textSecondary : theme.text,
                  fontWeight: isFinal && fight.fighter1.winner ? 600 : 500,
                }}
                onClick={(e) => {
                  if (fight.fighter1.id) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/player/ufc/${fight.fighter1.id}`;
                  }
                }}
              >
                {fight.fighter1.name}
              </span>
              {isLoggedIn && fight.fighter1.id && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); tapMedium(); toggleFavorite('ufc_fighter', Number(fight.fighter1.id)); }}
                  className="tap-highlight flex h-6 w-6 items-center justify-center rounded-full glass-pill flex-shrink-0"
                >
                  <Heart
                    size={10}
                    color={theme.gold}
                    fill={isFavorite('ufc_fighter', Number(fight.fighter1.id)) ? theme.gold : 'none'}
                  />
                </button>
              )}
            </div>
            {fight.fighter1.record && (
              <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                {fight.fighter1.record}
              </span>
            )}
          </div>

          {/* Center */}
          <div className="font-mono rounded-lg px-3 py-2 text-[15px] font-semibold flex-shrink-0 glass-score score-text"
            style={{ color: theme.text }}>
            {isFinal ? (
              <span className="text-[11px]">{fight.resultType || 'W'}</span>
            ) : 'vs'}
          </div>

          {/* Fighter 2 */}
          <div className="flex-1 min-w-0 pl-2 text-right">
            <div className="flex items-center justify-end gap-1.5">
              {isLoggedIn && fight.fighter2.id && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); tapMedium(); toggleFavorite('ufc_fighter', Number(fight.fighter2.id)); }}
                  className="tap-highlight flex h-6 w-6 items-center justify-center rounded-full glass-pill flex-shrink-0"
                >
                  <Heart
                    size={10}
                    color={theme.gold}
                    fill={isFavorite('ufc_fighter', Number(fight.fighter2.id)) ? theme.gold : 'none'}
                  />
                </button>
              )}
              <span className="text-[15px] font-medium truncate cursor-pointer"
                style={{
                  color: isFinal && fight.fighter2.winner ? theme.text : isFinal ? theme.textSecondary : theme.text,
                  fontWeight: isFinal && fight.fighter2.winner ? 600 : 500,
                }}
                onClick={(e) => {
                  if (fight.fighter2.id) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/player/ufc/${fight.fighter2.id}`;
                  }
                }}
              >
                {fight.fighter2.name}
              </span>
              {fight.fighter2.id && (
                <SafeImage
                  src={`https://a.espncdn.com/i/headshots/mma/players/full/${fight.fighter2.id}.png`}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                  style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : theme.bgTertiary }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  loading="lazy"
                />
              )}
            </div>
            {fight.fighter2.record && (
              <span className="text-[10px]" style={{ color: theme.textSecondary }}>
                {fight.fighter2.record}
              </span>
            )}
          </div>
        </div>

        {/* Card segment + broadcast */}
        {(fight.cardSegment || fight.broadcast) && (
          <div className="mt-2.5 flex items-center justify-center gap-2">
            {fight.cardSegment && (
              <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                {fight.cardSegment}
              </span>
            )}
            {fight.broadcast && !isFinal && (
              <span className="rounded px-1.5 py-0.5 text-[9px] font-medium glass-pill"
                style={{ color: theme.textSecondary }}>
                {fight.broadcast}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});
