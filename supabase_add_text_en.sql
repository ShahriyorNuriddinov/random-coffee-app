-- Add bilingual translation columns to moments table
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_en text;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_zh text;

-- Add status column to matches table for tracking meeting completion
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at timestamptz;
