-- Atomic credit increment — prevents race condition on simultaneous payments
-- Run this in Supabase SQL Editor
-- NOTE: profiles.id is TEXT — p_user_id (UUID) cast to ::text in WHERE clause

CREATE OR REPLACE FUNCTION increment_credits(p_user_id UUID, p_credits INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
    new_credits INT;
BEGIN
    UPDATE profiles
    SET
        coffee_credits      = coffee_credits + p_credits,
        subscription_status = 'active',
        subscription_start  = COALESCE(subscription_start, NOW()),
        updated_at          = NOW()
    WHERE id = p_user_id::text
    RETURNING coffee_credits INTO new_credits;

    RETURN new_credits;
END;
$fn$;

GRANT EXECUTE ON FUNCTION increment_credits TO authenticated;
