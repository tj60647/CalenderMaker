/**
 * Date Detail Panel
 * 
 * Shows detailed information for a selected date.
 * Users can:
 * - View all notes for the date
 * - Add new notes
 * - Edit existing notes
 * - Delete notes
 * - Set colors and categories
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { CalendarNote, ColorScheme } from '@/types';
import { notesRepo } from '@/lib/repositories';
import { formatDateDisplay, getNotesForDate } from '@/lib/calendar-utils';

/**
 * Props for DateDetailPanel
 */
interface DateDetailPanelProps {
  dateString: string | null;              // Selected date (ISO string) or null
  userId: string;                         // Current user ID
  onClose: () => void;                    // Called when user closes panel
  onNotesChange: () => void;              // Called after notes are created/updated/deleted
  colorScheme: ColorScheme;               // User's color preferences
  allNotes: CalendarNote[];               // All notes (for filtering)
}

/**
 * Date detail panel component
 * 
 * Shows on the side when a date is selected.
 * Allows full CRUD operations on notes.
 * 
 * @param props - Component props
 * @returns Detail panel or null if no date selected
 */
export function DateDetailPanel(props: DateDetailPanelProps) {
  const { dateString, userId, onClose, onNotesChange, colorScheme, allNotes } = props;
  
  // If no date selected, don't render
  if (!dateString) {
    return null;
  }
  
  // At this point TypeScript knows dateString is non-null
  return <DateDetailPanelContent 
    dateString={dateString}
    userId={userId}
    onClose={onClose}
    onNotesChange={onNotesChange}
    colorScheme={colorScheme}
    allNotes={allNotes}
  />;
}

/**
 * Props for internal panel content (dateString is guaranteed non-null)
 */
interface DateDetailPanelContentProps {
  dateString: string;                     // Selected date (ISO string, non-null)
  userId: string;                         // Current user ID
  onClose: () => void;                    // Called when user closes panel
  onNotesChange: () => void;              // Called after notes are created/updated/deleted
  colorScheme: ColorScheme;               // User's color preferences
  allNotes: CalendarNote[];               // All notes (for filtering)
}

/**
 * Internal panel content component
 * 
 * Separated from parent to ensure dateString is non-null.
 */
function DateDetailPanelContent({
  dateString,
  userId,
  onClose,
  onNotesChange,
  colorScheme,
  allNotes,
}: DateDetailPanelContentProps) {

  // Form state for new/editing note
  const [noteText, setNoteText] = useState('');
  const [noteTime, setNoteTime] = useState('');
  const [noteCategory, setNoteCategory] = useState('');
  const [noteColor, setNoteColor] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get notes for this specific date
  const dateNotes = getNotesForDate(dateString, allNotes);

  /**
   * Reset form to initial state
   * 
   * Called after saving or canceling edit.
   */
  function resetForm() {
    setNoteText('');
    setNoteTime('');
    setNoteCategory('');
    setNoteColor('');
    setEditingId(null);
  }

  /**
   * Load note data into form for editing
   * 
   * @param note - Note to edit
   */
  function startEditing(note: CalendarNote) {
    setNoteText(note.notes);
    setNoteTime(note.time || '');
    setNoteCategory(note.category || '');
    setNoteColor(note.color || '');
    setEditingId(note.id);
  }

  /**
   * Save note (create or update)
   * 
   * If editingId is set, updates existing note.
   * Otherwise, creates new note.
   */
  async function handleSaveNote() {
    // Validate
    if (!noteText.trim()) {
      return; // TODO: Show validation error
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update existing note
        await notesRepo.update(
          editingId,
          {
            notes: noteText.trim(),
            time: noteTime || undefined,
            category: noteCategory || undefined,
            color: noteColor || undefined,
          },
          userId
        );
      } else {
        // Create new note
        await notesRepo.create(
          {
            date: dateString,
            notes: noteText.trim(),
            time: noteTime || undefined,
            category: noteCategory || undefined,
            color: noteColor || undefined,
          },
          userId
        );
      }

      // Success - reset form and notify parent
      resetForm();
      onNotesChange();
    } catch (error) {
      console.error('Failed to save note:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Delete a note
   * 
   * @param noteId - ID of note to delete
   */
  async function handleDeleteNote(noteId: string) {
    // TODO: Add confirmation dialog
    try {
      await notesRepo.delete(noteId, userId);
      onNotesChange();
      
      // If we were editing this note, reset form
      if (editingId === noteId) {
        resetForm();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      // TODO: Show error notification
    }
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: 400,
        maxWidth: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">
          {formatDateDisplay(dateString, 'full')}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </Box>

      {/* Existing notes list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {dateNotes.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No notes for this date
          </Typography>
        ) : (
          <List>
            {dateNotes.map((note, index) => (
              <Box key={note.id}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                <ListItem
                  disablePadding
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 1,
                  }}
                >
                  {/* Note content */}
                  <Box>
                    <ListItemText
                      primary={note.notes}
                    />
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      {note.time && (
                        <Chip label={note.time} size="small" />
                      )}
                      {note.category && (
                        <Chip
                          label={note.category}
                          size="small"
                          sx={{
                            backgroundColor: note.color || colorScheme.categories[note.category] || colorScheme.default,
                            color: 'white',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Action buttons */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      onClick={() => startEditing(note)}
                      color="primary"
                    >
                      <Edit2 size={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteNote(note.id)}
                      color="error"
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Box>

      <Divider />

      {/* Add/Edit note form */}
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {editingId ? 'Edit Note' : 'Add Note'}
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Enter note details..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            type="time"
            label="Time (optional)"
            value={noteTime}
            onChange={(e) => setNoteTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />

          <TextField
            size="small"
            label="Category (optional)"
            value={noteCategory}
            onChange={(e) => setNoteCategory(e.target.value)}
            placeholder="work, personal, etc."
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            type="color"
            label="Color (optional)"
            value={noteColor || '#3b82f6'}
            onChange={(e) => setNoteColor(e.target.value)}
            sx={{ width: 100 }}
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ flex: 1 }} />

          {editingId && (
            <Button onClick={resetForm} disabled={isSubmitting}>
              Cancel
            </Button>
          )}

          <Button
            variant="contained"
            onClick={handleSaveNote}
            disabled={isSubmitting || !noteText.trim()}
            startIcon={editingId ? <Edit2 size={16} /> : <Plus size={16} />}
          >
            {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
