-- ============================================================================
-- PERFORMANCE INDEXES - Run these ONE BY ONE in psql or Supabase SQL Editor
-- DO NOT run all at once!
-- ============================================================================

-- Copy and paste each line separately:

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_region ON profiles(region);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_banned ON profiles(banned) WHERE banned = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_composite ON matches(user1_id, user2_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moment_likes_moment ON moment_likes(moment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_moment_likes_user ON moment_likes(user_id, moment_id);

-- Full-text search (optional, for better search performance):
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_search 
    ON profiles USING gin(to_tsvector('english', 
        coalesce(name,'') || ' ' || coalesce(about,'') || ' ' || coalesce(region,'')
    ));
