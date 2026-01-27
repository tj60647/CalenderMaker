/**
 * Calendar Utilities
 * 
 * Helper functions for calendar date generation, formatting,
 * and color logic. These utilities handle the complex date math
 * required to display a traditional month calendar grid.
 * 
 * Key Functions:
 * - generateCalendarDates: Create full weeks for month view
 * - getDateColor: Determine cell background color
 * - hasNotes: Check if date has associated notes
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { CalendarNote, ColorScheme } from '@/types';

/**
 * Represents a single date cell in the calendar grid
 * 
 * Each cell needs to know:
 * - The actual date
 * - Whether it's in the current month (vs padding dates)
 * - Whether it's today
 * - Whether it has notes
 * - What color to display
 */
export interface CalendarDateCell {
  date: Date;                 // The actual date object
  dateString: string;         // ISO format: "2026-01-08"
  isCurrentMonth: boolean;    // Is this date in the displayed month?
  isToday: boolean;          // Is this today's date?
  hasNotes: boolean;         // Does this date have notes?
  displayText: string;       // What to show in the cell (usually day number)
  color?: string;            // Background color (if has notes)
  notes: CalendarNote[];     // All notes for this specific date
}

/**
 * Generate all date cells for a calendar month view
 * 
 * A calendar month grid shows:
 * 1. Padding days from previous month (to start on Sunday)
 * 2. All days in the target month
 * 3. Padding days from next month (to end on Saturday)
 * 
 * This creates a complete grid (usually 35 or 42 cells) so the
 * calendar looks like a traditional paper calendar.
 * 
 * Process:
 * 1. Find the first day of the target month
 * 2. Find the Sunday before that (might be in previous month)
 * 3. Find the last day of the target month
 * 4. Find the Saturday after that (might be in next month)
 * 5. Generate all dates between Sunday and Saturday
 * 
 * @param year - Year to display (e.g., 2026)
 * @param month - Month to display (1-12, where 1 = January)
 * @param notes - All notes for this user (used to check hasNotes)
 * @param colorScheme - User's color preferences
 * @returns Array of date cells for calendar grid
 */
export function generateCalendarDates(
  year: number,
  month: number,
  notes: CalendarNote[],
  colorScheme: ColorScheme
): CalendarDateCell[] {
  // Create date object for the target month
  // JavaScript months are 0-indexed, so subtract 1
  const targetMonth = new Date(year, month - 1, 1);

  // Get first and last day of the month
  const firstDayOfMonth = startOfMonth(targetMonth);
  const lastDayOfMonth = endOfMonth(targetMonth);

  // Get the Sunday before the first day
  // This might be in the previous month
  // Example: If month starts on Wednesday, we need Sun/Mon/Tue from previous month
  const calendarStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // 0 = Sunday

  // Get the Saturday after the last day
  // This might be in the next month
  // Example: If month ends on Thursday, we need Fri/Sat from next month
  const calendarEnd = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });

  // Generate array of all dates from Sunday to Saturday
  const allDates = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // Get today's date for comparison (strip time for accurate isSameDay check)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert each date to a CalendarDateCell
  return allDates.map(date => {
    const dateString = format(date, 'yyyy-MM-dd');
    const currentMonth = isSameMonth(date, targetMonth);
    const isToday = isSameDay(date, today);
    const notesForDate = notes.filter(note => note.date === dateString);
    const hasNotesFlag = notesForDate.length > 0;

    // Get the color for this date
    // If it has notes, use the note's color or default category color
    let cellColor: string | undefined;
    if (hasNotesFlag) {
      cellColor = getDateColor(dateString, notes, colorScheme);
    }

    return {
      date,
      dateString,
      isCurrentMonth: currentMonth,
      isToday,
      hasNotes: hasNotesFlag,
      displayText: format(date, 'd'), // Just the day number (1-31)
      color: cellColor,
      notes: notesForDate
    };
  });
}

/**
 * Determine the background color for a calendar date
 * 
 * Color priority:
 * 1. If note has explicit color field, use that
 * 2. If note has category, use category's color from colorScheme
 * 3. Use default color from colorScheme
 * 
 * If multiple notes exist for the same date:
 * - Use the color from the first note found
 * - In a future enhancement, could blend colors or show multiple
 * 
 * @param dateString - ISO date string ("2026-01-08")
 * @param notes - All notes for this user
 * @param colorScheme - User's color preferences
 * @returns Hex color string (e.g., "#3b82f6") or undefined
 */
export function getDateColor(
  dateString: string,
  notes: CalendarNote[],
  colorScheme: ColorScheme
): string | undefined {
  // Find all notes for this date
  const notesForDate = notes.filter(note => note.date === dateString);

  if (notesForDate.length === 0) {
    return undefined;
  }

  // Use the first note's color
  // TODO: Future enhancement - blend multiple colors or show multiple indicators
  const note = notesForDate[0];

  // Priority 1: Note has explicit color
  if (note.color) {
    return note.color;
  }

  // Priority 2: Note has category, use category color
  if (note.category && colorScheme.categories[note.category]) {
    return colorScheme.categories[note.category];
  }

  // Priority 3: Use default color
  return colorScheme.default;
}

/**
 * Check if a date has any notes
 * 
 * This is a simple helper to make code more readable.
 * We could just check notes.some() everywhere, but this
 * is clearer and can be optimized later if needed.
 * 
 * @param dateString - ISO date string ("2026-01-08")
 * @param notes - All notes for this user
 * @returns true if date has at least one note
 */
export function hasNotes(dateString: string, notes: CalendarNote[]): boolean {
  return notes.some(note => note.date === dateString);
}

/**
 * Get all notes for a specific date
 * 
 * Helper function to retrieve notes for display in detail view.
 * Returns array sorted by time (if present), then by category.
 * 
 * @param dateString - ISO date string ("2026-01-08")
 * @param notes - All notes for this user
 * @returns Array of notes for this date, sorted
 */
export function getNotesForDate(dateString: string, notes: CalendarNote[]): CalendarNote[] {
  const dateNotes = notes.filter(note => note.date === dateString);

  // Sort by time first, then by category
  return dateNotes.sort((a, b) => {
    // If both have times, sort by time
    if (a.time && b.time) {
      return a.time.localeCompare(b.time);
    }
    // Notes with time come before notes without time
    if (a.time) return -1;
    if (b.time) return 1;

    // Sort by category if no times
    const catA = a.category || '';
    const catB = b.category || '';
    return catA.localeCompare(catB);
  });
}

/**
 * Format a date for display in various contexts
 * 
 * Examples:
 * - "full": "Wednesday, January 8, 2026"
 * - "short": "Jan 8, 2026"
 * - "day": "Wednesday"
 * - "month": "January 2026"
 * 
 * @param date - Date object or ISO string
 * @param style - Display style
 * @returns Formatted date string
 */
export function formatDateDisplay(
  date: Date | string,
  style: 'full' | 'short' | 'day' | 'month' = 'full'
): string {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  switch (style) {
    case 'full':
      return format(dateObj, 'EEEE, MMMM d, yyyy');
    case 'short':
      return format(dateObj, 'MMM d, yyyy');
    case 'day':
      return format(dateObj, 'EEEE');
    case 'month':
      return format(dateObj, 'MMMM yyyy');
    default:
      return format(dateObj, 'yyyy-MM-dd');
  }
}

/**
 * Validate that a date string is in correct ISO format
 * 
 * Expected format: "YYYY-MM-DD"
 * Example: "2026-01-08"
 * 
 * This prevents invalid dates from entering the system.
 * 
 * @param dateString - String to validate
 * @returns true if valid ISO date string
 */
export function isValidDateString(dateString: string): boolean {
  // Check format with regex: YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  // Check that it's a real date (not 2026-02-30)
  try {
    const date = parseISO(dateString);
    // Check that parsing worked and format matches
    return format(date, 'yyyy-MM-dd') === dateString;
  } catch {
    return false;
  }
}
