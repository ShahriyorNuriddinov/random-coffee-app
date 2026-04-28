-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Run this AFTER 002_performance_indexes.sql
-- NOTE: profiles.id is TEXT — auth.uid() must be cast to ::text
-- ============================================================================

-- ── Step 0: ensure columns exist before any policy references them ───────────
DO $cols$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'banned'
    ) THEN
        ALTER TABLE profiles ADD COLUMN banned BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $cols$;

-- ── Step 1: enable RLS ───────────────────────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;

-- ── Step 2: drop old policies (idempotent) ───────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone"  ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"              ON profiles;
DROP POLICY IF EXISTS "Users can view own matches"                ON matches;
DROP POLICY IF EXISTS "Users can update own matches"              ON matches;
DROP POLICY IF EXISTS "Users can view own likes"                  ON likes;
DROP POLICY IF EXISTS "Users can insert own likes"                ON likes;
DROP POLICY IF EXISTS "Users can delete own likes"                ON likes;
DROP POLICY IF EXISTS "Approved moments are viewable by everyone" ON moments;
DROP POLICY IF EXISTS "Users can insert own moments"              ON moments;
DROP POLICY IF EXISTS "Users can update own moments"              ON moments;
DROP POLICY IF EXISTS "Users can delete own moments"              ON moments;
DROP POLICY IF EXISTS "Users can view own payments"               ON payments;
DROP POLICY IF EXISTS "Admin can read all profiles"               ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles"             ON profiles;

-- ── Step 3: profiles (id is TEXT — cast auth.uid()) ──────────────────────────
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (deleted_at IS NULL AND banned = false);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid()::text = id);

-- ── Step 4: matches (user1_id / user2_id are UUID — no cast) ─────────────────
CREATE POLICY "Users can view own matches"
    ON matches FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own matches"
    ON matches FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ── Step 5: likes (from_user_id is UUID — no cast) ───────────────────────────
CREATE POLICY "Users can view own likes"
    ON likes FOR SELECT
    USING (auth.uid() = from_user_id);

CREATE POLICY "Users can insert own likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own likes"
    ON likes FOR DELETE
    USING (auth.uid() = from_user_id);

-- ── Step 6: moments (user_id is UUID — no cast) ──────────────────────────────
CREATE POLICY "Approved moments are viewable by everyone"
    ON moments FOR SELECT
    USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own moments"
    ON moments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moments"
    ON moments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moments"
    ON moments FOR DELETE
    USING (auth.uid() = user_id);

-- ── Step 7: payments (user_id is UUID — no cast) ─────────────────────────────
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- ── Step 8: admin policies ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT        UNIQUE NOT NULL,
    name       TEXT        NOT NULL,
    phone      TEXT,
    role       TEXT        NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE POLICY "Admin can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
              AND staff.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admin can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
              AND staff.role IN ('admin', 'moderator')
        )
    );
