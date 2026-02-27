'use client';

import { useTheme } from '@/lib/theme';

interface TrackMapProps {
  circuitName?: string;
}

export function TrackMap({ circuitName }: TrackMapProps) {
  const { theme, darkMode } = useTheme();

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-[120px] w-[200px] flex-col items-center justify-center rounded-2xl ${darkMode ? 'glass-card' : ''}`}
        style={{
          border: `2px dashed ${darkMode ? 'rgba(120, 160, 100, 0.15)' : theme.border}`,
          ...(!darkMode ? { backgroundColor: theme.bgTertiary } : {}),
        }}
      >
        {circuitName && (
          <p className="text-[12px] font-medium text-center px-3 leading-tight" style={{ color: theme.text }}>
            {circuitName}
          </p>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: theme.textSecondary }}>
        Track Map
      </p>
    </div>
  );
}
