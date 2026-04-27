-- ============================================================================
-- SIMPLE CRITICAL FIXES ONLY
-- Run this file directly in Supabase SQL Editor
-- ============================================================================

-- 1. PAYMENT RACE CONDITION FIX (CRITICAL)
-- ============================================================================

-- Add unique constraint
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS unique_provider_ref;

ALTER TABLE payments 
ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);

-- Create atomic payment function
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
    INSERT INTO payments (user_id, provider_ref, credits, amount, payment_method, provider, status, currency, created_at)
    VALUES (p_user_id, p_payment_intent_id, p_credits, p_amount, p_method, 'airwallex', 'success', 'HKD', NOW());
    
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
        SELECT coffee_credits INTO v_new_credits FROM profiles WHERE id = p_user_id;
        RETURN v_new_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. BASIC INDEXES (Without CONCURRENTLY)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_moments_status ON moments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_from ON likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to ON likes(to_user_id);

-- 3. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;

-- DONE!
