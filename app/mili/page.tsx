'use client';

import { useTheme } from '@/lib/theme';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function MiliPage() {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col transition-theme">
      <Header />

      {/* Page header with back button */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="glass-pill flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36 }}
          >
            <ChevronLeft size={20} style={{ color: theme.text }} />
          </Link>
          <h1
            className="text-xl font-bold"
            style={{ color: theme.text }}
          >
            Ask Mili
          </h1>
        </div>
      </div>

      {/* Coming Soon card */}
      <main className="flex flex-1 items-center justify-center px-6 pb-32">
        <div
          className="glass-card w-full max-w-sm rounded-2xl p-8 text-center"
        >
          {/* Icon */}
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${theme.accent}33` }}
          >
            <Sparkles size={30} style={{ color: theme.gold }} />
          </div>

          {/* Title */}
          <h2
            className="mb-2 text-2xl font-bold"
            style={{ color: theme.text }}
          >
            Coming Soon
          </h2>

          {/* Description */}
          <p
            className="mb-6 text-sm leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            Mili is your AI-powered sports assistant. Ask about stats,
            matchups, trends, and more — all powered by real-time data.
          </p>

          {/* Decorative divider */}
          <div
            className="mx-auto mb-6 h-px w-16"
            style={{ backgroundColor: theme.border }}
          />

          {/* Status badge */}
          <div
            className="glass-pill mx-auto inline-flex items-center gap-2 rounded-full px-4 py-2"
          >
            <span
              className="h-2 w-2 animate-pulse rounded-full"
              style={{ backgroundColor: theme.gold }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: theme.textSecondary }}
            >
              In Development
            </span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
