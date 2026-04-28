-- ============================================================================
-- ADD RUSSIAN TRANSLATION COLUMNS TO PROFILES
-- Migration: ADD_RUSSIAN_TRANSLATIONS
-- Date: 2026-04-28
-- Description: Add Russian translation columns for profile fields
-- ============================================================================

-- Add about_ru column (safe - won't fail if exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_ru TEXT;

-- Add gives_ru column (safe - won't fail if exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_ru TEXT;

-- Add wants_ru column (safe - won't fail if exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_ru TEXT;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Added columns:
-- - profiles.about_ru (Russian translation of "About Me")
-- - profiles.gives_ru (Russian translation of "Can Give")
-- - profiles.wants_ru (Russian translation of "Wants to Get")
--
-- Next steps:
-- 1. Users can now save Russian translations
-- 2. AI will translate to Russian when needed
-- 3. Russian-speaking users will see content in their language
-- ============================================================================
