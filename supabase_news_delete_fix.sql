-- Fix: ensure news table has proper delete policy
-- Run this in Supabase SQL Editor if delete still fails

-- Option 1: Refresh existing policy (already covers DELETE via FOR ALL)
DROP POLICY IF EXISTS "news_auth_write" ON news;
CREATE POLICY "news_auth_write" ON news
  FOR ALL
  USING (is_staff())
  WITH CHECK (is_staff());

-- Option 2: Add moment_id column to news if not exists
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID REFERENCES moments(id) ON DELETE SET NULL;

-- Option 3: If is_staff() check fails, verify the function works
-- SELECT is_staff(); -- run as logged-in admin user to test
