'use client';

import { useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { Capacitor } from '@capacitor/core';

export function CapacitorInit() {
  const { darkMode } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPlugins = async () => {
      // Status bar — match theme mode
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({
        style: darkMode ? Style.Dark : Style.Light,
      });

      // Splash screen — auto-hidden by config, but ensure it's dismissed
      const { SplashScreen } = await import('@capacitor/splash-screen');
      await SplashScreen.hide();

      // Keyboard — iOS keyboard behavior
      const { Keyboard } = await import('@capacitor/keyboard');
      Keyboard.setAccessoryBarVisible({ isVisible: false });

      // App lifecycle — reload on resume after 5+ min in background
      const { App } = await import('@capacitor/app');
      let backgroundedAt: number | null = null;

      const stateHandle = await App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          backgroundedAt = Date.now();
        } else if (backgroundedAt && Date.now() - backgroundedAt > 5 * 60 * 1000) {
          window.location.reload();
        }
      });

      const backHandle = await App.addListener('backButton', () => {
        window.history.back();
      });

      cleanupRef = () => {
        stateHandle.remove();
        backHandle.remove();
      };
    };

    let cleanupRef: (() => void) | undefined;
    initPlugins().catch(console.error);

    return () => {
      cleanupRef?.();
    };
  }, [darkMode]);

  return null;
}
