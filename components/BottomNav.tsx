'use client';

import { Home, Calendar, User } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { id: 'home', href: '/', icon: Home, label: 'Home' },
  { id: 'calendar', href: '/calendar', icon: Calendar, label: 'Calendar' },
  { id: 'mystuff', href: '/favorites', icon: User, label: 'My Stuff' },
];

export function BottomNav() {
  const { theme } = useTheme();
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 transition-theme"
      style={{
        backgroundColor: theme.bg,
        borderTop: `1px solid ${theme.border}`,
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}
    >
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-2"
            >
              <item.icon
                size={24}
                color={isActive ? theme.accent : theme.textSecondary}
              />
              <span
                className="text-xs tracking-wide font-medium"
                style={{ color: isActive ? theme.accent : theme.textSecondary }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
