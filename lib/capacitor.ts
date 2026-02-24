// Capacitor native platform initialization.
// Safe to import anywhere — no-ops gracefully on web.

export function isNative(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).Capacitor?.isNativePlatform?.()
  );
}

export async function initNative() {
  if (!isNative()) return;

  try {
    // Configure status bar for iOS
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {}

  try {
    // Hide splash screen after app is ready
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {}
}
