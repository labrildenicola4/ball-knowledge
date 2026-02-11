'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Calendar, User, Menu } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { id: 'home', href: '/', icon: Home, label: 'Home' },
  { id: 'calendar', href: '/calendar', icon: Calendar, label: 'Calendar' },
  { id: 'mystuff', href: '/favorites', icon: User, label: 'My Stuff' },
  { id: 'all', href: '/all', icon: Menu, label: 'All' },
];

export function BottomNav() {
  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const { theme } = useTheme();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (ticking.current) return;

    ticking.current = true;
    requestAnimationFrame(() => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setVisible(true);
      } else if (currentScrollY - lastScrollY.current > 10) {
        setVisible(false);
      } else if (lastScrollY.current - currentScrollY > 10) {
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 transition-theme glass-tab-bar"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease',
      }}
    >
      <div className="flex justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={triggerHaptic}
              className={`tap-highlight flex flex-col items-center gap-1 px-3 py-2 ${isActive ? 'nav-button-press-active' : 'nav-button-press'}`}
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
