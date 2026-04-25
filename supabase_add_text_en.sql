-- Add bilingual translation columns to moments table
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_en text;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_zh text;
