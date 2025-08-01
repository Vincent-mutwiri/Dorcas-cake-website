// components/common/Providers.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>{children}</Provider>
    </SessionProvider>
  );
}