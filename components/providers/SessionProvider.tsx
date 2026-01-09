/**
 * Session Provider Component
 * 
 * Wraps the app with NextAuth's SessionProvider.
 * This makes authentication state available throughout the app
 * via the useSession() hook.
 * 
 * Must be a Client Component because it uses React Context.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

/**
 * Props for SessionProvider
 */
interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Wrap children with NextAuth session provider
 * 
 * This makes useSession() hook work in any child component.
 * Place this in the root layout to make auth available everywhere.
 * 
 * @param props - Component props
 * @returns Wrapped children with session context
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      {children}
    </NextAuthSessionProvider>
  );
}
