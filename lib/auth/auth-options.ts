/**
 * NextAuth Configuration
 * 
 * Simple authentication setup that can easily migrate to Supabase.
 * Current: CredentialsProvider with hardcoded demo user
 * Future: Supabase provider with real user database
 * 
 * For now, any login works - we use a single demo user ID.
 * This lets us build the app with proper user separation,
 * then add real auth later without changing app code.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Demo user ID for localStorage phase
 * 
 * In Phase 1, everyone shares this user ID.
 * In Phase 2 (Supabase), this becomes a real user UUID from the database.
 * 
 * Using a consistent ID now means our repository pattern works correctly
 * even before we have real multi-user support.
 */
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'; // Valid UUID for Database Compatibility

/**
 * NextAuth configuration
 * 
 * This tells NextAuth how to handle authentication.
 * Currently using a simple CredentialsProvider that accepts any login.
 * 
 * To migrate to Supabase:
 * 1. Replace CredentialsProvider with custom provider
 * 2. Call Supabase auth API in authorize()
 * 3. Return real user data from Supabase
 * 4. Session callbacks stay the same
 */
export const authOptions: NextAuthOptions = {
  /**
   * Authentication providers
   * 
   * Current: Simple credentials (any username/password works)
   * Future: Add Supabase provider or custom provider calling Supabase
   */
  providers: [
    CredentialsProvider({
      name: 'Demo Login',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'demo' },
        password: { label: 'Password', type: 'password' }
      },
      /**
       * Validate credentials and return user object
       * 
       * Current: Always succeeds, returns demo user
       * Future: Call Supabase auth.signIn(), return real user
       * 
       * @param credentials - Username and password from form
       * @returns User object if valid, null otherwise
       */
      async authorize(credentials) {
        // FOR DEMO: Accept any credentials
        // In production, this would verify against database
        if (credentials?.username) {
          return {
            id: DEMO_USER_ID,
            name: credentials.username,
            email: `${credentials.username}@demo.local`
          };
        }
        return null;
      }
    })
  ],

  /**
   * Session configuration
   * 
   * We use JWT strategy (token stored in browser) rather than
   * database sessions. This works for both localStorage and Supabase.
   */
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * Callbacks to customize behavior
   * 
   * These let us add custom data to the session object
   * that's available on both client and server.
   */
  callbacks: {
    /**
     * Add user ID to JWT token
     * 
     * The token is what's stored in the browser.
     * We add userId so it's available in the session.
     * 
     * @param token - JWT token being created
     * @param user - User object from authorize() (only on signin)
     * @returns Updated token
     */
    async jwt({ token, user }) {
      // On signin, user object is provided
      if (user) {
        token.userId = user.id;
      }
      
      // MIGRATION FIX:
      // If the user has an old session with the string ID "demo-user-local-001",
      // upgrade them to the new UUID format automatically.
      // This prevents "invalid input syntax for type uuid" database errors.
      if (token.userId === 'demo-user-local-001') {
        token.userId = DEMO_USER_ID;
      }
      
      return token;
    },

    /**
     * Add user ID to session object
     * 
     * The session is what's available via useSession() hook.
     * We add userId from the token so app code can use it.
     * 
     * @param session - Session object being created
     * @param token - JWT token with our custom userId
     * @returns Updated session
     */
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    }
  },

  /**
   * Custom pages (optional)
   * 
   * You can customize the signin page, error page, etc.
   * For now, we use NextAuth's default pages.
   */
  pages: {
    signIn: '/auth/signin',  // Custom sign-in page (we'll create this)
  },

  /**
   * Debugging (remove in production)
   */
  debug: process.env.NODE_ENV === 'development',
};
