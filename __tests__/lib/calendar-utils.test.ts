/**
 * Calendar Utilities Tests
 * 
 * Unit tests for calendar utility functions.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import {
  generateCalendarDates,
  getDateColor,
  hasNotes,
  getNotesForDate,
  formatDateDisplay,
  isValidDateString,
} from '@/lib/calendar-utils';
import { CalendarNote, ColorScheme } from '@/types';

/**
 * Mock color scheme for testing
 */
const mockColorScheme: ColorScheme = {
  default: '#3b82f6',
  weekend: '#e0e7ff',
  month1: '#f3f4f6',
  month2: '#fef3c7',
  outOfRange: '#f9fafb',
  specialDates: {},
  categories: {
    work: '#ef4444',
    personal: '#10b981',
  },
};

/**
 * Mock notes for testing
 */
const mockNotes: CalendarNote[] = [
  {
    id: '1',
    user_id: 'test-user',
    date: '2026-01-08',
    notes: 'Test note',
    color: '#ff0000',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'test-user',
    date: '2026-01-08',
    notes: 'Another note',
    category: 'work',
    time: '09:00',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'test-user',
    date: '2026-01-15',
    notes: 'Personal note',
    category: 'personal',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('calendar-utils', () => {
  describe('generateCalendarDates', () => {
    test('generates correct number of date cells for January 2026', () => {
      const dates = generateCalendarDates(2026, 1, [], mockColorScheme);
      
      // January 2026 starts on Thursday
      // Should have dates from previous month to fill week
      // Result should be 35 or 42 cells (5 or 6 weeks)
      expect(dates.length).toBeGreaterThanOrEqual(35);
      expect(dates.length).toBeLessThanOrEqual(42);
    });

    test('marks current month dates correctly', () => {
      const dates = generateCalendarDates(2026, 1, [], mockColorScheme);
      
      const januaryDates = dates.filter(d => d.isCurrentMonth);
      expect(januaryDates.length).toBe(31); // January has 31 days
    });

    test('includes notes information', () => {
      const dates = generateCalendarDates(2026, 1, mockNotes, mockColorScheme);
      
      const dateWithNotes = dates.find(d => d.dateString === '2026-01-08');
      expect(dateWithNotes?.hasNotes).toBe(true);
      expect(dateWithNotes?.color).toBe('#ff0000');
    });
  });

  describe('getDateColor', () => {
    test('returns note color if explicitly set', () => {
      const color = getDateColor('2026-01-08', mockNotes, mockColorScheme);
      expect(color).toBe('#ff0000');
    });

    test('returns category color if no explicit color', () => {
      const color = getDateColor('2026-01-15', mockNotes, mockColorScheme);
      expect(color).toBe('#10b981'); // personal category color
    });

    test('returns default color if no color or category', () => {
      const noteWithoutColor: CalendarNote = {
        ...mockNotes[0],
        id: '4',
        date: '2026-01-20',
        color: undefined,
        category: undefined,
      };
      const color = getDateColor('2026-01-20', [noteWithoutColor], mockColorScheme);
      expect(color).toBe('#3b82f6'); // default color
    });

    test('returns undefined for date without notes', () => {
      const color = getDateColor('2026-01-25', mockNotes, mockColorScheme);
      expect(color).toBeUndefined();
    });
  });

  describe('hasNotes', () => {
    test('returns true for date with notes', () => {
      expect(hasNotes('2026-01-08', mockNotes)).toBe(true);
    });

    test('returns false for date without notes', () => {
      expect(hasNotes('2026-01-25', mockNotes)).toBe(false);
    });
  });

  describe('getNotesForDate', () => {
    test('returns all notes for a specific date', () => {
      const notes = getNotesForDate('2026-01-08', mockNotes);
      expect(notes).toHaveLength(2);
    });

    test('sorts notes by time', () => {
      const notes = getNotesForDate('2026-01-08', mockNotes);
      // Note with time='09:00' should come first
      expect(notes[0].time).toBe('09:00');
    });

    test('returns empty array for date without notes', () => {
      const notes = getNotesForDate('2026-01-25', mockNotes);
      expect(notes).toHaveLength(0);
    });
  });

  describe('formatDateDisplay', () => {
    const testDate = '2026-01-08';

    test('formats date in full style', () => {
      const formatted = formatDateDisplay(testDate, 'full');
      expect(formatted).toBe('Thursday, January 8, 2026');
    });

    test('formats date in short style', () => {
      const formatted = formatDateDisplay(testDate, 'short');
      expect(formatted).toBe('Jan 8, 2026');
    });

    test('formats date in day style', () => {
      const formatted = formatDateDisplay(testDate, 'day');
      expect(formatted).toBe('Thursday');
    });

    test('formats date in month style', () => {
      const formatted = formatDateDisplay(testDate, 'month');
      expect(formatted).toBe('January 2026');
    });
  });

  describe('isValidDateString', () => {
    test('returns true for valid ISO date', () => {
      expect(isValidDateString('2026-01-08')).toBe(true);
    });

    test('returns false for invalid format', () => {
      expect(isValidDateString('01/08/2026')).toBe(false);
      expect(isValidDateString('2026-1-8')).toBe(false);
    });

    test('returns false for invalid date', () => {
      expect(isValidDateString('2026-02-30')).toBe(false);
      expect(isValidDateString('2026-13-01')).toBe(false);
    });

    test('returns false for non-date strings', () => {
      expect(isValidDateString('not a date')).toBe(false);
      expect(isValidDateString('')).toBe(false);
    });
  });
});
