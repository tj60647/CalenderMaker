import { withAuth } from "next-auth/middleware";

/**
 * Proxy (formerly Middleware) for Route Protection
 * 
 * NOTE: In Next.js 16+, `middleware.ts` was renamed to `proxy.ts`.
 * This file protects the entire application by default.
 * It ensures that only authenticated users can access the pages.
 * 
 * - Matches all routes except /auth/signin and static assets
 * - Redirects unauthenticated users to /auth/signin
 */
export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
});

export const config = {
  // Protect all routes except:
  // - api/auth (NextAuth routes)
  // - auth (Login, Forgot Password, etc)
  // - _next (Next.js internals)
  // - static files (images, etc)
  matcher: [
    "/((?!api/auth|auth|_next|.*\\..*).*)",
  ],
};
