/**
 * Update Password Page
 * 
 * Destination for the "Forgot Password" email link.
 * Allows logged-in users (via magic link) to set a new password.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-28
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  /**
   * Check if we have a valid session
   * The magic link logs the user in automatically.
   */
  useEffect(() => {
    supabase.auth.getSession().then((response: any) => {
      if (!response.data.session) {
        setMessage({
          type: 'error',
          text: 'Invalid or expired reset link. Please try "Forgot Password" again.',
        });
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting...',
      });

      setTimeout(() => {
        router.push('/auth/signin');
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update password.',
      });
      setIsLoading(false);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Image
              src="/icon.svg"
              alt="TimeTwin Icon"
              width={64}
              height={64}
              priority
            />
          </Box>

          <Typography variant="h5" component="h1" gutterBottom align="center">
            Set New Password
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoFocus
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3 }}
            >
              {isLoading ? 'Update Password' : 'Update Password'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
