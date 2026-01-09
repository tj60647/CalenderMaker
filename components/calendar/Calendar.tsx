/**
 * Calendar Component
 * 
 * Main interactive calendar grid showing a month view.
 * Users can:
 * - View dates with colored indicators for notes
 * - Click dates to view/edit details
 * - Navigate between months
 * - See today highlighted
 * 
 * Uses Material-UI Grid for responsive layout.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarDates, formatDateDisplay, CalendarDateCell } from '@/lib/calendar-utils';
import { CalendarNote, ColorScheme } from '@/types';
import { notesRepo } from '@/lib/repositories';

/**
 * Props for Calendar component
 */
interface CalendarProps {
  userId: string;                          // Current user ID
  onDateSelect?: (dateString: string) => void;  // Called when user clicks a date
  selectedDate?: string;                        // Currently selected date (ISO string)
  colorScheme: ColorScheme;                     // User's color preferences
}

/**
 * Main calendar grid component
 * 
 * Displays a traditional month calendar with:
 * - Day headers (Sun-Sat)
 * - Date cells (with padding from prev/next months)
 * - Color coding for dates with notes
 * - Today indicator
 * - Month navigation
 * 
 * @param props - Component props
 * @returns Calendar grid
 */
export function Calendar({ userId, onDateSelect, selectedDate, colorScheme }: CalendarProps) {
  // Current month/year being displayed
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12

  // All notes for this user
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load notes from repository when component mounts or user changes
   * 
   * This fetches all notes for the current user.
   * We load all notes at once rather than per-month because:
   * 1. LocalStorage is fast enough for small datasets
   * 2. It's simpler to manage state
   * 3. We might need cross-month data (e.g., for search)
   * 
   * When we migrate to Supabase, we can optimize this to
   * only load notes for visible date range.
   */
  useEffect(() => {
    async function loadNotes() {
      setIsLoading(true);
      try {
        const userNotes = await notesRepo.getAll(userId);
        setNotes(userNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
        // TODO: Show error notification to user
      } finally {
        setIsLoading(false);
      }
    }

    loadNotes();
  }, [userId]);

  /**
   * Generate calendar date cells for current month
   * 
   * This creates the full grid including padding dates
   * from previous and next months.
   */
  const dateCells = generateCalendarDates(currentYear, currentMonth, notes, colorScheme);

  /**
   * Navigate to previous month
   * 
   * Handles year rollover (Jan -> Dec of previous year)
   */
  function handlePreviousMonth() {
    if (currentMonth === 1) {
      // January -> December of previous year
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  }

  /**
   * Navigate to next month
   * 
   * Handles year rollover (Dec -> Jan of next year)
   */
  function handleNextMonth() {
    if (currentMonth === 12) {
      // December -> January of next year
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  }

  /**
   * Handle date cell click
   * 
   * Notify parent component that user selected a date.
   * Parent can then show detail panel, open chat, etc.
   * 
   * @param dateString - ISO date string of clicked cell
   */
  function handleDateClick(dateString: string) {
    if (onDateSelect) {
      onDateSelect(dateString);
    }
  }

  /**
   * Day of week headers
   * 
   * Traditional calendar starts on Sunday
   */
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      {/* Month header with navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <IconButton onClick={handlePreviousMonth} size="small">
          <ChevronLeft size={20} />
        </IconButton>

        <Typography variant="h5" component="h2">
          {formatDateDisplay(new Date(currentYear, currentMonth - 1, 1), 'month')}
        </Typography>

        <IconButton onClick={handleNextMonth} size="small">
          <ChevronRight size={20} />
        </IconButton>
      </Box>

      {/* Calendar grid */}
      <Box>
        {/* Day headers (Sun-Sat) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}>
          {dayHeaders.map(day => (
            <Typography
              key={day}
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              {day}
            </Typography>
          ))}
        </Box>

        {/* Date cells */}
        <Box>
          {isLoading ? (
            // Loading state
            <Typography align="center" color="text.secondary">
              Loading calendar...
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
              {dateCells.map((cell) => (
                <DateCell
                  key={cell.dateString}
                  cell={cell}
                  isSelected={cell.dateString === selectedDate}
                  onClick={() => handleDateClick(cell.dateString)}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

/**
 * Props for DateCell component
 */
interface DateCellProps {
  cell: CalendarDateCell;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Individual date cell in calendar grid
 * 
 * Shows:
 * - Day number
 * - Background color (if has notes)
 * - Today indicator (border)
 * - Selected state (darker border)
 * - Hover effect
 * 
 * @param props - Component props
 * @returns Styled date cell
 */
function DateCell({ cell, isSelected, onClick }: DateCellProps) {
  /**
   * Determine cell background color
   * 
   * Priority:
   * 1. If has notes, use note color
   * 2. Otherwise, transparent
   * 
   * Opacity is reduced for:
   * - Dates outside current month (0.3)
   * - Dates in current month without selection (0.7)
   */
  function getBackgroundColor(): string {
    if (cell.color) {
      // Has notes - use note color with opacity
      const opacity = cell.isCurrentMonth ? 0.7 : 0.3;
      return `${cell.color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
    }
    return 'transparent';
  }

  /**
   * Determine border styling
   * 
   * - Today: 2px solid primary color
   * - Selected: 2px solid secondary color
   * - Neither: 1px solid divider
   */
  function getBorder(): string {
    if (isSelected) {
      return '2px solid';
    }
    if (cell.isToday) {
      return '2px solid';
    }
    return '1px solid';
  }

  function getBorderColor(): string {
    if (isSelected) {
      return 'secondary.main';
    }
    if (cell.isToday) {
      return 'primary.main';
    }
    return 'divider';
  }

  return (
    <Tooltip
      title={cell.hasNotes ? 'Has notes - click to view' : 'Click to add notes'}
      arrow
      enterDelay={500}
    >
      <Box
        onClick={onClick}
        sx={{
          aspectRatio: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: getBackgroundColor(),
          border: getBorder(),
          borderColor: getBorderColor(),
          borderRadius: 1,
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: cell.isCurrentMonth ? 1 : 0.5,
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: 2,
          },
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: cell.isToday ? 700 : cell.hasNotes ? 600 : 400,
            color: cell.isCurrentMonth ? 'text.primary' : 'text.secondary',
          }}
        >
          {cell.displayText}
        </Typography>
      </Box>
    </Tooltip>
  );
}
