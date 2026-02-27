import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/lib/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CapacitorInit } from '@/components/CapacitorInit';
import { OfflineOverlay } from '@/components/OfflineOverlay';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ball Knowledge',
  description: 'Pure sports data, no noise',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ball Knowledge',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2eb' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f0a' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts - using link instead of @import for non-blocking render */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Playfair+Display:wght@400;500;600&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="Ball Knowledge" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ball Knowledge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#4a5d3a" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="">
        {/* Aurora orbs - colored blobs that drift behind glass for depth */}
        <div className="aurora-container" aria-hidden="true">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
        </div>
        <ThemeProvider>
          <CapacitorInit />
          <OfflineOverlay />
          <ErrorBoundary>
            <main className="page-enter" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>{children}</main>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
