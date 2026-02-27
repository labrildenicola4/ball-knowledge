'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Check initial state after mount
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <WifiOff size={48} style={{ color: theme.textSecondary }} />
      <p className="mt-4 text-[14px] font-medium" style={{ color: theme.text }}>
        No internet connection
      </p>
      <p className="mt-1 text-[12px]" style={{ color: theme.textSecondary }}>
        Check your connection and try again
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-lg px-6 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-80 active:opacity-70"
        style={{ backgroundColor: theme.accent }}
      >
        Retry
      </button>
    </div>
  );
}
