-- Birthday Bonus: runs daily via pg_cron or Supabase scheduled function
-- This gives reward_birthday credits to users whose birthday is today
-- Run this SQL in Supabase SQL Editor to set up the cron job

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the birthday bonus function
CREATE OR REPLACE FUNCTION give_birthday_bonuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reward INT;
BEGIN
    -- Get reward amount from settings
    SELECT COALESCE(reward_birthday, 2) INTO reward
    FROM app_settings WHERE id = 1;

    -- Give credits to users whose birthday is today (match month + day)
    UPDATE profiles
    SET
        coffee_credits = COALESCE(coffee_credits, 0) + reward,
        subscription_status = 'active',
        updated_at = NOW()
    WHERE
        dob IS NOT NULL
        AND EXTRACT(MONTH FROM dob::date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(DAY   FROM dob::date) = EXTRACT(DAY   FROM NOW())
        AND (birthday_bonus_given_at IS NULL
             OR EXTRACT(YEAR FROM birthday_bonus_given_at) < EXTRACT(YEAR FROM NOW()));

    -- Mark bonus as given this year
    UPDATE profiles
    SET birthday_bonus_given_at = NOW()
    WHERE
        dob IS NOT NULL
        AND EXTRACT(MONTH FROM dob::date) = EXTRACT(MONTH FROM NOW())
        AND EXTRACT(DAY   FROM dob::date) = EXTRACT(DAY   FROM NOW());
END;
$$;

-- 3. Add birthday_bonus_given_at column to profiles (tracks last year bonus was given)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday_bonus_given_at TIMESTAMPTZ;

-- 4. Schedule daily at 09:00 UTC
SELECT cron.schedule(
    'birthday-bonus-daily',
    '0 9 * * *',
    'SELECT give_birthday_bonuses()'
);

-- To test manually: SELECT give_birthday_bonuses();
-- To remove cron: SELECT cron.unschedule('birthday-bonus-daily');
