'use client';

import { useTheme } from '@/lib/theme';
import { MiliChat } from '@mili';

export default function MiliPage() {
  const { theme, darkMode } = useTheme();

  return (
    <div
      style={{
        height: 'calc(100vh - 80px - env(safe-area-inset-bottom, 0px))',
        marginTop: '-16px', // Offset the page padding from layout
      }}
    >
      <MiliChat
        theme={theme}
        darkMode={darkMode}
        apiEndpoint="/api/mili/chat"
        usageEndpoint="/api/mili/usage"
      />
    </div>
  );
}
