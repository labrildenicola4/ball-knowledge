'use client';

import { Moon, Sun, Trash2, Info, ExternalLink, ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { useTheme } from '@/lib/theme';
import { useFavorites } from '@/lib/use-favorites';
import { useSafeBack } from '@/lib/use-safe-back';

export default function SettingsPage() {
  const goBack = useSafeBack('/');
  const { theme, darkMode, toggleDarkMode } = useTheme();
  const { favorites, clearFavorites } = useFavorites();

  const SettingRow = ({
    icon: Icon,
    label,
    description,
    action,
  }: {
    icon: React.ElementType;
    label: string;
    description?: string;
    action: React.ReactNode;
  }) => (
    <div
      className={`flex items-center gap-4 rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
      style={darkMode ? undefined : {
        backgroundColor: theme.bgSecondary,
        border: `1px solid ${theme.border}`,
      }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={darkMode ? undefined : { backgroundColor: theme.bgTertiary }}
      >
        <Icon size={20} color={theme.accent} />
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        {description && (
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="tap-highlight relative h-11 w-16 rounded-full transition-colors"
      style={{ backgroundColor: enabled ? theme.accent : theme.bgTertiary }}
    >
      <div
        className="absolute top-1.5 h-8 w-8 rounded-full bg-white transition-transform"
        style={{ left: enabled ? '30px' : '6px' }}
      />
    </button>
  );

  return (
    <div
      className="flex min-h-screen flex-col transition-theme"
      style={{ backgroundColor: darkMode ? 'transparent' : theme.bg }}
    >
      <header className="safe-top flex items-center gap-3 px-4 py-3 glass-header">
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold" style={{ color: theme.text }}>Settings</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-4 py-4">
        {/* Appearance Section */}
        <h2
          className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={darkMode ? undefined : { color: theme.textSecondary }}
        >
          Appearance
        </h2>
        <div className="mb-6 flex flex-col gap-3">
          <SettingRow
            icon={darkMode ? Moon : Sun}
            label="Dark Mode"
            description={darkMode ? 'Currently using dark theme' : 'Currently using light theme'}
            action={<Toggle enabled={darkMode} onToggle={toggleDarkMode} />}
          />
        </div>

        {/* Data Section */}
        <h2
          className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={darkMode ? undefined : { color: theme.textSecondary }}
        >
          Data
        </h2>
        <div className="mb-6 flex flex-col gap-3">
          <SettingRow
            icon={Trash2}
            label="Clear Favorites"
            description={`${favorites.length} team${favorites.length !== 1 ? 's' : ''} saved`}
            action={
              <button
                onClick={() => {
                  if (favorites.length > 0 && confirm('Clear all favorite teams?')) {
                    clearFavorites();
                  }
                }}
                className="tap-highlight rounded-lg px-4 py-2.5 text-[11px] font-medium"
                style={{
                  backgroundColor: favorites.length > 0 ? theme.red : theme.bgTertiary,
                  color: favorites.length > 0 ? '#fff' : theme.textSecondary,
                  opacity: favorites.length > 0 ? 1 : 0.5,
                }}
                disabled={favorites.length === 0}
              >
                Clear
              </button>
            }
          />
        </div>

        {/* About Section */}
        <h2
          className="mb-3 text-[10px] font-semibold uppercase tracking-wider"
          style={darkMode ? undefined : { color: theme.textSecondary }}
        >
          About
        </h2>
        <div className="flex flex-col gap-3">
          <SettingRow
            icon={Info}
            label="Ball Knowledge"
            description="Version 1.0.0"
            action={
              <span className="text-[11px]" style={{ color: theme.textSecondary }}>
                v1.0.0
              </span>
            }
          />
          <a
            href="https://www.api-football.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={`card-press flex items-center gap-4 rounded-xl p-4 ${darkMode ? 'glass-card' : ''}`}
            style={darkMode ? undefined : {
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={darkMode ? undefined : { backgroundColor: theme.bgTertiary }}
            >
              <ExternalLink size={20} color={theme.accent} />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium">Data Provider</p>
              <p className="text-[11px]" style={{ color: theme.textSecondary }}>
                Powered by API-Football
              </p>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px]" style={{ color: theme.textSecondary }}>
            Football data provided by API-Football
          </p>
          <p className="mt-1 text-[10px]" style={{ color: theme.textSecondary }}>
            Premier League, LaLiga, Serie A, Bundesliga, Ligue 1
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
