/**
 * NextAuth Type Extensions
 * 
 * Extends NextAuth's default types to include our custom fields.
 * This gives us TypeScript autocomplete for session.user.id
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import 'next-auth';
import 'next-auth/jwt';

/**
 * Extend NextAuth's Session type
 * 
 * Add userId to the session object so we can access it
 * throughout the app with proper TypeScript types.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;      // Our custom userId field
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

/**
 * Extend NextAuth's JWT type
 * 
 * Add userId to the JWT token so it persists between requests.
 */
declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
  }
}
