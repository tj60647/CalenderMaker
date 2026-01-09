/**
 * Calendar Tools for AI Function Calling
 * 
 * These tools enable the AI to query the calendar before making decisions.
 * Each tool is a simple wrapper around repository methods, designed to
 * return data in a format the AI can understand.
 * 
 * The AI calls these tools to:
 * - Check for scheduling conflicts
 * - Understand what events exist in a date range
 * - Search notes by keyword
 * - Get details for a specific date
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { notesRepo } from '@/lib/repositories';
import { CalendarNote } from '@/types';

/**
 * Calculate the Sunday-Saturday week containing a date
 * 
 * Process:
 * 1. Find the Sunday before (or on) the target date
 * 2. Find the Saturday after (or on) the target date
 * 3. Return both as ISO date strings
 * 
 * Example: "2026-03-24" (Tuesday) returns:
 * - start: "2026-03-22" (Sunday)
 * - end: "2026-03-28" (Saturday)
 * 
 * @param dateStr - ISO date string (YYYY-MM-DD)
 * @returns Object with start (Sunday) and end (Saturday) ISO dates
 */
function getWeekBoundaries(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00');
  
  // getDay() returns 0 (Sunday) to 6 (Saturday)
  const dayOfWeek = date.getDay();
  
  // Calculate Sunday of this week
  // If date is already Sunday, dayOfWeek = 0, so we subtract 0 days
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - dayOfWeek);
  
  // Calculate Saturday of this week
  // Saturday is 6 days after Sunday
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  
  return {
    start: sunday.toISOString().split('T')[0],
    end: saturday.toISOString().split('T')[0]
  };
}

/**
 * Search calendar for notes matching criteria
 * 
 * The AI uses this to check for existing events before taking action.
 * For example: "Is there anything scheduled on March 24?"
 * 
 * @param userId - ID of the user
 * @param startDate - Start of date range (ISO: YYYY-MM-DD)
 * @param endDate - End of date range (ISO: YYYY-MM-DD)
 * @returns Array of notes in the date range
 */
export async function searchCalendar(
  userId: string,
  startDate: string,
  endDate: string
): Promise<CalendarNote[]> {
  return await notesRepo.getByDateRange(startDate, endDate, userId);
}

/**
 * Get all notes for a calendar week (Sunday-Saturday)
 * 
 * The AI uses this to understand "week" in human terms.
 * When user says "week of March 24", we find Sun-Sat containing that date.
 * 
 * @param userId - ID of the user
 * @param dateInWeek - Any date in the desired week (ISO: YYYY-MM-DD)
 * @returns Object with week boundaries and all notes in that week
 */
export async function getWeekNotes(
  userId: string,
  dateInWeek: string
): Promise<{ start: string; end: string; notes: CalendarNote[] }> {
  const { start, end } = getWeekBoundaries(dateInWeek);
  const notes = await notesRepo.getByDateRange(start, end, userId);
  
  return { start, end, notes };
}

/**
 * Search notes by keyword
 * 
 * The AI uses this to find notes containing specific text.
 * For example: "Show me all notes about 'Physics class'"
 * 
 * @param userId - ID of the user
 * @param keyword - Text to search for (case-insensitive)
 * @returns Array of notes containing the keyword
 */
export async function searchByKeyword(
  userId: string,
  keyword: string
): Promise<CalendarNote[]> {
  return await notesRepo.search(keyword, userId);
}

/**
 * Get all notes for a specific date
 * 
 * The AI uses this to check what's scheduled on a particular day.
 * For example: "What do I have on March 24?"
 * 
 * @param userId - ID of the user
 * @param date - ISO date string (YYYY-MM-DD)
 * @returns Array of notes on that date
 */
export async function getDateNotes(
  userId: string,
  date: string
): Promise<CalendarNote[]> {
  const allNotes = await notesRepo.getAll(userId);
  
  // Filter to notes matching this exact date
  return allNotes.filter(note => note.date === date);
}
