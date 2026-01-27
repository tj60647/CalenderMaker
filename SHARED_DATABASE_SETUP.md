# One Database, Many Projects: A Practical Pattern for Indie Developers

**Date:** 2026-01-11  
**Author:** Thomas J McLeish with GitHub Copilot + ChatGPT 5.2 + Claude Sonnet 4.5 
**Topic:** How to efficiently host multiple web apps on a single database.

---

## 1. The Core Concept (The "Why")

As an indie developer, you often build small prototypes or "Micro-SaaS" apps. Running a dedicated database server for each one (even the typical monthly paid tiers) adds up quickly.

We want to use **one managed database project** to power **multiple different projects**.

### The Metaphor: The Office Building
Think of your Supabase Project as a collaborative working space (a large office building).
*   **The Building (Supabase Project):** You pay rent for the whole building once.
*   **The Tenants (Your Apps):** Example: *CalendarMaker*, *ToDoApp*, *AI-Writer*.
*   **The Challenge:** You don't want the *CalendarMaker* employees accidentally walking into the *AI-Writer* offices and messing up their paperwork.

This guide explains how to put "signs on the doors" (Prefixes) so everyone knows where they belong, without paying for three separate buildings.

---

## 2. The Strategy: "The Name Tag Rule" (Prefixing)

The simplest, most robust way to keep your data organized is to use **short but mnemonic prefixes (2-5 characters)** for your tables.

**Do not** name your tables generic things like:
*   ❌ `users`
*   ❌ `settings`
*   ❌ `notes`

If you have two apps, they will fight over who owns the `notes` table.

**Do** name your tables with a short project code:
*   ✅ `cm_notes` (CalendarMaker Notes)
*   ✅ `td_items` (ToDo App Items)
*   ✅ `ai_prompts` (AI Writer Prompts)

**Tip:** Keep a simple "Prefix Registry" to avoid confusion (e.g., in a `PREFIXES.md` file in your root or shared notes):
*   `cm_` = Calendar Maker
*   `td_` = ToDo App
*   `ai_` = AI Writer
*   `rs_` = Recipe Saver

This way, they can all live happily in the same list without conflicting.

> **Scaling Note:** This "Prefix Strategy" optimizes for speed and simplicity. It is perfect for indie hackers and prototypes. If a project grows into a standalone product with its own team, consider moving it to its own Supabase project or using **PostgreSQL Schemas** (e.g., `calendar.notes`, `todo.tasks`) for better isolation.
>
> **When NOT to do this:** Avoid this strategy for regulated/sensitive data or where contractual separation is required (e.g., HIPAA workloads, strict tenant isolation commitments).

---

## 3. How to Set It Up (Step-by-Step)

### Step A: Create the Database
1.  Go to Supabase.com and create **one** project.
2.  Name it something generic for your studio, e.g., `tj-studio-db` or `prototypes-db`.
3.  Do **not** name it `calendar-maker-db` (because next week you might add a To-Do app to it!).

### Step B: Connect Vercel (The Hosting)
When deploying your app on Vercel:
1.  Go to your Project Settings.
2.  Use the "Storage" or "Supabase Integration" tab.
3.  Connect to your `tj-studio-db`.
4.  **Important:** When asked for a "Custom Prefix" for environment variables, **LEAVE IT BLANK**.
    *   Vercel creates separate, isolated environment variables (`NEXT_PUBLIC_SUPABASE_URL`) for *each* Vercel project, even if they connect to the same Supabase project.
    *   The isolation handles itself at the Vercel level.
5.  **Crucial:** This gives your app the Supabase URL and anon key. Each app stores its own copy of these environment variables, but they all point to the same Supabase project.

### Step C: Create Your Tables (The Setup)
In the Supabase SQL Editor or Table Editor:
1.  Create a table named `cm_notes` (using our `cm` prefix for CalendarMaker).
2.  Add your columns (`id`, `user_id`, `date`, `notes`, etc.).
3.  **Repeat** this process whenever you start a *new* project, just using a different prefix (e.g., `td_items`).

---

## 4. The Shared User Situation (Important!)

Supabase has a built-in user management system (Auth). There is **only one User List** for the entire database.

*   If I sign up for *CalendarMaker* with `bob@test.com`, Bob is effectively a user in your database.
*   If Bob later visits your *ToDoApp*, his login `bob@test.com` **already exists**.

### Is this bad?
Not necessarily! This is actually a feature called "Single Sign-On" (SSO). It allows you to build an ecosystem of apps where one account works everywhere (like Google: one account for Gmail, Drive, and YouTube).

### But I want them separate!
Even if the user *account* is shared, the **data** is not.
*   CalendarMaker looks for data in `cm_notes` belonging to Bob.
*   ToDoApp looks for data in `td_items` belonging to Bob.

If Bob logs into ToDoApp, the app will ask the database: *"Give me Bob's items from `td_items`"*. The database will return nothing (an empty list), because Bob only created notes in the Calendar app. To Bob, it looks like a brand new account.

---

## 5. Security: The "Keycard" (Row Level Security)

Even though all apps live in the same building, we need to ensure users can only access their own data.

### A Note on Isolation (Social vs. Technical)
**Isolation is enforced by RLS and convention, not separate credentials.** 
Since all apps share the same API keys, 'App A' technically *could* query 'App B' tables. We rely on:
1.  **Convention:** Apps only query tables with their matching prefix.
2.  **RLS:** Ensuring users only see their own data regardless of which app sends the query.

> **CRITICAL SECURITY WARNING:** Since the anon key is shared, an attacker who extracts the key from one app could theoretically query tables from other apps. **RLS is your PRIMARY defense.** If your RLS policies are weak or missing, your data is exposed across apps. Ensure every table has strict `auth.uid() = user_id` checks, and follow defense-in-depth practices: proper table isolation, no cross-app foreign keys, and code-level validation.

> **CRITICAL WARNING:** The "Anon" key is safe for browsers because it respects RLS. The **"Service Role" key bypasses all RLS** and has full access to everything. **NEVER** expose the Service Role key to the client/browser. In a shared database, a leaked Service Role key compromises *all* your projects at once.

### The RLS Policies
Every table needs policies for **all operations** (Select, Insert, Update, Delete), otherwise users will hit confusing errors.

**Implementation Tip:** Populate `user_id` from the authenticated user context (`auth.uid()` on the database side; on the app side, use the current authenticated user’s ID from the session object), NOT from client-supplied arbitrary values.

In Supabase SQL:
```sql
-- 1. Enable RLS
alter table cm_notes enable row level security;

-- 2. Create policies for all actions (Basic Pattern)
-- Tip: 'to authenticated' restricts this to logged-in users
create policy "Users can select own notes" on cm_notes 
  for select to authenticated
  using ( auth.uid() = user_id );

create policy "Users can insert own notes" on cm_notes 
  for insert to authenticated
  with check ( auth.uid() = user_id );

create policy "Users can update own notes" on cm_notes 
  for update to authenticated
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Users can delete own notes" on cm_notes 
  for delete to authenticated
  using ( auth.uid() = user_id );
```

This ensures full CRUD (Create, Read, Update, Delete) protection based on the user's ID.

> **Performance Tip:** Add an index on `user_id` for every table, since almost every query will filter by it.
> ```sql
> create index if not exists cm_notes_user_id_idx on cm_notes (user_id);
> ```

---

## 6. Operational Considerations (The Reality)

Sharing resources means sharing limits.
*   **Connection Limits:** Supabase free tier has connection limits (~60). Connection pooling is shared across all apps.
*   **Resource Contention:** Heavy queries in *AI-Writer* will slow down *CalendarMaker*.
*   **Debugging Noise:** Logs will mix data from multiple apps. Prefix your log entries if possible.
*   **Auth User Metadata:** Be careful with `user_metadata`. If *CalendarMaker* sets `{ theme: 'dark' }` and *ToDoApp* sets `{ theme: 'light' }`, they might overwrite each other. Use namespaced keys in metadata: `{ cm_theme: 'dark', td_theme: 'light' }`.

## 7. Maintenance & Migrations (Growing Pains)

Since multiple apps share the database, you must be careful with changes.
*   **Shared Failure Modes:** Because the blast radius is shared, set up backups and treat migrations as production changes, even for prototypes.
*   **Cautious Schema Changes:** Altering global settings or shared resources affects all apps.
*   **Versioned Migrations:** Keep your SQL scripts in version control (e.g., `supabase/migrations/`).
*   **Discipline:** Ensure your migration scripts ONLY touch tables with your specific prefix.
*   **Shared Extensions:** Postgres extensions (like `pgvector`) are project-wide; enable them deliberately.
*   **Shared Resources:** Don't forget to namespace other Supabase resources too!
    *   **Storage Buckets:** `cm-avatars`, `td-uploads`
    *   **Edge Functions:** `cm-process-invite`, `td-send-reminder`

## 8. When to Abandon This Strategy (Red Flags)

Stop using shared databases if you observe:
*   One app consuming >70% of database resources
*   Regulatory requirements for data separation (HIPAA, etc.)
*   Different teams managing different apps
*   Need for independent backup schedules or disaster recovery plans

---

## 9. Example: Configuring Calendar Maker

Here is how we configured this project to follow these rules.

**1. The Table Name**
We decided on the prefix `cm_` (Calendar Maker).
*   Table Name: `cm_notes`

**2. The App Code (`lib/repositories/index.ts`)**
We tell the application exactly which table to look for.

```typescript
// INSTEAD OF THIS (Generic):
return new SupabaseRepository<CalendarNote>('notes');

// WE DO THIS (Specific):
return new SupabaseRepository<CalendarNote>('cm_notes');
```

**3. The Deployment**
*   We deploy to Vercel.
*   We connect it to our `prototypes-db`.
*   The app spins up, connects to the database, and specifically asks for `cm_notes`.

---

## 10. Summary Checklist for New Projects

When you start your *next* project (e.g., "RecipeSaver"):

1.  [ ] **Do NOT** create a new Supabase project. Use the existing one.
2.  [ ] **Connect** the new Vercel project to the existing Supabase project.
3.  [ ] **Pick a Prefix**, e.g., `rs_` (RecipeSaver).
4.  [ ] **Create Tables** like `rs_recipes`, `rs_ingredients`.
5.  [ ] **Update Code** to point to `rs_recipes`.
6.  [ ] **Enable RLS** on the new tables.

You just saved significant monthly costs and hours of maintenance time!
