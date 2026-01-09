/**
 * LocalStorage Repository Tests
 * 
 * Unit tests for the LocalStorageRepository implementation.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { LocalStorageRepository } from '@/lib/repositories/localStorage.repository';
import { CalendarNote } from '@/types';

describe('LocalStorageRepository', () => {
  let repo: LocalStorageRepository<CalendarNote>;
  const testUserId = 'test-user';

  /**
   * Setup: Create fresh repository before each test
   * Clear localStorage to ensure clean state
   */
  beforeEach(() => {
    repo = new LocalStorageRepository<CalendarNote>('notes');
    localStorage.clear();
  });

  /**
   * Cleanup: Clear localStorage after each test
   */
  afterEach(() => {
    localStorage.clear();
  });

  describe('create', () => {
    test('creates a new note with generated id and timestamps', async () => {
      const noteData = {
        date: '2026-01-08',
        notes: 'Test note',
      };

      const created = await repo.create(noteData, testUserId);

      expect(created.id).toBeDefined();
      expect(created.user_id).toBe(testUserId);
      expect(created.date).toBe('2026-01-08');
      expect(created.notes).toBe('Test note');
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    test('stores note in localStorage with correct key', async () => {
      const noteData = {
        date: '2026-01-08',
        notes: 'Test note',
      };

      const created = await repo.create(noteData, testUserId);
      const key = `calendar_notes_${testUserId}_${created.id}`;
      const stored = localStorage.getItem(key);

      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(created);
    });
  });

  describe('getAll', () => {
    test('returns empty array when no notes exist', async () => {
      const notes = await repo.getAll(testUserId);
      expect(notes).toEqual([]);
    });

    test('returns all notes for a user', async () => {
      await repo.create({ date: '2026-01-08', notes: 'Note 1' }, testUserId);
      await repo.create({ date: '2026-01-09', notes: 'Note 2' }, testUserId);

      const notes = await repo.getAll(testUserId);
      expect(notes).toHaveLength(2);
    });

    test('only returns notes for specified user', async () => {
      await repo.create({ date: '2026-01-08', notes: 'User 1' }, 'user1');
      await repo.create({ date: '2026-01-08', notes: 'User 2' }, 'user2');

      const user1Notes = await repo.getAll('user1');
      const user2Notes = await repo.getAll('user2');

      expect(user1Notes).toHaveLength(1);
      expect(user2Notes).toHaveLength(1);
      expect(user1Notes[0].notes).toBe('User 1');
      expect(user2Notes[0].notes).toBe('User 2');
    });
  });

  describe('getById', () => {
    test('returns note by id', async () => {
      const created = await repo.create({ date: '2026-01-08', notes: 'Test' }, testUserId);
      const found = await repo.getById(created.id, testUserId);

      expect(found).toEqual(created);
    });

    test('returns null for non-existent id', async () => {
      const found = await repo.getById('nonexistent', testUserId);
      expect(found).toBeNull();
    });

    test('returns null for wrong user', async () => {
      const created = await repo.create({ date: '2026-01-08', notes: 'Test' }, 'user1');
      const found = await repo.getById(created.id, 'user2');

      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    test('updates note fields', async () => {
      const created = await repo.create({ date: '2026-01-08', notes: 'Original' }, testUserId);
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = await repo.update(created.id, { notes: 'Updated' }, testUserId);

      expect(updated.notes).toBe('Updated');
      expect(updated.date).toBe('2026-01-08');
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    test('throws error for non-existent note', async () => {
      await expect(
        repo.update('nonexistent', { notes: 'Updated' }, testUserId)
      ).rejects.toThrow();
    });

    test('preserves system fields', async () => {
      const created = await repo.create({ date: '2026-01-08', notes: 'Test' }, testUserId);
      
      const updated = await repo.update(
        created.id,
        { notes: 'Updated', id: 'should-not-change', user_id: 'should-not-change' } as unknown as Partial<CalendarNote>,
        testUserId
      );

      expect(updated.id).toBe(created.id);
      expect(updated.user_id).toBe(testUserId);
      expect(updated.created_at).toBe(created.created_at);
    });
  });

  describe('delete', () => {
    test('deletes existing note', async () => {
      const created = await repo.create({ date: '2026-01-08', notes: 'Test' }, testUserId);
      
      const deleted = await repo.delete(created.id, testUserId);
      expect(deleted).toBe(true);

      const found = await repo.getById(created.id, testUserId);
      expect(found).toBeNull();
    });

    test('returns false for non-existent note', async () => {
      const deleted = await repo.delete('nonexistent', testUserId);
      expect(deleted).toBe(false);
    });
  });

  describe('findBy', () => {
    beforeEach(async () => {
      await repo.create({ date: '2026-01-08', notes: 'Note 1', category: 'work' }, testUserId);
      await repo.create({ date: '2026-01-08', notes: 'Note 2', category: 'personal' }, testUserId);
      await repo.create({ date: '2026-01-09', notes: 'Note 3', category: 'work' }, testUserId);
    });

    test('finds notes by single criteria', async () => {
      const workNotes = await repo.findBy({ category: 'work' }, testUserId);
      expect(workNotes).toHaveLength(2);
    });

    test('finds notes by multiple criteria', async () => {
      const results = await repo.findBy({ date: '2026-01-08', category: 'work' }, testUserId);
      expect(results).toHaveLength(1);
      expect(results[0].notes).toBe('Note 1');
    });

    test('returns empty array when no matches', async () => {
      const results = await repo.findBy({ category: 'nonexistent' }, testUserId);
      expect(results).toEqual([]);
    });
  });
});
