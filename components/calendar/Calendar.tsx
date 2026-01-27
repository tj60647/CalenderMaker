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

import { useState, useMemo, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarDates, formatDateDisplay, CalendarDateCell, getDateColor } from '@/lib/calendar-utils';
import { CalendarNote, ColorScheme } from '@/types';
import { startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, format, isSameDay, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Props for Calendar component
 */
interface CalendarProps {
  userId: string;                          // Current user ID
  onDateSelect?: (dateString: string) => void;  // Called when user clicks a date
  onRangeChange?: (startDate: string, endDate: string) => void; // Called when visible range changes
  selectedDate?: string;                        // Currently selected date (ISO string)
  colorScheme: ColorScheme;                     // User's color preferences
  notes: CalendarNote[];                        // List of calendar notes to display
}

type ViewMode = 'month' | 'week';

/**
 * Main calendar grid component
 * 
 * Displays a traditional month calendar or week view with:
 * - Day headers (Sun-Sat)
 * - Date cells with event chips
 * - View toggle
 * - Month navigation
 * 
 * @param props - Component props
 * @returns Calendar grid
 */
export function Calendar({ userId, onDateSelect, onRangeChange, selectedDate, colorScheme, notes }: CalendarProps) {
  // View mode state
  const [view, setView] = useState<ViewMode>('month');

  // Current navigation date (serves as anchor for both month and week view)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Derived state for display
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  /**
   * Notify parent of range change when view or date changes
   */
  useEffect(() => {
    if (!onRangeChange) return;

    let start: Date, end: Date;

    if (view === 'month') {
       start = startOfMonth(currentDate);
       end = endOfMonth(currentDate);
    } else {
       start = startOfWeek(currentDate, { weekStartsOn: 0 });
       end = endOfWeek(currentDate, { weekStartsOn: 0 });
    }

    onRangeChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
  }, [currentDate, view, onRangeChange]);

  /**
   * Generate calendar date cells based on current view
   */
  const dateCells = useMemo(() => {
    if (view === 'month') {
      return generateCalendarDates(currentYear, currentMonth, notes, colorScheme);
    } else {
      // Week View generation
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start, end });
      const today = new Date();

      return days.map(date => {
        const dateString = format(date, 'yyyy-MM-dd');
        const notesForDate = notes.filter(n => n.date === dateString);
        
        let cellColor: string | undefined;
        if (notesForDate.length > 0) {
           cellColor = getDateColor(dateString, notesForDate, colorScheme);
        }

        return {
          date,
          dateString,
          isCurrentMonth: true, // Always relevant in week view
          isToday: isSameDay(date, today),
          hasNotes: notesForDate.length > 0,
          displayText: format(date, 'd'),
          color: cellColor,
          notes: notesForDate
        } as CalendarDateCell;
      });
    }
  }, [view, currentYear, currentMonth, currentDate, notes, colorScheme]);

  /**
   * Navigation Handlers
   */
  function handlePrevious() {
    if (view === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  }

  function handleNext() {
    if (view === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  /**
   * Handle date cell click
   */
  function handleDateClick(dateString: string) {
    if (onDateSelect) {
      onDateSelect(dateString);
    }
  }

  /**
   * Day of week headers
   */
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
           <IconButton onClick={handlePrevious} size="small">
            <ChevronLeft size={20} />
          </IconButton>
          <IconButton onClick={handleNext} size="small">
            <ChevronRight size={20} />
          </IconButton>
          <Typography variant="h6" sx={{ minWidth: 150, textAlign: 'center', fontWeight: 600 }}>
            {view === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`
            }
          </Typography>
        </Box>

        {/* View Toggle */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Box 
            component="button" 
            onClick={handleToday}
            sx={{ 
              px: 2, py: 0.5, 
              border: '1px solid', borderColor: 'divider', 
              borderRadius: 1, 
              bgcolor: 'background.paper', 
              cursor: 'pointer',
              fontWeight: 500,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            Today
          </Box>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
          >
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="week">Week</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Calendar Grid */}
      <Box>
        {/* Day Headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider' }}>
          {dayHeaders.map(day => (
            <Box key={day} sx={{ py: 1, textAlign: 'center', borderRight: '1px solid', borderColor: 'divider', '&:last-child': { borderRight: 'none' } }}>
               <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase' }}>
                {day}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Date Cells */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          // Month view: show border top for cells
          '& > div': { borderBottom: '1px solid', borderColor: 'divider' }
        }}>
          {dateCells.map((cell, index) => (
            <DateCell
              key={cell.dateString}
              cell={cell}
              isSelected={cell.dateString === selectedDate}
              onClick={() => handleDateClick(cell.dateString)}
              view={view}
              // Add right border to all except last in row
              sx={{ 
                borderRight: (index + 1) % 7 === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
                // Min height for month view cells to look like Google Calendar 
                minHeight: view === 'month' ? 120 : 500
              }}
            />
          ))}
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
  view: ViewMode;
  sx?: any;
}

/**
 * Individual date cell in calendar grid
 */
function DateCell({ cell, isSelected, onClick, view, sx }: DateCellProps) {
  
  // Sort notes by time if available
  const sortedNotes = [...(cell.notes || [])].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  // Limit visible notes based on view
  const maxVisible = view === 'month' ? 4 : 20;
  const visibleNotes = sortedNotes.slice(0, maxVisible);
  const hiddenCount = sortedNotes.length - maxVisible;

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1,
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'background.paper',
        transition: 'background-color 0.2s',
        '&:hover': { bgcolor: 'action.hover' },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // Prevent expanding parent grid cell
        ...sx
      }}
    >
      {/* Date Header */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: cell.isToday ? 600 : 400,
            bgcolor: cell.isToday ? 'primary.main' : 'transparent',
            color: cell.isToday ? 'primary.contrastText' : (cell.isCurrentMonth ? 'text.primary' : 'text.disabled'),
            fontSize: '0.875rem'
          }}
        >
          {cell.displayText}
        </Typography>
      </Box>

      {/* Events List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, flex: 1, overflow: 'hidden' }}>
        {visibleNotes.map(note => {
          const isTimed = !!note.time;
          return (
            <Box
              key={note.id}
              sx={{
                bgcolor: isTimed ? 'transparent' : (note.color || '#3b82f6'),
                color: isTimed ? 'text.primary' : '#fff',
                px: 0.5,
                py: 0.25,
                borderRadius: 1,
                fontSize: '0.75rem',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                lineHeight: 1.2,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.9,
                  bgcolor: isTimed ? 'action.hover' : undefined
                }
              }}
            >
              {isTimed ? (
                <>
                  <Box 
                    sx={{ 
                      width: 6, 
                      height: 6, 
                      borderRadius: '50%', 
                      bgcolor: note.color || '#3b82f6',
                      flexShrink: 0
                    }} 
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 500 }}>
                    {note.time}
                  </Typography>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>
                    {note.summary || note.notes}
                  </span>
                </>
              ) : (
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, paddingLeft: 2 }}>
                  {note.summary || note.notes}
                </span>
              )}
            </Box>
          );
        })}
        
        {hiddenCount > 0 && (
          <Typography 
            variant="caption" 
            sx={{ 
              pl: 1, 
              color: 'text.secondary', 
              fontWeight: 600, 
              fontSize: '0.7rem',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {hiddenCount} more
          </Typography>
        )}
      </Box>
    </Box>
  );
}
