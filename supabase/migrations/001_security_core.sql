-- ============================================================================
-- SECURITY AND PERFORMANCE IMPROVEMENTS - CORE (NO CONCURRENT INDEXES)
-- Migration: 001_security_core
-- Date: 2026-04-27
-- 
-- Run this first, then run 002_indexes.sql separately
-- ============================================================================

-- ============================================================================
-- SECTION 1: PAYMENT SECURITY (CRITICAL)
-- ============================================================================

-- Add unique constraint to prevent payment race conditions
DO $$ 
BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
    ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);
    RAISE NOTICE '✅ Payment unique constraint added';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Payment constraint error: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 2: ATOMIC PAYMENT FUNCTION (CRITICAL)
-- ============================================================================

CREATE OR REPLACE FUNCTION confirm_payment_atomic(
    p_user_id UUID,
    p_payment_intent_id TEXT,
    p_credits INT,
    p_amount DECIMAL,
    p_method TEXT
) RETURNS INT AS $$
DECLARE
    v_new_credits INT;
BEGIN
    -- Insert payment (will fail if duplicate due to unique constraint)
    INSERT INTO payments (user_id, provider_ref, credits, amount, payment_method, provider, status, currency, created_at)
    VALUES (p_user_id, p_payment_intent_id, p_credits, p_amount, p_method, 'airwallex', 'success', 'HKD', NOW());
    
    -- Atomically increment credits
    UPDATE profiles
    SET 
        coffee_credits = coffee_credits + p_credits,
        subscription_status = 'active',
        subscription_start = COALESCE(subscription_start, NOW()),
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING coffee_credits INTO v_new_credits;
    
    RETURN v_new_credits;
EXCEPTION
    WHEN unique_violation THEN
        -- Payment already processed, return current credits
        SELECT coffee_credits INTO v_new_credits FROM profiles WHERE id = p_user_id;
        RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION confirm_payment_atomic IS 
'Atomically processes payment and credits user account. Prevents race conditions and double-crediting.';

RAISE NOTICE '✅ Atomic payment function created';

-- ============================================================================
-- SECTION 3: DASHBOARD MATERIALIZED VIEW
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS dashboard_stats CASCADE;

CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE subscription_status = 'active') as active_members,
    COUNT(*) FILTER (WHERE gender = 'male') as men_count,
    COUNT(*) FILTER (WHERE gender = 'female') as women_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_month,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' 
                     AND created_at < DATE_TRUNC('month', CURRENT_DATE)) as new_prev_month,
    NOW() as last_refresh
FROM profiles
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_dashboard_stats_refresh ON dashboard_stats (last_refresh);

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON MATERIALIZED VIEW dashboard_stats IS 
'Cached dashboard statistics. Refresh every 5 minutes using refresh_dashboard_stats().';

RAISE NOTICE '✅ Dashboard materialized view created';

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Approved moments are viewable by everyone" ON moments;
DROP POLICY IF EXISTS "Users can insert own moments" ON moments;
DROP POLICY IF EXISTS "Users can update own moments" ON moments;
DROP POLICY IF EXISTS "Users can delete own moments" ON moments;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
    ON profiles FOR SELECT 
    USING (deleted_at IS NULL AND banned = false);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Matches policies
CREATE POLICY "Users can view own matches" 
    ON matches FOR SELECT 
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update own matches" 
    ON matches FOR UPDATE 
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Likes policies
CREATE POLICY "Users can view own likes" 
    ON likes FOR SELECT 
    USING (auth.uid() = from_user_id);

CREATE POLICY "Users can insert own likes" 
    ON likes FOR INSERT 
    WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own likes" 
    ON likes FOR DELETE 
    USING (auth.uid() = from_user_id);

-- Moments policies
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

-- Payments policies
CREATE POLICY "Users can view own payments" 
    ON payments FOR SELECT 
    USING (auth.uid() = user_id);

RAISE NOTICE '✅ RLS policies created';

-- ============================================================================
-- SECTION 5: ADMIN SETUP
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'admin',
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
            AND staff.role = 'admin'
        )
    );

CREATE POLICY "Admin can update all profiles" 
    ON profiles FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff 
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
            AND staff.role = 'admin'
        )
    );

RAISE NOTICE '✅ Admin setup complete';

-- ============================================================================
-- SECTION 6: AUDIT LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

COMMENT ON TABLE audit_log IS 'Audit trail for sensitive operations.';

RAISE NOTICE '✅ Audit logging setup complete';

-- ============================================================================
-- SECTION 7: DATA VALIDATION
-- ============================================================================

DO $$ 
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_email;
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS non_negative_credits;
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS positive_amount;
    
    ALTER TABLE profiles ADD CONSTRAINT valid_email 
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' OR email IS NULL);
    
    ALTER TABLE profiles ADD CONSTRAINT non_negative_credits 
        CHECK (coffee_credits >= 0);
    
    ALTER TABLE payments ADD CONSTRAINT positive_amount 
        CHECK (amount > 0);
    
    RAISE NOTICE '✅ Data validation constraints added';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Constraint error: %', SQLERRM;
END $$;

-- ============================================================================
-- SECTION 8: PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated;

-- ============================================================================
-- SECTION 9: REFRESH MATERIALIZED VIEW
-- ============================================================================

SELECT refresh_dashboard_stats();

RAISE NOTICE '✅ Materialized view refreshed';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CORE MIGRATION COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run 002_indexes.sql to add performance indexes';
    RAISE NOTICE '2. Test payment flow';
    RAISE NOTICE '3. Verify dashboard loads quickly';
    RAISE NOTICE '4. Check RLS policies are working';
    RAISE NOTICE '';
END $$;
