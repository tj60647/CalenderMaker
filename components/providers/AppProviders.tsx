/**
 * Application Providers
 * 
 * Collects all client-side context providers in one place.
 * This allows the RootLayout to remain a Server Component.
 * 
 * Includes:
 * - AppRouterCacheProvider (MUI Next.js integration)
 * - ThemeProvider (MUI theme)
 * - SessionProvider (NextAuth session)
 * - CssBaseline (MUI global styles)
 */

'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { theme } from '@/theme/theme';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <SessionProvider>
          <CssBaseline />
          {children}
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
