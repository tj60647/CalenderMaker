-- Add summary column to calendar_notes
-- 
-- This allows for a short display version of the note/event
-- useful for month views or crowded calendar grids.

ALTER TABLE calendar_notes 
ADD COLUMN IF NOT EXISTS summary TEXT;

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Added summary column to calendar_notes';
END $$;
