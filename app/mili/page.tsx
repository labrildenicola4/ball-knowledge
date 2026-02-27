'use client';

import { useTheme } from '@/lib/theme';
// @mili package is external — stub until available
const MiliChat = ({ theme, darkMode }: any) => null;

export default function MiliPage() {
  const { theme, darkMode } = useTheme();

  return (
    <div
      style={{
        height: 'calc(100vh - 80px - env(safe-area-inset-bottom, 0px))',
        marginTop: '-16px',
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
