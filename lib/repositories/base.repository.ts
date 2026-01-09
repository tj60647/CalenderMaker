/**
 * Base Repository Interface
 * 
 * Defines the contract for all data storage operations.
 * This interface is designed to match Supabase's API exactly, making
 * the migration from localStorage to Supabase trivial (change ONE line).
 * 
 * All methods include userId to support multi-user when we switch to Supabase.
 * For localStorage implementation, userId is used as a prefix for keys.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { CalendarNote } from '@/types';

/**
 * Generic repository interface for CRUD operations
 * 
 * This matches Supabase's API pattern so migration only requires
 * changing the implementation, not the calling code.
 * 
 * @template T - The entity type this repository manages
 */
export interface IRepository<T> {
  /**
   * Retrieve all entities for a specific user
   * 
   * In localStorage: Filter by userId prefix
   * In Supabase: WHERE user_id = userId
   * 
   * @param userId - ID of the user who owns the entities
   * @returns Array of all entities for this user
   */
  getAll(userId: string): Promise<T[]>;

  /**
   * Get a single entity by its ID
   * 
   * In localStorage: Check userId prefix AND match ID
   * In Supabase: WHERE id = id AND user_id = userId
   * 
   * @param id - Unique identifier of the entity
   * @param userId - ID of the user who owns the entity
   * @returns The entity if found, null otherwise
   */
  getById(id: string, userId: string): Promise<T | null>;

  /**
   * Create a new entity
   * 
   * Automatically generates:
   * - Unique ID (UUID v4)
   * - user_id (from userId parameter)
   * - created_at timestamp (ISO string)
   * - updated_at timestamp (ISO string)
   * 
   * In localStorage: Save with userId prefix
   * In Supabase: INSERT with user_id column
   * 
   * @param entity - The entity to create (without id/user_id/timestamps)
   * @param userId - ID of the user who owns the entity
   * @returns The created entity with generated fields
   */
  create(entity: Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<T>;

  /**
   * Update an existing entity
   * 
   * Automatically updates:
   * - updated_at timestamp (new ISO string)
   * 
   * In localStorage: Verify userId prefix, then update
   * In Supabase: UPDATE WHERE id = id AND user_id = userId
   * 
   * @param id - Unique identifier of the entity to update
   * @param updates - Partial entity with fields to update
   * @param userId - ID of the user who owns the entity
   * @returns The updated entity
   * @throws {Error} If entity not found or user doesn't own it
   */
  update(id: string, updates: Partial<T>, userId: string): Promise<T>;

  /**
   * Delete an entity
   * 
   * In localStorage: Remove key after verifying userId prefix
   * In Supabase: DELETE WHERE id = id AND user_id = userId
   * 
   * @param id - Unique identifier of the entity to delete
   * @param userId - ID of the user who owns the entity
   * @returns true if deleted, false if not found
   */
  delete(id: string, userId: string): Promise<boolean>;

  /**
   * Find entities matching specific criteria
   * 
   * This is a flexible query method for filtering entities.
   * In localStorage: Filter array in memory
   * In Supabase: Build WHERE clause dynamically
   * 
   * @param criteria - Object with field/value pairs to match
   * @param userId - ID of the user who owns the entities
   * @returns Array of matching entities
   */
  findBy(criteria: Partial<T>, userId: string): Promise<T[]>;

  /**
   * Get entities within a date range
   * 
   * Used by AI tools to check calendar availability.
   * Assumes entity has a 'date' field (ISO string YYYY-MM-DD).
   * 
   * In localStorage: Filter array in memory
   * In Supabase: WHERE date >= start AND date <= end
   * 
   * @param startDate - Start of range (inclusive, ISO: YYYY-MM-DD)
   * @param endDate - End of range (inclusive, ISO: YYYY-MM-DD)
   * @param userId - ID of the user who owns the entities
   * @returns Array of entities in the date range
   */
  getByDateRange(startDate: string, endDate: string, userId: string): Promise<T[]>;

  /**
   * Search entities by keyword
   * 
   * Used by AI tools to find notes containing specific text.
   * Searches all string fields (case-insensitive).
   * 
   * In localStorage: Filter array in memory, check all string fields
   * In Supabase: Use ILIKE or full-text search
   * 
   * @param keyword - Text to search for (case-insensitive)
   * @param userId - ID of the user who owns the entities
   * @returns Array of entities containing the keyword
   */
  search(keyword: string, userId: string): Promise<T[]>;
}

/**
 * Type-specific repository for CalendarNote entities
 * 
 * This ensures type safety when working with calendar notes.
 * When adding more entity types (e.g., events, todos), create
 * similar type aliases for those repositories.
 */
export type INotesRepository = IRepository<CalendarNote>;
