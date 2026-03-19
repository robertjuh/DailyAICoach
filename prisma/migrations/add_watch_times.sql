-- Add watch time preferences to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS first_watch_time TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS night_watch_time TEXT;
