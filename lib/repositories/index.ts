/**
 * Repository Factory and Exports
 * 
 * This is the ONLY file you import from when using repositories.
 * It provides ready-to-use repository instances for all entity types.
 * 
 * To migrate from localStorage to Supabase:
 * 1. Create supabase.repository.ts (implementing IRepository)
 * 2. Change ONE line in this file:
 *    OLD: new LocalStorageRepository<CalendarNote>('notes')
 *    NEW: new SupabaseRepository<CalendarNote>('calendar_notes')
 * 3. Done! All app code continues working.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { CalendarNote } from '@/types';
import { LocalStorageRepository } from './localStorage.repository';
import { INotesRepository } from './base.repository';

/**
 * Calendar notes repository
 * 
 * Use this throughout the app for all note operations:
 * - notesRepo.getAll(userId)
 * - notesRepo.create(note, userId)
 * - notesRepo.update(id, updates, userId)
 * - notesRepo.delete(id, userId)
 * 
 * This is currently LocalStorageRepository, but will become
 * SupabaseRepository when we're ready to upgrade.
 * 
 * TO MIGRATE TO SUPABASE:
 * Change this ONE line to use SupabaseRepository instead.
 * That's it. All app code stays the same.
 */
export const notesRepo: INotesRepository = new LocalStorageRepository<CalendarNote>('notes');

/**
 * Add more repositories here as needed
 * 
 * Examples for future expansion:
 * export const eventsRepo = new LocalStorageRepository<CalendarEvent>('events');
 * export const todosRepo = new LocalStorageRepository<Todo>('todos');
 * export const settingsRepo = new LocalStorageRepository<UserSettings>('settings');
 */
