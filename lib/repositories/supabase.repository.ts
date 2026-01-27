/**
 * Supabase Repository Implementation
 * 
 * Implements IRepository interface using Supabase PostgreSQL backend.
 * This replaces LocalStorageRepository with real database persistence.
 * 
 * Features:
 * - Row Level Security enforced
 * - Automatic timestamps
 * - Type-safe queries
 * - Error handling
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-09
 */

import { supabase } from '@/lib/supabase/client';
import { IRepository, INotesRepository } from './base.repository';
import { CalendarNote } from '@/types';

/**
 * Repository implementation using Supabase
 * 
 * This is a drop-in replacement for LocalStorageRepository.
 * Same interface, different backend - that's the power of
 * the repository pattern!
 * 
 * @template T - Entity type (must have id and user_id fields)
 */
export class SupabaseRepository<T extends { id: string; user_id: string }> implements IRepository<T> {
  private tableName: string;

  /**
   * Create a new Supabase repository
   * 
   * @param tableName - Name of Supabase table (e.g., "calendar_notes")
   */
  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get all items for a user
   * 
   * Uses Row Level Security - only returns items owned by user.
   * 
   * @param userId - User ID to filter by
   * @returns Array of items owned by user
   */
  async getAll(userId: string): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[SupabaseRepository] Failed to get all from ${this.tableName}:`, error);
        throw new Error(`Failed to retrieve data: ${error.message}`);
      }

      return (data || []) as T[];
    } catch (error) {
      console.error(`[SupabaseRepository] getAll error:`, error);
      throw error;
    }
  }

  /**
   * Get a single item by ID
   * 
   * @param id - Item ID
   * @param userId - User ID (for RLS)
   * @returns Item if found, null otherwise
   */
  async getById(id: string, userId: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - not an error
          return null;
        }
        console.error(`[SupabaseRepository] Failed to get by ID:`, error);
        throw new Error(`Failed to retrieve item: ${error.message}`);
      }

      return data as T;
    } catch (error) {
      console.error(`[SupabaseRepository] getById error:`, error);
      throw error;
    }
  }

  /**
   * Create a new item
   * 
   * Automatically sets:
   * - id (UUID)
   * - user_id
   * - created_at
   * - updated_at
   * 
   * @param data - Item data (without id/timestamps)
   * @param userId - Owner user ID
   * @returns Created item with generated fields
   */
  async create(data: Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<T> {
    try {
      const itemWithUser = {
        ...data,
        user_id: userId,
      };

      const { data: created, error } = await supabase
        .from(this.tableName)
        .insert(itemWithUser)
        .select()
        .single();

      if (error) {
        console.error(`[SupabaseRepository] Failed to create:`, error);
        throw new Error(`Failed to create item: ${error.message}`);
      }

      return created as T;
    } catch (error) {
      console.error(`[SupabaseRepository] create error:`, error);
      throw error;
    }
  }

  /**
   * Update an existing item
   * 
   * Only updates provided fields (partial update).
   * Automatically updates updated_at timestamp.
   * 
   * @param id - Item ID to update
   * @param updates - Fields to update
   * @param userId - User ID (for RLS)
   * @returns Updated item
   */
  async update(id: string, updates: Partial<T>, userId: string): Promise<T> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error(`[SupabaseRepository] Failed to update:`, error);
        throw new Error(`Failed to update item: ${error.message}`);
      }

      if (!data) {
        throw new Error('Item not found or access denied');
      }

      return data as T;
    } catch (error) {
      console.error(`[SupabaseRepository] update error:`, error);
      throw error;
    }
  }

  /**
   * Delete an item
   * 
   * @param id - Item ID to delete
   * @param userId - User ID (for RLS)
   * @returns true if deleted, false if not found
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const { error, count } = await supabase
        .from(this.tableName)
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error(`[SupabaseRepository] Failed to delete:`, error);
        throw new Error(`Failed to delete item: ${error.message}`);
      }

      return (count ?? 0) > 0;
    } catch (error) {
      console.error(`[SupabaseRepository] delete error:`, error);
      throw error;
    }
  }

  /**
   * Find items matching specific criteria
   * 
   * Dynamically builds WHERE clause based on provided criteria.
   * All conditions are ANDed together.
   * 
   * @param criteria - Object with field/value pairs to match
   * @param userId - User ID (for RLS)
   * @returns Array of matching items
   */
  async findBy(criteria: Partial<T>, userId: string): Promise<T[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId);

      // Add each criteria as an equality condition
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[SupabaseRepository] Failed to find by criteria:`, error);
        throw new Error(`Failed to find items: ${error.message}`);
      }

      return (data || []) as T[];
    } catch (error) {
      console.error(`[SupabaseRepository] findBy error:`, error);
      throw error;
    }
  }

  /**
   * Get items within a date range
   * 
   * Assumes the entity has a 'date' field with ISO format (YYYY-MM-DD).
   * 
   * @param startDate - Start date (inclusive, ISO: YYYY-MM-DD)
   * @param endDate - End date (inclusive, ISO: YYYY-MM-DD)
   * @param userId - User ID (for RLS)
   * @returns Array of items in the date range
   */
  async getByDateRange(startDate: string, endDate: string, userId: string): Promise<T[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error(`[SupabaseRepository] Failed to get by date range:`, error);
        throw new Error(`Failed to retrieve items: ${error.message}`);
      }

      return (data || []) as T[];
    } catch (error) {
      console.error(`[SupabaseRepository] getByDateRange error:`, error);
      throw error;
    }
  }

  /**
   * Search items by keyword
   * 
   * Searches all text fields using case-insensitive pattern matching.
   * For CalendarNote: searches 'notes', 'category' fields.
   * 
   * @param keyword - Text to search for (case-insensitive)
   * @param userId - User ID (for RLS)
   * @returns Array of items containing the keyword
   */
  async search(keyword: string, userId: string): Promise<T[]> {
    try {
      // Use ILIKE for case-insensitive search on notes field
      // For generic implementation, we search the most likely text field
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .or(`notes.ilike.%${keyword}%,category.ilike.%${keyword}%`);

      if (error) {
        console.error(`[SupabaseRepository] Failed to search:`, error);
        throw new Error(`Failed to search items: ${error.message}`);
      }

      return (data || []) as T[];
    } catch (error) {
      console.error(`[SupabaseRepository] search error:`, error);
      throw error;
    }
  }
}

/**
 * Convenience function to create a calendar notes repository
 * 
 * @returns SupabaseRepository configured for calendar_notes table
 */
export function createNotesRepository(): INotesRepository {
  return new SupabaseRepository<CalendarNote>('calendar_notes');
}
