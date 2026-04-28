-- ============================================================================
-- SECURITY AND PERFORMANCE IMPROVEMENTS - CORE (NO CONCURRENT INDEXES)
-- Migration: 001_security_core
-- Date: 2026-04-27
--
-- NOTE: profiles.id is TEXT (not UUID) — auth.uid() must be cast to TEXT
-- in all RLS policy comparisons against profiles.id.
-- ============================================================================

-- ============================================================================
-- SECTION 0: ADD MISSING COLUMNS TO profiles
-- Must run before any view/policy that references these columns.
-- ============================================================================

DO $cols$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE 'profiles.deleted_at added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'banned'
    ) THEN
        ALTER TABLE profiles ADD COLUMN banned BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'profiles.banned added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'ban_reason'
    ) THEN
        ALTER TABLE profiles ADD COLUMN ban_reason TEXT DEFAULT NULL;
        RAISE NOTICE 'profiles.ban_reason added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'banned_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN banned_at TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE 'profiles.banned_at added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'coffee_credits'
    ) THEN
        ALTER TABLE profiles ADD COLUMN coffee_credits INT NOT NULL DEFAULT 2;
        RAISE NOTICE 'profiles.coffee_credits added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trial';
        RAISE NOTICE 'profiles.subscription_status added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'subscription_start'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_start TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE 'profiles.subscription_start added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'subscription_end'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_end TIMESTAMPTZ DEFAULT NULL;
        RAISE NOTICE 'profiles.subscription_end added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'boost_active'
    ) THEN
        ALTER TABLE profiles ADD COLUMN boost_active BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'profiles.boost_active added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'moment_posted'
    ) THEN
        ALTER TABLE matches ADD COLUMN moment_posted BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'matches.moment_posted added';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'matches' AND column_name = 'status'
    ) THEN
        ALTER TABLE matches ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
        RAISE NOTICE 'matches.status added';
    END IF;

END $cols$;

-- ============================================================================
-- SECTION 1: PAYMENT SECURITY (CRITICAL)
-- ============================================================================

DO $pay$
BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
    ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);
    RAISE NOTICE 'Payment unique constraint added';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Payment constraint error: %', SQLERRM;
END $pay$;

-- ============================================================================
-- SECTION 2: ATOMIC PAYMENT FUNCTION (CRITICAL)
-- profiles.id is TEXT so p_user_id is cast to TEXT for the WHERE clause
-- ============================================================================

CREATE OR REPLACE FUNCTION confirm_payment_atomic(
    p_user_id           UUID,
    p_payment_intent_id TEXT,
    p_credits           INT,
    p_amount            DECIMAL,
    p_method            TEXT
) RETURNS INT AS $fn$
DECLARE
    v_new_credits INT;
BEGIN
    INSERT INTO payments (
        user_id, provider_ref, credits, amount,
        payment_method, provider, status, currency, created_at
    ) VALUES (
        p_user_id, p_payment_intent_id, p_credits, p_amount,
        p_method, 'airwallex', 'success', 'HKD', NOW()
    );

    UPDATE profiles
    SET
        coffee_credits      = coffee_credits + p_credits,
        subscription_status = 'active',
        subscription_start  = COALESCE(subscription_start, NOW()),
        updated_at          = NOW()
    WHERE id = p_user_id::text  -- profiles.id is TEXT
    RETURNING coffee_credits INTO v_new_credits;

    RETURN v_new_credits;
EXCEPTION
    WHEN unique_violation THEN
        SELECT coffee_credits INTO v_new_credits
        FROM profiles WHERE id = p_user_id::text;  -- profiles.id is TEXT
        RETURN v_new_credits;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION confirm_payment_atomic IS
'Atomically processes payment and credits user account. Prevents race conditions and double-crediting.';

-- ============================================================================
-- SECTION 3: DASHBOARD MATERIALIZED VIEW
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS dashboard_stats CASCADE;

CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*)                                                                AS total_members,
    COUNT(*) FILTER (WHERE subscription_status = 'active')                 AS active_members,
    COUNT(*) FILTER (WHERE gender = 'male')                                 AS men_count,
    COUNT(*) FILTER (WHERE gender = 'female')                               AS women_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                      AS new_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')  AS new_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS new_month,
    COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
          AND created_at <  DATE_TRUNC('month', CURRENT_DATE)
    )                                                                       AS new_prev_month,
    NOW()                                                                   AS last_refresh
FROM profiles
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_dashboard_stats_refresh ON dashboard_stats (last_refresh);

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $rfn$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$rfn$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON MATERIALIZED VIEW dashboard_stats IS
'Cached dashboard statistics. Refresh every 5 minutes using refresh_dashboard_stats().';

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- All comparisons against profiles.id use auth.uid()::text because
-- profiles.id is TEXT, not UUID.
-- ============================================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;

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

-- profiles.id is TEXT — cast auth.uid() to text
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (deleted_at IS NULL AND banned = false);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid()::text = id);

-- matches: user1_id and user2_id are UUID — no cast needed
CREATE POLICY "Users can view own matches"
    ON matches FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own matches"
    ON matches FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- likes: from_user_id is UUID — no cast needed
CREATE POLICY "Users can view own likes"
    ON likes FOR SELECT
    USING (auth.uid() = from_user_id);

CREATE POLICY "Users can insert own likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own likes"
    ON likes FOR DELETE
    USING (auth.uid() = from_user_id);

-- moments: user_id is UUID — no cast needed
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

-- payments: user_id is UUID — no cast needed
CREATE POLICY "Users can view own payments"
    ON payments FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: ADMIN SETUP
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT        UNIQUE NOT NULL,
    name       TEXT        NOT NULL,
    phone      TEXT,
    role       TEXT        NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin policies on profiles (profiles.id is TEXT — cast auth.uid())
CREATE POLICY "Admin can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
            AND staff.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admin can update all profiles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
            AND staff.role IN ('admin', 'moderator')
        )
    );

-- ============================================================================
-- SECTION 6: AUDIT LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT        NOT NULL,
    record_id  TEXT        NOT NULL,
    action     TEXT        NOT NULL,
    old_data   JSONB,
    new_data   JSONB,
    user_id    UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read audit log"
    ON audit_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (
                SELECT email FROM auth.users WHERE id = auth.uid()
            )
            AND staff.role IN ('admin', 'moderator')
        )
    );

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at   ON audit_log (created_at DESC);

COMMENT ON TABLE audit_log IS 'Audit trail for sensitive operations.';

-- ============================================================================
-- SECTION 7: DATA VALIDATION CONSTRAINTS
-- ============================================================================

DO $constraints$
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_email;
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS non_negative_credits;
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS positive_amount;

    ALTER TABLE profiles ADD CONSTRAINT non_negative_credits
        CHECK (coffee_credits >= 0);

    ALTER TABLE payments ADD CONSTRAINT positive_amount
        CHECK (amount > 0);

    RAISE NOTICE 'Data validation constraints added';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint error: %', SQLERRM;
END $constraints$;

-- ============================================================================
-- SECTION 8: PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION confirm_payment_atomic  TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated;

-- ============================================================================
-- SECTION 9: REFRESH MATERIALIZED VIEW
-- ============================================================================

SELECT refresh_dashboard_stats();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $done$
BEGIN
    RAISE NOTICE 'CORE MIGRATION COMPLETED';
    RAISE NOTICE 'Next: run 002_indexes.sql, 004_boost_match_atomic.sql, 005_fix_admin_rls.sql';
END $done$;
