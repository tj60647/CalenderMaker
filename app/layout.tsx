/**
 * Root Layout
 * 
 * Main layout component that wraps the entire application. Provides
 * Material-UI theme, session context, and global styles.
 * 
 * This must be a Client Component because:
 * - SessionProvider requires React Context
 * - AppRouterCacheProvider manages client-side cache
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from '@/components/providers/SessionProvider';
import "./globals.css";

/**
 * Root layout component
 * 
 * Sets up the Material-UI theme provider and global CSS baseline.
 * All pages in the app will be wrapped in this layout.
 * 
 * Note: We lose static metadata when using 'use client', but that's
 * acceptable for this app. For SEO-critical apps, you'd use a hybrid
 * approach with separate server/client layout layers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>AI Calendar Generator</title>
        <meta name="description" content="Create beautiful calendars with AI conversation" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body>
        <AppRouterCacheProvider>
          <SessionProvider>
            <CssBaseline />
            {children}
          </SessionProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
