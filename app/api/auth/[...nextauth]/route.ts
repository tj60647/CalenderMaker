/**
 * NextAuth API Route Handler
 * 
 * This is the catch-all API route for NextAuth.
 * It handles all auth endpoints:
 * - /api/auth/signin
 * - /api/auth/signout  
 * - /api/auth/session
 * - /api/auth/callback/*
 * - /api/auth/csrf
 * 
 * The [...nextauth] folder name is special Next.js syntax
 * that creates a catch-all route matching /api/auth/*.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

/**
 * Create NextAuth handler with our configuration
 * 
 * This creates both GET and POST handlers for the auth endpoints.
 * NextAuth automatically handles all the OAuth flows, sessions, etc.
 */
const handler = NextAuth(authOptions);

/**
 * Export handlers for App Router
 * 
 * Next.js App Router requires separate exports for each HTTP method.
 * NextAuth provides a handler that works for both GET and POST.
 */
export { handler as GET, handler as POST };
