-- Calendar Maker Database Schema
-- Run this in Supabase SQL Editor after creating your project
-- 
-- @author Thomas J McLeish
-- @created 2026-01-09

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Calendar Notes Table
-- Stores all user notes/events
CREATE TABLE IF NOT EXISTS calendar_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT NOT NULL,
  category TEXT,
  color TEXT,
  time TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Configs Table
-- Stores user calendar preferences (future use)
CREATE TABLE IF NOT EXISTS calendar_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Calendar',
  start_date DATE,
  end_date DATE,
  color_scheme JSONB,
  selected_model TEXT DEFAULT 'anthropic/claude-opus-4.5',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_user_date ON calendar_notes(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notes_user_category ON calendar_notes(user_id, category);
CREATE INDEX IF NOT EXISTS idx_configs_user ON calendar_configs(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to calendar_notes
CREATE TRIGGER update_calendar_notes_updated_at
  BEFORE UPDATE ON calendar_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to calendar_configs
CREATE TRIGGER update_calendar_configs_updated_at
  BEFORE UPDATE ON calendar_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Users can only see their own data

ALTER TABLE calendar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_configs ENABLE ROW LEVEL SECURITY;

-- Calendar Notes RLS Policies
CREATE POLICY "Users can view their own notes"
  ON calendar_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON calendar_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON calendar_notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON calendar_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Calendar Configs RLS Policies
CREATE POLICY "Users can view their own configs"
  ON calendar_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own configs"
  ON calendar_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own configs"
  ON calendar_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own configs"
  ON calendar_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON calendar_notes TO authenticated;
GRANT ALL ON calendar_configs TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Calendar Maker schema created successfully!';
  RAISE NOTICE 'Tables: calendar_notes, calendar_configs';
  RAISE NOTICE 'RLS enabled and policies configured';
END $$;
