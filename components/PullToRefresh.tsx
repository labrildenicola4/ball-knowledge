'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { useTheme } from '@/lib/theme';
import { tapMedium, notifySuccess } from '@/lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 60;   // px to pull before triggering refresh
const MAX_PULL = 100;   // max visual pull distance

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { theme } = useTheme();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentPull = useRef(0);   // track pull distance in ref for reliable reads
  const pulling = useRef(false);
  const refreshingRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshingRef.current) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop <= 5) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshingRef.current) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      // Resist pull — feels more native
      const resistance = Math.min(diff * 0.45, MAX_PULL);
      currentPull.current = resistance;
      setPullDistance(resistance);
    } else {
      // Scrolling up — cancel pull
      pulling.current = false;
      currentPull.current = 0;
      setPullDistance(0);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    const distance = currentPull.current;

    if (distance >= THRESHOLD && !refreshingRef.current) {
      tapMedium();
      refreshingRef.current = true;
      setRefreshing(true);
      currentPull.current = 40;
      setPullDistance(40); // Hold at refresh position
      try {
        await onRefresh();
        notifySuccess();
      } catch {
        // silently handle
      }
      refreshingRef.current = false;
      setRefreshing(false);
    }

    currentPull.current = 0;
    setPullDistance(0);
  }, [onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 40 : 0) : 0,
          transition: pulling.current ? 'none' : 'height 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        <div
          className={refreshing ? 'animate-spin' : ''}
          style={{
            width: 22,
            height: 22,
            border: '2px solid transparent',
            borderTopColor: theme.accent,
            borderLeftColor: progress >= 1 ? theme.accent : 'transparent',
            borderRadius: '50%',
            opacity: Math.max(progress * 0.8, refreshing ? 1 : 0),
            transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
            transition: pulling.current ? 'none' : 'opacity 0.2s ease',
          }}
        />
      </div>

      {children}
    </div>
  );
}
