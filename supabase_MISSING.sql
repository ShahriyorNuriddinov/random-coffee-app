-- ═══════════════════════════════════════════════════════════════════════════
-- RANDOM COFFEE — YETISHMAYOTGAN NARSALAR (TYPE-SAFE VERSION)
-- Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- 0. AVVAL: likes/matches/moments ustunlarining haqiqiy tipini
--    aniqlash va TEXT ga o'tkazish (UUID vs TEXT muammo)
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  -- likes.from_user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='likes' AND column_name='from_user_id' AND data_type='uuid'
  ) THEN
    ALTER TABLE likes ALTER COLUMN from_user_id TYPE TEXT USING from_user_id::TEXT;
    ALTER TABLE likes ALTER COLUMN to_user_id   TYPE TEXT USING to_user_id::TEXT;
  END IF;

  -- matches.user1_id / user2_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='matches' AND column_name='user1_id' AND data_type='uuid'
  ) THEN
    ALTER TABLE matches ALTER COLUMN user1_id TYPE TEXT USING user1_id::TEXT;
    ALTER TABLE matches ALTER COLUMN user2_id TYPE TEXT USING user2_id::TEXT;
  END IF;

  -- moments.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='moments' AND column_name='user_id' AND data_type='uuid'
  ) THEN
    ALTER TABLE moments ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;

  -- moment_likes.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='moment_likes' AND column_name='user_id' AND data_type='uuid'
  ) THEN
    ALTER TABLE moment_likes ALTER COLUMN user_id    TYPE TEXT USING user_id::TEXT;
    ALTER TABLE moment_likes ALTER COLUMN moment_id  TYPE TEXT USING moment_id::TEXT;
  END IF;

  -- meeting_feedback.user_id (agar mavjud bo'lsa)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='meeting_feedback' AND column_name='user_id' AND data_type='uuid'
  ) THEN
    ALTER TABLE meeting_feedback ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
  END IF;

END $$;


-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES — YETISHMAYOTGAN USTUNLAR
-- ════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city                    TEXT        DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday_bonus_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags                    JSONB       DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned                  BOOLEAN     DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_active            BOOLEAN     DEFAULT FALSE;

-- region CHECK — 'Mainland' va 'Other' qo'shish
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_region_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_region_check
  CHECK (region IN ('Hong Kong','Macau','Mainland','Mainland China','Other'));

-- subscription_status CHECK — 'inactive' va 'cancelled' qo'shish
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('trial','active','inactive','empty','cancelled'));


-- ════════════════════════════════════════════════════════════════
-- 2. MOMENTS — YETISHMAYOTGAN USTUNLAR
-- ════════════════════════════════════════════════════════════════

ALTER TABLE moments ADD COLUMN IF NOT EXISTS status        TEXT    DEFAULT 'pending';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_urls    TEXT[]  DEFAULT ARRAY[]::TEXT[];
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_en       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_zh       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_ru       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS likes_count   INT     DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT FALSE;


-- ════════════════════════════════════════════════════════════════
-- 3. MATCHES — YETISHMAYOTGAN USTUNLAR
-- ════════════════════════════════════════════════════════════════

ALTER TABLE matches ADD COLUMN IF NOT EXISTS status          TEXT        DEFAULT 'active';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS moment_posted   BOOLEAN     DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_rating TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_text   TEXT;


-- ════════════════════════════════════════════════════════════════
-- 4. MOMENT_LIKES — emoji ustuni va unique constraint
-- ════════════════════════════════════════════════════════════════

ALTER TABLE moment_likes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';

ALTER TABLE moment_likes DROP CONSTRAINT IF EXISTS moment_likes_user_id_moment_id_key;
ALTER TABLE moment_likes DROP CONSTRAINT IF EXISTS moment_likes_unique;
ALTER TABLE moment_likes ADD CONSTRAINT moment_likes_unique
  UNIQUE (user_id, moment_id, emoji);


-- ════════════════════════════════════════════════════════════════
-- 5. APP_SETTINGS — yetishmayotgan ustunlar
-- ════════════════════════════════════════════════════════════════

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS lang_ru             BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS trial_credits       INT     DEFAULT 2;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS ai_matching_prompt  TEXT    DEFAULT '';

UPDATE app_settings SET
  lang_ru            = COALESCE(lang_ru, FALSE),
  trial_credits      = COALESCE(trial_credits, 2),
  ai_matching_prompt = COALESCE(ai_matching_prompt, '')
WHERE id = 1;


-- ════════════════════════════════════════════════════════════════
-- 6. NEWS — yetishmayotgan ustunlar
-- ════════════════════════════════════════════════════════════════

ALTER TABLE news ADD COLUMN IF NOT EXISTS text_ru   TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_en   TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID;


-- ════════════════════════════════════════════════════════════════
-- 7. BLOCKED_USERS — yangi jadval
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blocked_users (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT        NOT NULL,
  blocked_id TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "blocked_self_all"   ON blocked_users;
DROP POLICY IF EXISTS "blocked_staff_read" ON blocked_users;

CREATE POLICY "blocked_self_all" ON blocked_users
  FOR ALL
  USING     (auth.uid()::text = blocker_id)
  WITH CHECK (auth.uid()::text = blocker_id);

CREATE POLICY "blocked_staff_read" ON blocked_users
  FOR SELECT USING (is_staff());

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_id);


-- ════════════════════════════════════════════════════════════════
-- 8. REPORTS — yangi jadval
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT        NOT NULL,
  reported_id TEXT        NOT NULL,
  reason      TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reporter_id, reported_id, reason)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert"     ON reports;
DROP POLICY IF EXISTS "reports_staff_read" ON reports;

CREATE POLICY "reports_insert" ON reports
  FOR INSERT
  WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "reports_staff_read" ON reports
  FOR SELECT USING (is_staff());

CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);


-- ════════════════════════════════════════════════════════════════
-- 9. REFERRALS — jadval
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referrals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT        NOT NULL,
  referred_id TEXT        NOT NULL,
  credited    BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_read"   ON referrals;
DROP POLICY IF EXISTS "referrals_insert" ON referrals;

CREATE POLICY "referrals_read" ON referrals
  FOR SELECT
  USING (auth.uid()::text = referrer_id
      OR auth.uid()::text = referred_id
      OR is_staff());

CREATE POLICY "referrals_insert" ON referrals
  FOR INSERT WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════
-- 10. MEETING_FEEDBACK — jadval
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS meeting_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  match_id    UUID,
  status      TEXT        NOT NULL CHECK (status IN ('success','fail')),
  rating      TEXT,
  note        TEXT,
  fail_reason TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meeting_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mf_insert"      ON meeting_feedback;
DROP POLICY IF EXISTS "mf_self_select" ON meeting_feedback;

CREATE POLICY "mf_insert" ON meeting_feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "mf_self_select" ON meeting_feedback
  FOR SELECT
  USING (auth.uid()::text = user_id OR is_staff());

CREATE INDEX IF NOT EXISTS idx_mf_status  ON meeting_feedback(status);
CREATE INDEX IF NOT EXISTS idx_mf_user_id ON meeting_feedback(user_id);


-- ════════════════════════════════════════════════════════════════
-- 11. PAYMENTS — INSERT policy + unique constraint
-- ════════════════════════════════════════════════════════════════

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_insert"    ON payments;
DROP POLICY IF EXISTS "payments_self_read" ON payments;
DROP POLICY IF EXISTS "payments_read"      ON payments;

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "payments_read" ON payments
  FOR SELECT
  USING (auth.uid()::text = user_id OR is_staff());

ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);


-- ════════════════════════════════════════════════════════════════
-- 12. PROFILES RLS — People ekrani uchun
-- ════════════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read"               ON profiles;
DROP POLICY IF EXISTS "profiles_self_read"          ON profiles;
DROP POLICY IF EXISTS "profiles_read_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_self_write"         ON profiles;
DROP POLICY IF EXISTS "profiles_insert"             ON profiles;
DROP POLICY IF EXISTS "profiles_update"             ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update"       ON profiles;

-- Barcha authenticated foydalanuvchilar ko'ra oladi (People ekrani)
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT
  USING (auth.role() = 'authenticated' OR is_staff());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE
  USING (auth.uid()::text = id OR is_staff());


-- ════════════════════════════════════════════════════════════════
-- 13. MATCHES RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_read"               ON matches;
DROP POLICY IF EXISTS "matches_self_read"          ON matches;
DROP POLICY IF EXISTS "matches_read_authenticated" ON matches;
DROP POLICY IF EXISTS "matches_select"             ON matches;
DROP POLICY IF EXISTS "matches_insert"             ON matches;
DROP POLICY IF EXISTS "matches_update"             ON matches;

CREATE POLICY "matches_read" ON matches
  FOR SELECT
  USING (auth.uid()::text = user1_id
      OR auth.uid()::text = user2_id
      OR is_staff());

CREATE POLICY "matches_insert" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "matches_update" ON matches
  FOR UPDATE
  USING (auth.uid()::text = user1_id
      OR auth.uid()::text = user2_id
      OR is_staff());


-- ════════════════════════════════════════════════════════════════
-- 14. LIKES RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;

CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON likes
  FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);

CREATE POLICY "likes_delete" ON likes
  FOR DELETE USING (auth.uid()::text = from_user_id);


-- ════════════════════════════════════════════════════════════════
-- 15. MOMENTS RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moments_select"       ON moments;
DROP POLICY IF EXISTS "moments_insert"       ON moments;
DROP POLICY IF EXISTS "moments_delete"       ON moments;
DROP POLICY IF EXISTS "moments_update"       ON moments;
DROP POLICY IF EXISTS "moments_delete_staff" ON moments;
DROP POLICY IF EXISTS "moments_update_staff" ON moments;

CREATE POLICY "moments_select" ON moments FOR SELECT USING (true);

CREATE POLICY "moments_insert" ON moments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "moments_update" ON moments
  FOR UPDATE
  USING (auth.uid()::text = user_id OR is_staff());

CREATE POLICY "moments_delete" ON moments
  FOR DELETE
  USING (auth.uid()::text = user_id OR is_staff());


-- ════════════════════════════════════════════════════════════════
-- 16. MOMENT_LIKES RLS
-- ════════════════════════════════════════════════════════════════

ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moment_likes_select" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_insert" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_delete" ON moment_likes;

CREATE POLICY "moment_likes_select" ON moment_likes FOR SELECT USING (true);

CREATE POLICY "moment_likes_insert" ON moment_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "moment_likes_delete" ON moment_likes
  FOR DELETE USING (auth.uid()::text = user_id);


-- ════════════════════════════════════════════════════════════════
-- 17. STORAGE BUCKET — moments
-- ════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;


-- ════════════════════════════════════════════════════════════════
-- 18. RPC: confirm_payment_atomic
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION confirm_payment_atomic(
  p_user_id           TEXT,
  p_payment_intent_id TEXT,
  p_credits           INT,
  p_amount            NUMERIC,
  p_method            TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits INT;
BEGIN
  INSERT INTO payments (user_id, amount, credits, payment_method, provider_ref, status)
  VALUES (p_user_id, p_amount, p_credits, p_method, p_payment_intent_id, 'success');

  UPDATE profiles
  SET coffee_credits      = coffee_credits + p_credits,
      subscription_status = 'active',
      updated_at          = NOW()
  WHERE id = p_user_id
  RETURNING coffee_credits INTO new_credits;

  RETURN new_credits;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 19. RPC: increment_credits (TEXT tipida)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_credits(p_user_id TEXT, p_credits INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_credits INT;
BEGIN
  UPDATE profiles
  SET coffee_credits      = coffee_credits + p_credits,
      subscription_status = 'active',
      updated_at          = NOW()
  WHERE id = p_user_id
  RETURNING coffee_credits INTO new_credits;

  RETURN new_credits;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_credits TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 20. RPC: get_dashboard_stats
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_members  BIGINT,
  active_members BIGINT,
  men_count      BIGINT,
  women_count    BIGINT,
  new_today      BIGINT,
  new_week       BIGINT,
  new_month      BIGINT,
  new_prev_month BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    COUNT(*)                                                                                                    AS total_members,
    COUNT(*) FILTER (WHERE subscription_status = 'active')                                                     AS active_members,
    COUNT(*) FILTER (WHERE gender = 'male')                                                                    AS men_count,
    COUNT(*) FILTER (WHERE gender = 'female')                                                                  AS women_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)                                                         AS new_today,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')                                           AS new_week,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()))                       AS new_month,
    COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) AS new_prev_month
  FROM profiles
  WHERE deleted_at IS NULL
    AND (banned IS NULL OR banned = FALSE);
$$;

GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 21. RPC: credit_referral_bonus
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION credit_referral_bonus(p_referred_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id TEXT;
  v_reward      INT;
BEGIN
  SELECT referrer_id INTO v_referrer_id
  FROM referrals
  WHERE referred_id = p_referred_id AND credited = FALSE
  LIMIT 1;

  IF v_referrer_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(reward_referral, 1) INTO v_reward
  FROM app_settings WHERE id = 1;

  UPDATE profiles
  SET coffee_credits = coffee_credits + v_reward,
      referral_count = referral_count + 1,
      updated_at     = NOW()
  WHERE id = v_referrer_id;

  UPDATE profiles
  SET coffee_credits = coffee_credits + v_reward,
      updated_at     = NOW()
  WHERE id = p_referred_id;

  UPDATE referrals
  SET credited = TRUE
  WHERE referrer_id = v_referrer_id AND referred_id = p_referred_id;
END;
$$;

GRANT EXECUTE ON FUNCTION credit_referral_bonus TO authenticated;


-- ════════════════════════════════════════════════════════════════
-- 22. INDEXLAR
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_region       ON profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted      ON profiles(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_moments_status        ON moments(status);
CREATE INDEX IF NOT EXISTS idx_moments_user_id       ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user1         ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2         ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_likes_from            ON likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to              ON likes(to_user_id);
CREATE INDEX IF NOT EXISTS idx_news_pinned           ON news(pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id      ON payments(user_id);


-- ════════════════════════════════════════════════════════════════
-- 23. REALTIME
-- ════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE profiles;


-- ════════════════════════════════════════════════════════════════
-- TEKSHIRISH
-- ════════════════════════════════════════════════════════════════

SELECT 'blocked_users'    AS tbl, COUNT(*) FROM blocked_users    UNION ALL
SELECT 'reports'          AS tbl, COUNT(*) FROM reports          UNION ALL
SELECT 'referrals'        AS tbl, COUNT(*) FROM referrals        UNION ALL
SELECT 'meeting_feedback' AS tbl, COUNT(*) FROM meeting_feedback UNION ALL
SELECT 'profiles'         AS tbl, COUNT(*) FROM profiles         UNION ALL
SELECT 'matches'          AS tbl, COUNT(*) FROM matches          UNION ALL
SELECT 'moments'          AS tbl, COUNT(*) FROM moments;
