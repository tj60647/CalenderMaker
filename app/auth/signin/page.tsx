/**
 * Sign In Page
 * 
 * Simple authentication page for demo login.
 * Currently accepts any credentials (demo mode).
 * Will be updated when migrating to Supabase.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Box, Button, Container, TextField, Typography, Paper } from '@mui/material';

/**
 * Sign-in page component
 * 
 * Displays a simple login form. For demo, any credentials work.
 * After successful login, redirects to main calendar page.
 */
export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle form submission
   * 
   * Calls NextAuth signIn with credentials provider.
   * On success, redirects to home page.
   * On error, shows error message.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Attempt to sign in with NextAuth
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false, // Handle redirect manually
      });

      if (result?.error) {
        setError('Invalid credentials');
        setIsLoading(false);
      } else {
        // Success - redirect to home
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An error occurred. Please try again.');
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
              alt="AI Calendar Generator Icon"
              width={64}
              height={64}
              priority
            />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            TimeTwin
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to your account
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Box sx={{ display: 'flex', justifyContent: 'end', mt: 1 }}>
              <Link href="/auth/forgot-password" passHref style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
                  Forgot Password?
                </Typography>
              </Link>
            </Box>

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ mt: 3 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Typography variant="caption" display="block" color="text.secondary" align="center" sx={{ mt: 2 }}>
              Using the Production Database? Enter your real email/password.
              <br/>
              Local Dev/Demo? Use: demo / demo
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
