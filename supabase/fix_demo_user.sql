-- Fix for Demo User (Local Development)
-- 
-- The "Demo User" (ID: 00000000-0000-0000-0000-000000000001) is a synthetic user
-- that does not exist in Supabase's auth.users table.
--
-- To allow this user to store data in Supabase, we must:
-- 1. Relax the foreign key constraint (so we can use an ID that isn't in auth.users)
-- 2. Add an RLS policy to allow reading/writing data for this specific ID

-- 1. Drop the foreign key constraints that require user_id to exist in auth.users
ALTER TABLE calendar_notes 
DROP CONSTRAINT IF EXISTS calendar_notes_user_id_fkey;

ALTER TABLE calendar_configs 
DROP CONSTRAINT IF EXISTS calendar_configs_user_id_fkey;

-- 2. Add policies to allow access to the Demo User
-- Postgres RLS policies are additive (OR logic), so adding this enables access

CREATE POLICY "Allow anon access to demo user data"
ON calendar_notes
FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000001')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

CREATE POLICY "Allow anon access to demo user configs"
ON calendar_configs
FOR ALL
USING (user_id = '00000000-0000-0000-0000-000000000001')
WITH CHECK (user_id = '00000000-0000-0000-0000-000000000001');

-- 3. Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Demo User constraints and policies applied successfully.';
END $$;
