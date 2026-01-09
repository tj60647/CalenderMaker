/**
 * Home Page
 * 
 * Main landing page for the AI Calendar Generator. Displays the calendar
 * interface and chat panel for interacting with AI.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Container, Typography, Button, CircularProgress, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Download, FileJson } from 'lucide-react';
import { Calendar } from '@/components/calendar/Calendar';
import { DateDetailPanel } from '@/components/calendar/DateDetailPanel';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { JSONViewer } from '@/components/calendar/JSONViewer';
import { CalendarNote, ColorScheme } from '@/types';
import { notesRepo } from '@/lib/repositories';
import { exportCalendarAsSVG, exportCalendarAsPNG } from '@/lib/export-utils';

/**
 * Default color scheme
 * 
 * This can be customized by users in a future enhancement.
 * For now, we use a simple blue-based palette.
 */
const DEFAULT_COLOR_SCHEME: ColorScheme = {
  default: '#3b82f6',
  weekend: '#e0e7ff',
  month1: '#f3f4f6',
  month2: '#fef3c7',
  outOfRange: '#f9fafb',
  specialDates: {},
  categories: {
    work: '#ef4444',
    personal: '#10b981',
    meeting: '#f59e0b',
    deadline: '#dc2626',
    event: '#8b5cf6',
  },
};

/**
 * Home page component
 * 
 * Main application view with calendar and detail panel.
 * Requires authentication - redirects to sign-in if not logged in.
 */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Selected date and notes state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false);
  
  // Export date range
  const [exportStartDate, setExportStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [exportEndDate, setExportEndDate] = useState<string>(() => {
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    return oneMonthLater.toISOString().split('T')[0];
  });

  /**
   * Redirect to sign-in if not authenticated
   */
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  /**
   * Load notes when user logs in
   */
  useEffect(() => {
    async function loadNotes() {
      if (session?.user?.id) {
        try {
          const userNotes = await notesRepo.getAll(session.user.id);
          setNotes(userNotes);
        } catch (error) {
          console.error('Failed to load notes:', error);
        }
      }
    }

    loadNotes();
  }, [session?.user?.id]);

  /**
   * Refresh notes after changes
   * 
   * Called by DateDetailPanel after create/update/delete operations.
   */
  async function handleNotesChange() {
    if (session?.user?.id) {
      try {
        const userNotes = await notesRepo.getAll(session.user.id);
        setNotes(userNotes);
      } catch (error) {
        console.error('Failed to refresh notes:', error);
      }
    }
  }

  /**
   * Handle user sign out
   */
  async function handleSignOut() {
    await signOut({ callbackUrl: '/auth/signin' });
  }

  /**
   * Export calendar as SVG
   */
  function handleExportSVG() {
    const startDate = new Date(exportStartDate);
    const endDate = new Date(exportEndDate);
    exportCalendarAsSVG(startDate, endDate, notes, DEFAULT_COLOR_SCHEME);
  }

  /**
   * Export calendar as PNG
   */
  function handleExportPNG() {
    const startDate = new Date(exportStartDate);
    const endDate = new Date(exportEndDate);
    exportCalendarAsPNG(startDate, endDate, notes, DEFAULT_COLOR_SCHEME);
  }

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Don't render until authenticated
  if (!session?.user?.id) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ minHeight: '100vh', py: 4, bgcolor: 'grey.50' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Image
              src="/icon.svg"
              alt="AI Calendar Generator Icon"
              width={48}
              height={48}
              priority
            />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                AI Calendar Generator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Welcome, {session.user.name}
              </Typography>
            </Box>
          </Box>

          <Button variant="outlined" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Box>

        {/* Main layout: Calendar and Chat side by side */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Left side: Calendar section */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Export controls */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                flexWrap: 'wrap',
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Export Calendar:
              </Typography>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Start Date</InputLabel>
                <Select
                  value={exportStartDate}
                  label="Start Date"
                  onChange={(e) => setExportStartDate(e.target.value)}
                >
                  {/* Generate last 3 months and next 3 months as options */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 3 + i);
                    date.setDate(1);
                    const dateStr = date.toISOString().split('T')[0];
                    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <MenuItem key={dateStr} value={dateStr}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>End Date</InputLabel>
                <Select
                  value={exportEndDate}
                  label="End Date"
                  onChange={(e) => setExportEndDate(e.target.value)}
                >
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 3 + i);
                    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    const dateStr = lastDay.toISOString().split('T')[0];
                    const label = lastDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    return (
                      <MenuItem key={dateStr} value={dateStr}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleExportSVG}
                startIcon={<Download size={18} />}
                sx={{ ml: 'auto' }}
              >
                Download SVG
              </Button>

              <Button
                variant="contained"
                onClick={handleExportPNG}
                startIcon={<Download size={18} />}
              >
                Download PNG
              </Button>

              <Button
                variant="outlined"
                onClick={() => setJsonViewerOpen(true)}
                startIcon={<FileJson size={18} />}
              >
                View JSON
              </Button>
            </Box>

            {/* Calendar */}
            <Box>
              <Calendar
                userId={session.user.id}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate || undefined}
                colorScheme={DEFAULT_COLOR_SCHEME}
              />
            </Box>

            {/* Date detail panel (shows when date selected) */}
            {selectedDate && (
              <Box>
                <DateDetailPanel
                  dateString={selectedDate}
                  userId={session.user.id}
                  onClose={() => setSelectedDate(null)}
                  onNotesChange={handleNotesChange}
                  colorScheme={DEFAULT_COLOR_SCHEME}
                  allNotes={notes}
                />
              </Box>
            )}
          </Box>

          {/* Right side: Chat interface */}
          <Box sx={{ width: 450, maxWidth: '100%' }}>
            <ChatInterface userId={session.user.id} onCalendarUpdate={handleNotesChange} />
          </Box>
        </Box>

        {/* JSON Viewer Dialog */}
        <JSONViewer
          open={jsonViewerOpen}
          onClose={() => setJsonViewerOpen(false)}
          notes={notes}
        />
      </Box>
    </Container>
  );
}
