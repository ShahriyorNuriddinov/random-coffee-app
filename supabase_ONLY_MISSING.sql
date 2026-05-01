-- ═══════════════════════════════════════════════════════════════
-- FAQAT YETISHMAYOTGANLAR — xavfsiz, mavjudlarni o'zgartirmaydi
-- Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- ── 1. profiles ustunlari ────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city                    TEXT        DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday_bonus_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags                    JSONB       DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned                  BOOLEAN     DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_active            BOOLEAN     DEFAULT FALSE;

-- ── 2. moments ustunlari ─────────────────────────────────────
ALTER TABLE moments ADD COLUMN IF NOT EXISTS status        TEXT    DEFAULT 'pending';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_urls    TEXT[]  DEFAULT ARRAY[]::TEXT[];
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_en       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_zh       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_ru       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS likes_count   INT     DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT FALSE;

-- ── 3. matches ustunlari ─────────────────────────────────────
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status          TEXT        DEFAULT 'active';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS moment_posted   BOOLEAN     DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_rating TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_text   TEXT;

-- ── 4. moment_likes ──────────────────────────────────────────
ALTER TABLE moment_likes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';
ALTER TABLE moment_likes DROP CONSTRAINT IF EXISTS moment_likes_user_id_moment_id_key;
ALTER TABLE moment_likes DROP CONSTRAINT IF EXISTS moment_likes_unique;
ALTER TABLE moment_likes ADD CONSTRAINT moment_likes_unique UNIQUE (user_id, moment_id, emoji);

-- ── 5. app_settings ustunlari ────────────────────────────────
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS lang_ru            BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS trial_credits      INT     DEFAULT 2;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS ai_matching_prompt TEXT    DEFAULT '';
UPDATE app_settings SET
  lang_ru            = COALESCE(lang_ru, FALSE),
  trial_credits      = COALESCE(trial_credits, 2),
  ai_matching_prompt = COALESCE(ai_matching_prompt, '')
WHERE id = 1;

-- ── 6. news ustunlari ────────────────────────────────────────
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_ru   TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_en   TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID;

-- ── 7. payments unique constraint ────────────────────────────
ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);

-- ── 8. Storage buckets ───────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos',  'photos',  true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('moments', 'moments', true) ON CONFLICT (id) DO NOTHING;

-- ── 9. confirm_payment_atomic ────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT oid::regprocedure AS s FROM pg_proc WHERE proname = 'confirm_payment_atomic'
  LOOP EXECUTE 'DROP FUNCTION IF EXISTS ' || r.s; END LOOP;
END $$;

CREATE FUNCTION confirm_payment_atomic(
  p_user_id TEXT, p_payment_intent_id TEXT,
  p_credits INT, p_amount NUMERIC, p_method TEXT
)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_credits INT;
BEGIN
  INSERT INTO payments (user_id, amount, credits, payment_method, provider_ref, status)
  VALUES (p_user_id, p_amount, p_credits, p_method, p_payment_intent_id, 'success');
  UPDATE profiles
  SET coffee_credits = coffee_credits + p_credits,
      subscription_status = 'active', updated_at = NOW()
  WHERE id = p_user_id RETURNING coffee_credits INTO new_credits;
  RETURN new_credits;
END;
$$;
GRANT EXECUTE ON FUNCTION confirm_payment_atomic(TEXT,TEXT,INT,NUMERIC,TEXT) TO authenticated;

-- ── 10. increment_credits (TEXT tipida) ──────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT oid::regprocedure AS s FROM pg_proc WHERE proname = 'increment_credits'
  LOOP EXECUTE 'DROP FUNCTION IF EXISTS ' || r.s; END LOOP;
END $$;

CREATE FUNCTION increment_credits(p_user_id TEXT, p_credits INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_credits INT;
BEGIN
  UPDATE profiles
  SET coffee_credits = coffee_credits + p_credits,
      subscription_status = 'active', updated_at = NOW()
  WHERE id = p_user_id RETURNING coffee_credits INTO new_credits;
  RETURN new_credits;
END;
$$;
GRANT EXECUTE ON FUNCTION increment_credits(TEXT,INT) TO authenticated;

-- ── 11. get_dashboard_stats ───────────────────────────────────
DROP FUNCTION IF EXISTS get_dashboard_stats();

CREATE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_members BIGINT, active_members BIGINT,
  men_count BIGINT, women_count BIGINT,
  new_today BIGINT, new_week BIGINT,
  new_month BIGINT, new_prev_month BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE subscription_status = 'active'),
    COUNT(*) FILTER (WHERE gender = 'male'),
    COUNT(*) FILTER (WHERE gender = 'female'),
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    COUNT(*) FILTER (WHERE DATE_TRUNC('month',created_at) = DATE_TRUNC('month',NOW())),
    COUNT(*) FILTER (WHERE DATE_TRUNC('month',created_at) = DATE_TRUNC('month',NOW()-INTERVAL '1 month'))
  FROM profiles
  WHERE deleted_at IS NULL AND (banned IS NULL OR banned = FALSE);
$$;
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- ── 12. credit_referral_bonus ─────────────────────────────────
DROP FUNCTION IF EXISTS credit_referral_bonus(TEXT);

CREATE FUNCTION credit_referral_bonus(p_referred_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_referrer_id TEXT; v_reward INT;
BEGIN
  SELECT referrer_id INTO v_referrer_id FROM referrals
  WHERE referred_id = p_referred_id AND credited = FALSE LIMIT 1;
  IF v_referrer_id IS NULL THEN RETURN; END IF;
  SELECT COALESCE(reward_referral,1) INTO v_reward FROM app_settings WHERE id=1;
  UPDATE profiles SET coffee_credits=coffee_credits+v_reward,
    referral_count=referral_count+1, updated_at=NOW() WHERE id=v_referrer_id;
  UPDATE profiles SET coffee_credits=coffee_credits+v_reward,
    updated_at=NOW() WHERE id=p_referred_id;
  UPDATE referrals SET credited=TRUE
  WHERE referrer_id=v_referrer_id AND referred_id=p_referred_id;
END;
$$;
GRANT EXECUTE ON FUNCTION credit_referral_bonus(TEXT) TO authenticated;

-- ── 13. Indexlar ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_region       ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_moments_status        ON moments(status);
CREATE INDEX IF NOT EXISTS idx_moments_user_id       ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1         ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2         ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_likes_from            ON likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to              ON likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_news_pinned           ON news(pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id      ON payments(user_id);

-- ── 14. Realtime — allaqachon qo'shilgan, skip
-- ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- ── Tekshirish ───────────────────────────────────────────────
SELECT 'OK' AS status, COUNT(*) AS profiles FROM profiles;
