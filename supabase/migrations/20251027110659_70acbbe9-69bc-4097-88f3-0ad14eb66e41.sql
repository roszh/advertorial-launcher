-- Add headline column to pages table
ALTER TABLE pages ADD COLUMN IF NOT EXISTS headline TEXT;