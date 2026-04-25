-- ═══════════════════════════════════════════════════════════════════════════
-- Add Chinese translation columns to profiles table
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS about_zh TEXT,
    ADD COLUMN IF NOT EXISTS gives_zh TEXT,
    ADD COLUMN IF NOT EXISTS wants_zh TEXT;

-- Verify
SELECT id, name, about, about_zh FROM public.profiles LIMIT 3;
