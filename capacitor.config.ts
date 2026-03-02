import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ballknowledge.app',
  appName: 'Ball Knowledge',
  webDir: 'out',
  server: {
    // Use the Vercel deployment as the app's server
    // This allows API routes to work since Next.js can't do pure static export with API routes
    url: 'https://ball-knowledge-rho.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Ball Knowledge',
    backgroundColor: '#0a0f0a',
  },
  backgroundColor: '#0a0f0a',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#0a0f0a',
      showSpinner: false,
      splashImmersive: true,
      splashFullScreen: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0f0a',
    },
    Keyboard: {
      resize: 'body' as any,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
