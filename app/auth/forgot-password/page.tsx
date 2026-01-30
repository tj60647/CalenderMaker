/**
 * Forgot Password Page
 * 
 * Allows users to request a password reset email via Supabase.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-28
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Check for Demo Mode / Missing Supabase
    if (!isSupabaseConfigured()) {
      setMessage({
        type: 'warning',
        text: 'Demo Mode: Forgot Password is disabled. Use demo/demo to log in.',
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Determine the redirect URL (Production vs Local)
      // If NEXT_PUBLIC_APP_URL is set, use it. Otherwise fallback to window.location.origin
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const redirectUrl = `${baseUrl}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Check your email for the password reset link.',
      });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send reset email.',
      });
    } finally {
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
            Reset Password
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter your email to receive a reset link.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? 'Send Reset Link' : 'Send Reset Link'}
            </Button>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link href="/auth/signin" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Back to Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
