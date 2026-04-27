-- Fix: news delete + moments admin delete policy
-- Run this in Supabase SQL Editor

-- 1. Add moment_id column to news if not exists
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID;

-- 2. Refresh news write policy
DROP POLICY IF EXISTS "news_auth_write" ON news;
CREATE POLICY "news_auth_write" ON news
  FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- 3. Allow staff to delete any moment (admin posts have is_admin_post=true)
DROP POLICY IF EXISTS "moments_delete_staff" ON moments;
CREATE POLICY "moments_delete_staff" ON moments
  FOR DELETE
  USING (auth.uid()::text = user_id::text OR is_staff());

-- 4. Allow staff to update any moment
DROP POLICY IF EXISTS "moments_update_staff" ON moments;
CREATE POLICY "moments_update_staff" ON moments
  FOR UPDATE
  USING (auth.uid()::text = user_id::text OR is_staff());
