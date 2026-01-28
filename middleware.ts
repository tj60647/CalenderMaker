import { withAuth } from "next-auth/middleware";

/**
 * Middleware for Route Protection
 * 
 * This middleware protects the entire application by default.
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
  // - auth/signin (Login page)
  // - _next (Next.js internals)
  // - static files (images, etc)
  matcher: [
    "/((?!api/auth|auth/signin|_next|.*\\..*).*)",
  ],
};
