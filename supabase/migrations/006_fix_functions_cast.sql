-- ============================================================================
-- FIX DEPLOYED FUNCTIONS: profiles.id is TEXT, UUID params need ::text cast
-- Run this in Supabase SQL Editor to fix the "operator does not exist: uuid = text" error
-- ============================================================================

-- ── confirm_payment_atomic ───────────────────────────────────────────────────
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
    SET coffee_credits      = coffee_credits + p_credits,
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

-- ── increment_credits ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_credits(p_user_id UUID, p_credits INT)
RETURNS INT AS $fn$
DECLARE
    new_credits INT;
BEGIN
    UPDATE profiles
    SET coffee_credits      = coffee_credits + p_credits,
        subscription_status = 'active',
        subscription_start  = COALESCE(subscription_start, NOW()),
        updated_at          = NOW()
    WHERE id = p_user_id::text
    RETURNING coffee_credits INTO new_credits;

    RETURN new_credits;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── create_boost_match ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_boost_match(
    p_user_id    UUID,
    p_partner_id UUID
) RETURNS UUID AS $fn$
DECLARE
    v_u1       UUID;
    v_u2       UUID;
    v_match_id UUID;
BEGIN
    v_u1 := LEAST(p_user_id, p_partner_id);
    v_u2 := GREATEST(p_user_id, p_partner_id);

    UPDATE profiles
    SET coffee_credits = coffee_credits - 1,
        updated_at     = NOW()
    WHERE id = p_user_id::text
      AND coffee_credits > 0;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_credits';
    END IF;

    INSERT INTO matches (user1_id, user2_id)
    VALUES (v_u1, v_u2)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_match_id;

    RETURN v_match_id;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── RLS: profiles.id is TEXT so auth.uid()::text = id ────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"             ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles"              ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles"            ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (
        (deleted_at IS NULL OR deleted_at > NOW())
        AND (banned IS NULL OR banned = false)
    );

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid()::text = id);

CREATE POLICY "Admin can read all profiles"
    ON profiles FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
              AND staff.role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Admin can update all profiles"
    ON profiles FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE staff.email = (SELECT email FROM auth.users WHERE id = auth.uid())
              AND staff.role IN ('admin', 'moderator')
        )
    );

-- ── Grants ───────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION increment_credits      TO authenticated;
GRANT EXECUTE ON FUNCTION create_boost_match     TO authenticated;
