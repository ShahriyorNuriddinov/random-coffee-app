-- ============================================================================
-- ADD MOMENT POSTED TRACKING TO MATCHES TABLE
-- This prevents users from posting multiple moments for the same meeting
-- ============================================================================

-- Add moment_posted column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS moment_posted BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_moment_posted ON matches(moment_posted);

-- Update existing completed matches (optional - set to false by default)
UPDATE matches 
SET moment_posted = FALSE 
WHERE moment_posted IS NULL;

-- DONE!
-- Now when a user posts a moment about a meeting, set moment_posted = TRUE
-- This will disable the "Write a Post" button for that meeting
