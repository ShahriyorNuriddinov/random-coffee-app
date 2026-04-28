-- ============================================================================
-- CRITICAL SECURITY FIXES
-- Run this first - contains payment security and atomic functions
-- NOTE: profiles.id is TEXT — UUID params must be cast to ::text
-- ============================================================================

-- ── 0. Add missing columns before anything references them ───────────────────
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

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'coffee_credits'
    ) THEN
        ALTER TABLE profiles ADD COLUMN coffee_credits INT NOT NULL DEFAULT 2;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trial';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'profiles' AND column_name = 'subscription_start'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_start TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $cols$;

-- ── 1. Payment unique constraint ─────────────────────────────────────────────
DO $pay$
BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
    ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Payment constraint error: %', SQLERRM;
END $pay$;

-- ── 2. Atomic payment function ───────────────────────────────────────────────
-- profiles.id is TEXT so p_user_id (UUID) is cast to ::text in WHERE clauses
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
    WHERE id = p_user_id::text
    RETURNING coffee_credits INTO v_new_credits;

    RETURN v_new_credits;
EXCEPTION
    WHEN unique_violation THEN
        SELECT coffee_credits INTO v_new_credits
        FROM profiles WHERE id = p_user_id::text;
        RETURN v_new_credits;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Dashboard materialized view ───────────────────────────────────────────
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

-- ── 4. Staff table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email      TEXT        UNIQUE NOT NULL,
    name       TEXT        NOT NULL,
    phone      TEXT,
    role       TEXT        NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Audit log table ───────────────────────────────────────────────────────
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

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at   ON audit_log (created_at DESC);

-- ── 6. Data validation constraints ───────────────────────────────────────────
DO $constraints$
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS non_negative_credits;
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS positive_amount;

    ALTER TABLE profiles ADD CONSTRAINT non_negative_credits
        CHECK (coffee_credits >= 0);

    ALTER TABLE payments ADD CONSTRAINT positive_amount
        CHECK (amount > 0);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $constraints$;

-- ── 7. Permissions ───────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION confirm_payment_atomic  TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated;

-- ── 8. Refresh stats ─────────────────────────────────────────────────────────
SELECT refresh_dashboard_stats();
