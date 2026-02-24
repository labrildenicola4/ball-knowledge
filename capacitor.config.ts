import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ballknowledge.app',
  appName: 'Ball Knowledge',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#0a0f0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0f0a',
    },
  },
  ios: {
    scheme: 'Ball Knowledge',
    contentInset: 'automatic',
  },
  server: {
    // For development: uncomment the url line and run `npm run dev` first
    // url: 'http://localhost:3000',
    androidScheme: 'https',
    iosScheme: 'https',
  },
};

export default config;
