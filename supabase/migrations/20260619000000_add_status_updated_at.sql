-- Migration: Add status_updated_at column to pantry_items table
ALTER TABLE pantry_items ADD COLUMN IF NOT EXISTS status_updated_at timestamptz DEFAULT now();
