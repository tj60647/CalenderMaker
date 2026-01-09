/**
 * JSON Viewer Component
 * 
 * Displays calendar data in formatted JSON for debugging and inspection.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { CalendarNote } from '@/types';

/**
 * Props for JSONViewer component
 */
interface JSONViewerProps {
  open: boolean;
  onClose: () => void;
  notes: CalendarNote[];
}

/**
 * JSON viewer dialog
 * 
 * Shows calendar notes in formatted JSON.
 * Useful for debugging and understanding the data structure.
 * 
 * @param props - Component props
 * @returns JSON viewer dialog
 */
export function JSONViewer({ open, onClose, notes }: JSONViewerProps) {
  /**
   * Format JSON with indentation
   */
  const formattedJSON = JSON.stringify(notes, null, 2);

  /**
   * Copy JSON to clipboard
   */
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formattedJSON);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Calendar Data (JSON)</Typography>
          <Typography variant="caption" color="text.secondary">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '60vh',
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'grey.200',
              borderRadius: 1,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.400',
              borderRadius: 1,
              '&:hover': {
                bgcolor: 'grey.500',
              },
            },
          }}
        >
          {formattedJSON}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCopy} variant="outlined">
          Copy to Clipboard
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
