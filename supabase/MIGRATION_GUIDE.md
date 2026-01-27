# Supabase Migration Guide (Shared Database Setup)

**Status:** ✅ Code ready for Shared Database (`ai-leads-db`)

This guide is optimized for the **"One Database, Many Projects"** pattern described in `SHARED_DATABASE_SETUP.md`.

---

## 1. Connect Vercel (Critical Step)

You are connecting your `calendar-maker` Vercel project to your existing shared database (`ai-leads-db`).

### ⚠️ IMPORTANT: Vercel "Custom Prefix" Setting
In the Vercel "Configure calendar-maker" screen (the screenshot you are looking at):

1.  **Select Database:** Choose `ai-leads-db`.
2.  **Environments:** Keep Production, Preview, and Development checked.
3.  **Custom Prefix:** ⛔ **LEAVE THIS BLANK**.
    *   **Decision Record: Why "Blank" is the Best Strategy**
        *   You might be tempted to use a prefix (e.g., "CALENDAR") to "organize" your Vercel variables. **Do not do this.**
        *   **Standardization:** The entire React/Next.js ecosystem and the Supabase JavaScript library default to looking for `NEXT_PUBLIC_SUPABASE_URL`.
        *   **Client Exposure:** Vercel automatically exposes `NEXT_PUBLIC_` variables to the browser. If you use a prefix (creating `CALENDAR_URL`), these become **Server-Only secrets**.
        *   **Complexity:** Using a prefix would force us to add "glue code" in `next.config.ts` to map server secrets to public variables. This is an unnecessary "Anti-Pattern" that increases maintenance debt and creates differences between your local and production environments.
        *   **Conclusion:** The robust, "Best Practice" engineering decision is to use Table Prefixes (for Data) but Standard Environment Variables (for Config).

---

## 2. Initialize Database Schema

Since we are sharing `ai-leads-db`, we must use "Prefixing" to avoid conflicts with your other apps.

1.  Go to your **Supabase Dashboard** > **SQL Editor**.
2.  Make sure you are in the `ai-leads-db` project.
3.  Click **"New Query"**.
4.  Copy/paste the contents of `supabase/schema.sql`.
5.  **Check the Prefix:** Notice all tables start with `calendar_` (e.g., `calendar_notes`, `calendar_configs`).
    *   This ensures `calendar-maker` data never mixes with other apps in this database.
6.  Click **Run**.

---

## 3. Local Development Setup

Now that Vercel is connected, you need these keys locally to run `npm run dev`.

### Option A: Pull from Vercel (Easiest)
If you have the Vercel CLI installed:
```bash
vercel env pull .env.local
```

### Option B: Manual Copy
1.  Go to your **Supabase Dashboard** > **Settings** > **API**.
2.  Copy the credentials into your `.env.local` file:

```env
# URL for the shared database
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Anon Key (Safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Service Role Key (NEVER share this, likely not needed for this app yet)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 4. Migration Checklist

### Verify Connection
1.  Restart your dev server: `npm run dev`.
2.  Open the browser console.
3.  Look for: `[Repository] Using Supabase backend`.

### Verify Data Isolation
1.  Create a note in your app.
2.  Go to Supabase Table Editor.
3.  Check the `calendar_notes` table.
4.  Ensure you can see the data.
5.  (Optional) If you have other tables (e.g. `todo_items`), ensure they are untouched.

---

## FAQ

**Q: Why didn't we create a new project?**
A: To save money and maintenance time. We prefer "Logical Isolation" (prefixes) over "Physical Isolation" (separate DBs) for indie projects.

**Q: Is `calendar_` a good prefix?**
A: Yes. It is descriptive and unlikely to clash. `SHARED_DATABASE_SETUP.md` suggests short ones like `cm_`, but `calendar_` is perfectly fine and clearer.
