/**
 * Supabase Client
 * 
 * Creates and exports Supabase client instances for browser and server.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-09
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase URL from environment
 * 
 * @returns Supabase project URL or undefined if not configured
 */
function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

/**
 * Get Supabase anon key (public, safe for client)
 * 
 * @returns Supabase anonymous key or undefined if not configured
 */
function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * Get Supabase service role key (secret, server only)
 * 
 * @returns Supabase service role key or undefined if not configured
 */
function getSupabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/**
 * Check if Supabase is configured
 * 
 * @returns true if both URL and anon key are set
 */
export function isSupabaseConfigured(): boolean {
  return !!(getSupabaseUrl() && getSupabaseAnonKey());
}

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get Supabase client for browser and server-side rendering
 * 
 * Uses anonymous key - respects Row Level Security policies.
 * User must be authenticated for database access.
 * 
 * @throws Error if Supabase is not configured
 */
export function getSupabaseClient(): SupabaseClient {
  // Return cached instance if available in browser
  if (typeof window !== 'undefined' && _supabase) {
    return _supabase;
  }

  const url = getSupabaseUrl()?.trim();
  const key = getSupabaseAnonKey()?.trim();
  
  if (!url || !key) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
  
  const client = createClient(url, key, {
    auth: {
      persistSession: false // Critical for Server Components/API Routes
    }
  });

  // Cache instance in browser environment
  if (typeof window !== 'undefined') {
    _supabase = client;
  }

  return client;
}

/**
 * Get Supabase admin client for server-side operations
 * 
 * Uses service role key - bypasses Row Level Security.
 * ONLY use in API routes, NEVER expose to client.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = getSupabaseUrl()?.trim();
  const key = getSupabaseServiceKey()?.trim();
  
  if (!url || !key) {
    throw new Error('Supabase admin is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  return createClient(url, key, {
    auth: {
      persistSession: false
    }
  });
}

/**
 * Supabase client instance
 * 
 * Note: checks process.env on every access to ensure fresh values
 */
export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
  rpc: (fn: string, args: any) => getSupabaseClient().rpc(fn, args),
  auth: {
    // Basic auth proxy
    getUser: () => getSupabaseClient().auth.getUser(),
    getSession: () => getSupabaseClient().auth.getSession(),
    updateUser: (attrs: any) => getSupabaseClient().auth.updateUser(attrs),
    signInWithPassword: (creds: any) => getSupabaseClient().auth.signInWithPassword(creds),
    resetPasswordForEmail: (email: string, options?: any) => getSupabaseClient().auth.resetPasswordForEmail(email, options),
    signOut: () => getSupabaseClient().auth.signOut(),
    onAuthStateChange: (cb: any) => getSupabaseClient().auth.onAuthStateChange(cb),
  }
} as any; // Cast as any to allow usage interchangably with full client

export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
  auth: {
    admin: {
      deleteUser: (id: string) => getSupabaseAdmin().auth.admin.deleteUser(id)
    }
  }
} as any;
