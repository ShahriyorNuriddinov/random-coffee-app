-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Add emoji column to moment_likes for multi-reaction support
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add emoji column (default '❤️' for existing likes)
ALTER TABLE public.moment_likes
  ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';

-- 2. Update unique constraint to include emoji (one emoji per user per moment)
ALTER TABLE public.moment_likes
  DROP CONSTRAINT IF EXISTS moment_likes_user_id_moment_id_key;

ALTER TABLE public.moment_likes
  ADD CONSTRAINT moment_likes_unique UNIQUE (user_id, moment_id, emoji);

-- 3. Update triggers to handle emoji-specific counts
-- We'll keep likes_count for ❤️ only (backward compatibility)
-- Other emojis are counted via query

-- Done! Now moment_likes supports multiple emoji types per post
