/**
 * LocalStorage Repository Implementation
 * 
 * Implements the IRepository interface using browser localStorage.
 * This is our Phase 1 storage solution. The API exactly matches
 * what Supabase will use, so migration = changing ONE line in index.ts.
 * 
 * Storage Strategy:
 * - Keys: `calendar_{entityType}_{userId}_{id}`
 * - Values: JSON stringified entities
 * - Example: `calendar_notes_user123_abc-def-ghi`
 * 
 * Multi-user Support:
 * Even though we only have one user now (simple auth), we include
 * userId in all operations so Supabase migration is painless.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { v4 as uuidv4 } from 'uuid';
import { IRepository } from './base.repository';

/**
 * Generic localStorage-based repository
 * 
 * This class handles all CRUD operations for a specific entity type
 * using browser localStorage. It's designed to mirror Supabase's API.
 * 
 * @template T - The entity type (must have id, user_id, created_at, updated_at)
 */
export class LocalStorageRepository<T extends { 
  id: string; 
  user_id: string; 
  created_at: string; 
  updated_at: string 
}> implements IRepository<T> {
  private keyPrefix: string;

  /**
   * Create a new localStorage repository
   * 
   * @param entityType - Name of the entity (e.g., "notes", "events")
   *                     Used to namespace localStorage keys
   */
  constructor(entityType: string) {
    // Keys will look like: calendar_notes_user123_abc-def
    this.keyPrefix = `calendar_${entityType}`;
  }

  /**
   * Build a localStorage key for a specific entity
   * 
   * Format: calendar_{entityType}_{userId}_{id}
   * This makes it easy to:
   * - Filter by user (all keys with userId)
   * - Find specific entities (exact key match)
   * - Clear user data (remove all keys with userId)
   * 
   * @param userId - User who owns the entity
   * @param id - Unique entity identifier
   * @returns Full localStorage key
   */
  private getKey(userId: string, id: string): string {
    return `${this.keyPrefix}_${userId}_${id}`;
  }

  /**
   * Extract entity ID from a localStorage key
   * 
   * Given: "calendar_notes_user123_abc-def-ghi"
   * Returns: "abc-def-ghi"
   * 
   * @param key - Full localStorage key
   * @returns Entity ID or empty string if invalid
   */
  private extractIdFromKey(key: string): string {
    // Split by underscore, last part is the ID
    const parts = key.split('_');
    return parts[parts.length - 1] || '';
  }

  /**
   * Check if a localStorage key belongs to a specific user
   * 
   * This is how we implement multi-user support in localStorage.
   * In Supabase, this becomes: WHERE user_id = userId
   * 
   * @param key - localStorage key to check
   * @param userId - User ID to match
   * @returns true if key belongs to user
   */
  private keyMatchesUser(key: string, userId: string): boolean {
    // Key format: calendar_notes_userId_id
    // Check if userId appears in the correct position
    return key.startsWith(`${this.keyPrefix}_${userId}_`);
  }

  /**
   * Get all entities for a user
   * 
   * Process:
   * 1. Loop through ALL localStorage keys
   * 2. Filter to keys matching this entityType AND userId
   * 3. Parse JSON for each matching key
   * 4. Return array of entities
   * 
   * In Supabase: SELECT * FROM table WHERE user_id = userId
   * 
   * @param userId - ID of user whose entities to retrieve
   * @returns Array of all entities for this user
   */
  async getAll(userId: string): Promise<T[]> {
    const entities: T[] = [];

    // Loop through all localStorage keys
    // localStorage has no .keys() method, so we use a for loop with key()
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Skip if key is null or doesn't match our pattern
      if (!key || !this.keyMatchesUser(key, userId)) {
        continue;
      }

      // Parse the stored JSON
      try {
        const item = localStorage.getItem(key);
        if (item) {
          entities.push(JSON.parse(item) as T);
        }
      } catch (error) {
        // If JSON parse fails, skip this item
        // In production, you might want to log this
        console.error(`Failed to parse entity from key ${key}:`, error);
      }
    }

    return entities;
  }

  /**
   * Get a single entity by ID
   * 
   * Process:
   * 1. Build the exact localStorage key
   * 2. Attempt to retrieve and parse
   * 3. Return entity or null if not found
   * 
   * In Supabase: SELECT * FROM table WHERE id = id AND user_id = userId LIMIT 1
   * 
   * @param id - Unique entity identifier
   * @param userId - ID of user who owns the entity
   * @returns Entity if found, null otherwise
   */
  async getById(id: string, userId: string): Promise<T | null> {
    const key = this.getKey(userId, id);
    const item = localStorage.getItem(key);

    if (!item) {
      return null;
    }

    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Failed to parse entity ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new entity
   * 
   * Process:
   * 1. Generate unique ID (UUID v4)
   * 2. Add timestamps (created_at, updated_at)
   * 3. Add user_id field
   * 4. Save to localStorage
   * 5. Return complete entity
   * 
   * In Supabase: INSERT INTO table VALUES (...) RETURNING *
   * Note: Supabase auto-generates id and timestamps via DEFAULT
   * 
   * @param entity - Entity data without id/user_id/timestamps
   * @param userId - ID of user who owns the entity
   * @returns Complete entity with generated fields
   */
  async create(entity: Omit<T, 'id' | 'user_id' | 'created_at' | 'updated_at'>, userId: string): Promise<T> {
    // Generate unique ID using uuid library
    const id = uuidv4();
    
    // Create ISO timestamp strings
    const now = new Date().toISOString();

    // Build complete entity with all required fields
    const newEntity = {
      ...entity,
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
    } as T;

    // Save to localStorage
    const key = this.getKey(userId, id);
    localStorage.setItem(key, JSON.stringify(newEntity));

    return newEntity;
  }

  /**
   * Update an existing entity
   * 
   * Process:
   * 1. Retrieve existing entity
   * 2. Merge with updates
   * 3. Update updated_at timestamp
   * 4. Save back to localStorage
   * 5. Return updated entity
   * 
   * In Supabase: UPDATE table SET ... WHERE id = id AND user_id = userId RETURNING *
   * 
   * @param id - ID of entity to update
   * @param updates - Partial entity with fields to change
   * @param userId - ID of user who owns the entity
   * @returns Updated entity
   * @throws {Error} If entity not found
   */
  async update(id: string, updates: Partial<T>, userId: string): Promise<T> {
    // Get existing entity
    const existing = await this.getById(id, userId);

    if (!existing) {
      throw new Error(`Entity ${id} not found for user ${userId}`);
    }

    // Merge updates with existing data
    // Prevent overwriting system fields
    const updated = {
      ...existing,
      ...updates,
      id, // Can't change ID
      user_id: userId, // Can't change ownership
      created_at: existing.created_at, // Can't change creation time
      updated_at: new Date().toISOString(), // Always update this
    } as T;

    // Save updated entity
    const key = this.getKey(userId, id);
    localStorage.setItem(key, JSON.stringify(updated));

    return updated;
  }

  /**
   * Delete an entity
   * 
   * Process:
   * 1. Build localStorage key
   * 2. Check if entity exists
   * 3. Remove from localStorage if found
   * 4. Return success/failure
   * 
   * In Supabase: DELETE FROM table WHERE id = id AND user_id = userId
   * 
   * @param id - ID of entity to delete
   * @param userId - ID of user who owns the entity
   * @returns true if deleted, false if not found
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const key = this.getKey(userId, id);
    
    // Check if it exists first
    const exists = localStorage.getItem(key) !== null;

    if (exists) {
      localStorage.removeItem(key);
      return true;
    }

    return false;
  }

  /**
   * Find entities matching criteria
   * 
   * This is a simple in-memory filter. For each field in criteria,
   * we check if the entity's value matches.
   * 
   * Process:
   * 1. Get all entities for user
   * 2. Filter by checking each criteria field
   * 3. Return matching entities
   * 
   * In Supabase: SELECT * FROM table WHERE field1 = val1 AND field2 = val2 AND user_id = userId
   * 
   * @param criteria - Object with field/value pairs to match
   * @param userId - ID of user who owns the entities
   * @returns Array of matching entities
   */
  async findBy(criteria: Partial<T>, userId: string): Promise<T[]> {
    // Start with all entities for this user
    const allEntities = await this.getAll(userId);

    // Filter to those matching ALL criteria
    return allEntities.filter(entity => {
      // Check each criteria field
      for (const [key, value] of Object.entries(criteria)) {
        // If entity's value doesn't match, exclude it
        if (entity[key as keyof T] !== value) {
          return false;
        }
      }
      // All criteria matched
      return true;
    });
  }

  /**
   * Get entities within a date range
   * 
   * Used by AI tools to check what's scheduled in a date range.
   * Filters entities with 'date' field between startDate and endDate (inclusive).
   * 
   * Process:
   * 1. Get all entities for user
   * 2. Filter to those with date >= startDate AND date <= endDate
   * 3. Return matching entities
   * 
   * In Supabase: SELECT * FROM table 
   *              WHERE date >= startDate AND date <= endDate AND user_id = userId
   * 
   * @param startDate - Start of range (inclusive, ISO: YYYY-MM-DD)
   * @param endDate - End of range (inclusive, ISO: YYYY-MM-DD)
   * @param userId - ID of user who owns the entities
   * @returns Array of entities in the date range
   */
  async getByDateRange(startDate: string, endDate: string, userId: string): Promise<T[]> {
    const allEntities = await this.getAll(userId);

    // Filter entities with date field in range
    return allEntities.filter(entity => {
      // Check if entity has a date field
      const entityDate = (entity as Record<string, unknown>).date as string | undefined;
      
      if (!entityDate) {
        return false;
      }

      // Compare date strings (ISO format compares correctly as strings)
      return entityDate >= startDate && entityDate <= endDate;
    });
  }

  /**
   * Search entities by keyword
   * 
   * Used by AI tools to find notes containing specific text.
   * Searches all string fields (case-insensitive).
   * 
   * Process:
   * 1. Get all entities for user
   * 2. For each entity, check all string fields
   * 3. If any field contains keyword (case-insensitive), include entity
   * 4. Return matching entities
   * 
   * In Supabase: SELECT * FROM table 
   *              WHERE (notes ILIKE '%keyword%' OR category ILIKE '%keyword%' OR ...)
   *              AND user_id = userId
   * 
   * @param keyword - Text to search for (case-insensitive)
   * @param userId - ID of user who owns the entities
   * @returns Array of entities containing the keyword
   */
  async search(keyword: string, userId: string): Promise<T[]> {
    const allEntities = await this.getAll(userId);
    const lowerKeyword = keyword.toLowerCase();

    // Filter entities where ANY string field contains the keyword
    return allEntities.filter(entity => {
      // Check each field in the entity
      for (const value of Object.values(entity)) {
        // Only search string fields
        if (typeof value === 'string') {
          if (value.toLowerCase().includes(lowerKeyword)) {
            return true; // Found match, include this entity
          }
        }
      }
      return false; // No match found
    });
  }
}

