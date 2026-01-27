/**
 * Clock Component
 * 
 * Displays current date and time.
 * Updates every second.
 * 
 * @author GitHub Copilot
 */
'use client';

import { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';

export function Clock() {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    setDate(new Date());
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!date) return null; // Prevent hydration mismatch

  return (
    <Box sx={{ textAlign: 'center', mx: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
        {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
      </Typography>
    </Box>
  );
}
