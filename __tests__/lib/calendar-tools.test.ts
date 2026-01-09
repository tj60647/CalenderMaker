/**
 * Calendar Tools Tests
 * 
 * Tests for AI function calling tools that query the calendar.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { 
  searchCalendar, 
  getWeekNotes, 
  searchByKeyword, 
  getDateNotes 
} from '@/lib/tools/calendar-tools';
import { notesRepo } from '@/lib/repositories';
import { CalendarNote } from '@/types';

// Mock the repository
jest.mock('@/lib/repositories', () => ({
  notesRepo: {
    getByDateRange: jest.fn(),
    search: jest.fn(),
    getAll: jest.fn(),
  },
}));

describe('Calendar Tools', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchCalendar', () => {
    it('should call repository getByDateRange with correct params', async () => {
      const mockNotes: CalendarNote[] = [
        {
          id: '1',
          user_id: mockUserId,
          date: '2026-03-24',
          notes: 'Physics Lab',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      (notesRepo.getByDateRange as jest.Mock).mockResolvedValue(mockNotes);

      const result = await searchCalendar(mockUserId, '2026-03-24', '2026-03-26');

      expect(notesRepo.getByDateRange).toHaveBeenCalledWith('2026-03-24', '2026-03-26', mockUserId);
      expect(result).toEqual(mockNotes);
    });

    it('should return empty array when no notes found', async () => {
      (notesRepo.getByDateRange as jest.Mock).mockResolvedValue([]);

      const result = await searchCalendar(mockUserId, '2026-01-01', '2026-01-02');

      expect(result).toEqual([]);
    });
  });

  describe('getWeekNotes', () => {
    it('should return Sunday-Saturday range for Tuesday', async () => {
      const mockNotes: CalendarNote[] = [
        {
          id: '1',
          user_id: mockUserId,
          date: '2026-03-24',
          notes: 'Physics Lab',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      (notesRepo.getByDateRange as jest.Mock).mockResolvedValue(mockNotes);

      // March 24, 2026 is a Tuesday
      const result = await getWeekNotes(mockUserId, '2026-03-24');

      // Week should be March 22 (Sun) - March 28 (Sat)
      expect(result.start).toBe('2026-03-22');
      expect(result.end).toBe('2026-03-28');
      expect(result.notes).toEqual(mockNotes);
      expect(notesRepo.getByDateRange).toHaveBeenCalledWith('2026-03-22', '2026-03-28', mockUserId);
    });

    it('should return correct range for Sunday', async () => {
      (notesRepo.getByDateRange as jest.Mock).mockResolvedValue([]);

      // March 22, 2026 is a Sunday
      const result = await getWeekNotes(mockUserId, '2026-03-22');

      // Week should be March 22 (Sun) - March 28 (Sat)
      expect(result.start).toBe('2026-03-22');
      expect(result.end).toBe('2026-03-28');
    });

    it('should return correct range for Saturday', async () => {
      (notesRepo.getByDateRange as jest.Mock).mockResolvedValue([]);

      // March 28, 2026 is a Saturday
      const result = await getWeekNotes(mockUserId, '2026-03-28');

      // Week should be March 22 (Sun) - March 28 (Sat)
      expect(result.start).toBe('2026-03-22');
      expect(result.end).toBe('2026-03-28');
    });
  });

  describe('searchByKeyword', () => {
    it('should call repository search with correct params', async () => {
      const mockNotes: CalendarNote[] = [
        {
          id: '1',
          user_id: mockUserId,
          date: '2026-03-24',
          notes: 'Physics Lab',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      (notesRepo.search as jest.Mock).mockResolvedValue(mockNotes);

      const result = await searchByKeyword(mockUserId, 'Physics');

      expect(notesRepo.search).toHaveBeenCalledWith('Physics', mockUserId);
      expect(result).toEqual(mockNotes);
    });

    it('should return empty array when keyword not found', async () => {
      (notesRepo.search as jest.Mock).mockResolvedValue([]);

      const result = await searchByKeyword(mockUserId, 'Nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getDateNotes', () => {
    it('should filter notes for specific date', async () => {
      const mockAllNotes: CalendarNote[] = [
        {
          id: '1',
          user_id: mockUserId,
          date: '2026-03-24',
          notes: 'Physics Lab',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: mockUserId,
          date: '2026-03-25',
          notes: 'Math Class',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '3',
          user_id: mockUserId,
          date: '2026-03-24',
          notes: 'Dentist',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ];

      (notesRepo.getAll as jest.Mock).mockResolvedValue(mockAllNotes);

      const result = await getDateNotes(mockUserId, '2026-03-24');

      expect(notesRepo.getAll).toHaveBeenCalledWith(mockUserId);
      expect(result).toHaveLength(2);
      expect(result[0].notes).toBe('Physics Lab');
      expect(result[1].notes).toBe('Dentist');
    });

    it('should return empty array when no notes on date', async () => {
      (notesRepo.getAll as jest.Mock).mockResolvedValue([]);

      const result = await getDateNotes(mockUserId, '2026-03-24');

      expect(result).toEqual([]);
    });
  });
});
