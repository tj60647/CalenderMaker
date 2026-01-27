/**
 * Repository Factory and Exports
 * 
 * This is the ONLY file you import from when using repositories.
 * It provides ready-to-use repository instances for all entity types.
 * 
 * MIGRATION COMPLETE: Now using Supabase! 🎉
 * All app code continues working unchanged - that's the power
 * of the repository pattern.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 * @updated 2026-01-09 - Migrated to Supabase
 */

import { CalendarNote } from '@/types';
import { LocalStorageRepository } from './localStorage.repository';
import { SupabaseRepository } from './supabase.repository';
import { INotesRepository } from './base.repository';

/**
 * Determine which repository to use based on environment
 * 
 * - If Supabase credentials are configured: Use Supabase
 * - Otherwise: Fall back to localStorage (development mode)
 * 
 * This allows gradual migration and local development without Supabase.
 */
function createRepository(): INotesRepository {
  const hasSupabase = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (hasSupabase) {
    console.log('[Repository] Using Supabase backend');
    return new SupabaseRepository<CalendarNote>('calendar_notes');
  } else {
    console.warn('[Repository] Supabase not configured, falling back to localStorage');
    console.warn('[Repository] Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase');
    return new LocalStorageRepository<CalendarNote>('notes');
  }
}

/**
 * Calendar notes repository
 * 
 * Use this throughout the app for all note operations:
 * - notesRepo.getAll(userId)
 * - notesRepo.create(note, userId)
 * - notesRepo.update(id, updates, userId)
 * - notesRepo.delete(id, userId)
 * 
 * NOW USING SUPABASE! 🎉
 * Falls back to localStorage if Supabase not configured.
 */
export const notesRepo: INotesRepository = createRepository();

/**
 * Add more repositories here as needed
 * 
 * Examples for future expansion:
 * export const eventsRepo = new LocalStorageRepository<CalendarEvent>('events');
 * export const todosRepo = new LocalStorageRepository<Todo>('todos');
 * export const settingsRepo = new LocalStorageRepository<UserSettings>('settings');
 */
