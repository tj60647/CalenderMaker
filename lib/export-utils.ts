/**
 * Export Utilities
 * 
 * Functions to export calendar views as SVG and PNG files.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import { CalendarNote, ColorScheme } from '@/types';
import { getDateColor } from './calendar-utils';

/**
 * Configuration for calendar export dimensions
 */
const EXPORT_CONFIG = {
  cellWidth: 140,
  cellHeight: 55,
  padding: 20,
  aspectRatio: 16 / 9,
};

/**
 * Generate calendar dates for export range
 * 
 * Creates array of dates from startDate to endDate, padded to complete weeks.
 * This ensures the calendar grid is rectangular.
 * 
 * @param startDate - First date to include
 * @param endDate - Last date to include
 * @returns Array of Date objects in calendar grid order
 */
function generateExportDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  
  // Find Sunday before or on startDate
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());
  
  // Find Saturday after or on endDate
  const lastSaturday = new Date(endDate);
  lastSaturday.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  // Generate all dates in range
  const current = new Date(firstSunday);
  while (current <= lastSaturday) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Format date range for title
 * 
 * @param startDate - Range start
 * @param endDate - Range end
 * @returns Formatted string like "November 16 - December 20, 2025"
 */
function formatDateRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
  const year = endDate.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDate.getDate()}-${endDate.getDate()}, ${year}`;
  }
  
  return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${year}`;
}

/**
 * Export calendar as SVG
 * 
 * Generates an SVG document showing the calendar with notes
 * and triggers a download in the browser.
 * 
 * @param startDate - First date to include
 * @param endDate - Last date to include
 * @param notes - All calendar notes to display
 * @param colorScheme - Color configuration
 */
export function exportCalendarAsSVG(
  startDate: Date,
  endDate: Date,
  notes: CalendarNote[],
  colorScheme: ColorScheme
): void {
  const dates = generateExportDates(startDate, endDate);
  const weeks: Date[][] = [];
  
  // Split dates into weeks (7 days each)
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }
  
  const { cellWidth, cellHeight, padding } = EXPORT_CONFIG;
  
  // Calculate dimensions
  const totalWidth = 7 * cellWidth + 2 * padding;
  const totalHeight = Math.round(totalWidth * 9 / 16);
  
  // Build SVG content
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}">`;
  
  // Add title
  const title = formatDateRange(startDate, endDate);
  svg += `<text x="${totalWidth / 2}" y="${padding + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="bold">${title}</text>`;
  
  // Add day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach((day, index) => {
    const x = padding + index * cellWidth + cellWidth / 2;
    svg += `<text x="${x}" y="${padding + 50}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${day}</text>`;
  });
  
  // Add calendar cells
  weeks.forEach((week, weekIndex) => {
    week.forEach((date, dayIndex) => {
      const x = padding + dayIndex * cellWidth;
      const y = padding + 70 + weekIndex * cellHeight;
      
      // Determine if date is in range
      const isInRange = date >= startDate && date <= endDate;
      const color = isInRange
        ? getDateColor(date.toISOString().split('T')[0], notes, colorScheme)
        : colorScheme.outOfRange;
      
      // Draw cell background
      svg += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" rx="6" ry="6" fill="${color}" stroke="#ccc" stroke-width="1"/>`;
      
      if (isInRange) {
        // Add date number
        svg += `<text x="${x + 10}" y="${y + 20}" font-family="Arial, sans-serif" font-size="16">${date.getDate()}</text>`;
        
        // Add month label for first of month
        if (date.getDate() === 1) {
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          svg += `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">${monthName}</text>`;
        }
        
        // Add note preview if exists
        const dateString = date.toISOString().split('T')[0];
        const dateNotes = notes.filter(n => n.date === dateString);
        if (dateNotes.length > 0) {
          const noteText = dateNotes[0].notes.substring(0, 15);
          svg += `<text x="${x + cellWidth / 2}" y="${y + cellHeight - 8}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#333">${noteText}${dateNotes[0].notes.length > 15 ? '...' : ''}</text>`;
        }
      }
    });
  });
  
  svg += '</svg>';
  
  // Trigger download
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `calendar-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export calendar as PNG
 * 
 * Generates an SVG first, then converts it to PNG using a canvas.
 * This provides better quality than html2canvas for our grid layout.
 * 
 * @param startDate - First date to include
 * @param endDate - Last date to include
 * @param notes - All calendar notes to display
 * @param colorScheme - Color configuration
 */
export function exportCalendarAsPNG(
  startDate: Date,
  endDate: Date,
  notes: CalendarNote[],
  colorScheme: ColorScheme
): void {
  const dates = generateExportDates(startDate, endDate);
  const weeks: Date[][] = [];
  
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }
  
  const { cellWidth, cellHeight, padding } = EXPORT_CONFIG;
  const totalWidth = 7 * cellWidth + 2 * padding;
  const totalHeight = Math.round(totalWidth * 9 / 16);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }
  
  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  
  // Add title
  const title = formatDateRange(startDate, endDate);
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.fillText(title, totalWidth / 2, padding + 20);
  
  // Add day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  ctx.font = 'bold 14px Arial, sans-serif';
  dayNames.forEach((day, index) => {
    const x = padding + index * cellWidth + cellWidth / 2;
    ctx.fillText(day, x, padding + 50);
  });
  
  // Add calendar cells
  weeks.forEach((week, weekIndex) => {
    week.forEach((date, dayIndex) => {
      const x = padding + dayIndex * cellWidth;
      const y = padding + 70 + weekIndex * cellHeight;
      
      const isInRange = date >= startDate && date <= endDate;
      const color = isInRange
        ? getDateColor(date.toISOString().split('T')[0], notes, colorScheme)
        : colorScheme.outOfRange;
      
      // Draw cell background with rounded corners
      ctx.fillStyle = color || '#f9fafb';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      
      // Rounded rectangle
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + cellWidth - radius, y);
      ctx.quadraticCurveTo(x + cellWidth, y, x + cellWidth, y + radius);
      ctx.lineTo(x + cellWidth, y + cellHeight - radius);
      ctx.quadraticCurveTo(x + cellWidth, y + cellHeight, x + cellWidth - radius, y + cellHeight);
      ctx.lineTo(x + radius, y + cellHeight);
      ctx.quadraticCurveTo(x, y + cellHeight, x, y + cellHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      if (isInRange) {
        // Add date number
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000000';
        ctx.fillText(date.getDate().toString(), x + 10, y + 20);
        
        // Add month label for first of month
        if (date.getDate() === 1) {
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          ctx.font = '12px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#666666';
          ctx.fillText(monthName, x + cellWidth / 2, y + cellHeight / 2 + 5);
        }
        
        // Add note preview if exists
        const dateString = date.toISOString().split('T')[0];
        const dateNotes = notes.filter(n => n.date === dateString);
        if (dateNotes.length > 0) {
          const noteText = dateNotes[0].notes.substring(0, 15);
          ctx.font = '10px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#333333';
          ctx.fillText(noteText + (dateNotes[0].notes.length > 15 ? '...' : ''), x + cellWidth / 2, y + cellHeight - 8);
        }
      }
    });
  });
  
  // Convert to PNG and download
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to create blob');
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
