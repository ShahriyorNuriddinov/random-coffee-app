-- ============================================================================
-- ADD RUSSIAN TRANSLATION COLUMNS TO PROFILES
-- Migration: ADD_RUSSIAN_TRANSLATIONS
-- Date: 2026-04-28
-- Description: Add Russian translation columns for profile fields
-- ============================================================================

-- Add Russian translation columns to profiles table
DO $$ 
BEGIN
    -- Add about_ru column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'about_ru'
    ) THEN
        ALTER TABLE profiles ADD COLUMN about_ru TEXT;
        RAISE NOTICE '✅ Added about_ru column';
    ELSE
        RAISE NOTICE 'ℹ️  about_ru column already exists';
    END IF;

    -- Add gives_ru column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'gives_ru'
    ) THEN
        ALTER TABLE profiles ADD COLUMN gives_ru TEXT;
        RAISE NOTICE '✅ Added gives_ru column';
    ELSE
        RAISE NOTICE 'ℹ️  gives_ru column already exists';
    END IF;

    -- Add wants_ru column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'wants_ru'
    ) THEN
        ALTER TABLE profiles ADD COLUMN wants_ru TEXT;
        RAISE NOTICE '✅ Added wants_ru column';
    ELSE
        RAISE NOTICE 'ℹ️  wants_ru column already exists';
    END IF;

END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RUSSIAN TRANSLATIONS MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Added columns:';
    RAISE NOTICE '- profiles.about_ru';
    RAISE NOTICE '- profiles.gives_ru';
    RAISE NOTICE '- profiles.wants_ru';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Users can now save Russian translations';
    RAISE NOTICE '2. AI will translate to Russian when needed';
    RAISE NOTICE '3. Russian-speaking users will see content in their language';
    RAISE NOTICE '';
END $;
