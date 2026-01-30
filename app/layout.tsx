/**
 * Root Layout
 * 
 * Main layout component that wraps the entire application.
 * 
 * SERVER COMPONENT
 * Handles:
 * - HTML structure
 * - Metadata (SEO, Favicons)
 * - Initializing Client Providers
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created 2026-01-08
 */

import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "TimeTwin",
  description: "Your AI calendar assistant and twin",
};

/**
 * Root layout component
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
