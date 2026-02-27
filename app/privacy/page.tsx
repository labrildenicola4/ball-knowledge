'use client';

import { useTheme } from '@/lib/theme';
import { ChevronLeft } from 'lucide-react';
import { useSafeBack } from '@/lib/use-safe-back';

export default function PrivacyPolicyPage() {
  const goBack = useSafeBack('/');
  const { theme, darkMode } = useTheme();

  return (
    <div style={{ minHeight: '100vh', padding: '0 16px 32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 0',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))'
      }}>
        <button onClick={goBack} className="tap-highlight flex h-9 w-9 items-center justify-center rounded-full"
          style={{ border: `1px solid ${darkMode ? 'rgba(120, 160, 100, 0.07)' : theme.border}` }}>
          <ChevronLeft size={18} style={{ color: theme.text }} />
        </button>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 24,
          fontWeight: 600,
          color: theme.text
        }}>
          Privacy Policy
        </h1>
      </div>

      <div className={darkMode ? 'glass-card' : ''} style={{
        padding: 20,
        borderRadius: 16,
        ...(!darkMode ? { backgroundColor: theme.bgTertiary, border: `1px solid ${theme.border}` } : {}),
      }}>
        <div style={{ color: theme.textSecondary, fontFamily: "'Cormorant Garamond', serif", fontSize: 16, lineHeight: 1.7 }}>
          <p style={{ marginBottom: 16, color: theme.textSecondary, fontSize: 14 }}>
            Last updated: February 14, 2025
          </p>

          <Section title="Overview" theme={theme}>
            Ball Knowledge is a sports scores and data aggregation app. We are committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and your rights regarding that information.
          </Section>

          <Section title="Information We Collect" theme={theme}>
            <strong>We do not collect personal information.</strong> Ball Knowledge does not require account creation,
            login, or any form of registration. We do not collect names, email addresses, phone numbers,
            or any other personally identifiable information.
          </Section>

          <Section title="Local Data Storage" theme={theme}>
            Ball Knowledge stores your preferences (such as favorite teams and dark mode settings) locally on your
            device using browser storage. This data never leaves your device and is not transmitted to any server.
          </Section>

          <Section title="Third-Party Services" theme={theme}>
            We use third-party sports data APIs to display scores and statistics. These requests are made from our
            servers, not from your device. We do not share any user data with these providers because we do not
            collect any user data.
          </Section>

          <Section title="Analytics & Tracking" theme={theme}>
            Ball Knowledge does not use any analytics, advertising, or tracking SDKs. We do not track your
            usage patterns, browsing behavior, or any other activity within the app.
          </Section>

          <Section title="Children's Privacy" theme={theme}>
            Ball Knowledge does not collect personal information from anyone, including children under 13.
            The app displays publicly available sports data and is suitable for all ages.
          </Section>

          <Section title="Changes to This Policy" theme={theme}>
            We may update this privacy policy from time to time. Any changes will be reflected on this page
            with an updated revision date.
          </Section>

          <Section title="Contact" theme={theme}>
            If you have questions about this privacy policy, please contact us at{' '}
            <span style={{ color: theme.accent }}>ballknowledge.app@gmail.com</span>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, theme, children }: { title: string; theme: any; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 18,
        fontWeight: 600,
        color: theme.text,
        marginBottom: 8
      }}>
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}
