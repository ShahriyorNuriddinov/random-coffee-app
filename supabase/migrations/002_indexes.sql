-- ============================================================================
-- PERFORMANCE INDEXES
-- Migration: 002_indexes
-- NOTE: CONCURRENTLY removed — Supabase SQL editor runs inside a transaction.
--       Plain CREATE INDEX IF NOT EXISTS is used instead (safe to re-run).
-- ============================================================================

-- PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status
    ON profiles(subscription_status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_created_at
    ON profiles(created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_region
    ON profiles(region) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_banned
    ON profiles(banned) WHERE banned = true;

CREATE INDEX IF NOT EXISTS idx_profiles_email
    ON profiles(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_search
    ON profiles USING gin(
        to_tsvector('english',
            coalesce(name,'') || ' ' || coalesce(about,'') || ' ' || coalesce(region,'')
        )
    ) WHERE deleted_at IS NULL;

-- MATCHES
CREATE INDEX IF NOT EXISTS idx_matches_user1_created
    ON matches(user1_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_user2_created
    ON matches(user2_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_status
    ON matches(status);

CREATE INDEX IF NOT EXISTS idx_matches_composite
    ON matches(user1_id, user2_id, status);

-- MOMENTS
CREATE INDEX IF NOT EXISTS idx_moments_status_created
    ON moments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moments_user_id
    ON moments(user_id);

CREATE INDEX IF NOT EXISTS idx_moments_admin_posts
    ON moments(is_admin_post, status, created_at DESC)
    WHERE is_admin_post = true;

-- PAYMENTS
CREATE INDEX IF NOT EXISTS idx_payments_user_created
    ON payments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_created_at
    ON payments(created_at DESC);

-- LIKES
CREATE INDEX IF NOT EXISTS idx_likes_from_user
    ON likes(from_user_id);

CREATE INDEX IF NOT EXISTS idx_likes_to_user
    ON likes(to_user_id);

CREATE INDEX IF NOT EXISTS idx_likes_mutual
    ON likes(from_user_id, to_user_id);

-- MOMENT LIKES
CREATE INDEX IF NOT EXISTS idx_moment_likes_moment
    ON moment_likes(moment_id);

CREATE INDEX IF NOT EXISTS idx_moment_likes_user
    ON moment_likes(user_id, moment_id);
