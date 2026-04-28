-- Add lang_ru column to app_settings table
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS lang_ru BOOLEAN DEFAULT FALSE;

-- Add notif_seen_at column if missing (used by AdminApp for notification badge)
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS notif_seen_at TIMESTAMPTZ;

-- Add moment_id column to news table if missing (links news post to moments feed)
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID REFERENCES moments(id) ON DELETE SET NULL;

-- Add text_ru column to news table if missing
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_ru TEXT;

-- Add text_en column to news table if missing  
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_en TEXT;
