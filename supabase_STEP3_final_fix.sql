-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL FIX — faqat muammoli 2 ustun + barcha kerakli narsalar
-- Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. blocked_users.blocker_id: UUID → TEXT ────────────────────────────────
-- Policy + FK o'chirish, keyin type o'zgartirish
DROP POLICY IF EXISTS "blocked_insert"     ON blocked_users;
DROP POLICY IF EXISTS "blocked_select"     ON blocked_users;
DROP POLICY IF EXISTS "blocked_delete"     ON blocked_users;
DROP POLICY IF EXISTS "blocked_self_all"   ON blocked_users;
DROP POLICY IF EXISTS "blocked_staff_read" ON blocked_users;
DROP POLICY IF EXISTS "blocked_all"        ON blocked_users;

ALTER TABLE blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;

ALTER TABLE blocked_users ALTER COLUMN blocker_id TYPE TEXT USING blocker_id::TEXT;
ALTER TABLE blocked_users ALTER COLUMN blocked_id TYPE TEXT USING blocked_id::TEXT;

-- ─── 2. reports.reporter_id: UUID → TEXT ─────────────────────────────────────
-- View + Policy + FK o'chirish, keyin type o'zgartirish
DROP VIEW IF EXISTS admin_reports_view CASCADE;

DROP POLICY IF EXISTS "reports_insert"     ON reports;
DROP POLICY IF EXISTS "reports_select"     ON reports;
DROP POLICY IF EXISTS "reports_staff_read" ON reports;
DROP POLICY IF EXISTS "reports_all"        ON reports;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_id_fkey;

ALTER TABLE reports ALTER COLUMN reporter_id TYPE TEXT USING reporter_id::TEXT;
ALTER TABLE reports ALTER COLUMN reported_id TYPE TEXT USING reported_id::TEXT;

-- View ni qayta yaratish
CREATE OR REPLACE VIEW admin_reports_view AS
SELECT
  r.id,
  r.reporter_id,
  r.reported_id,
  r.reason,
  r.created_at,
  rp.name  AS reporter_name,
  rp.email AS reporter_email,
  rd.name  AS reported_name,
  rd.email AS reported_email
FROM reports r
LEFT JOIN profiles rp ON rp.id = r.reporter_id
LEFT JOIN profiles rd ON rd.id = r.reported_id;


-- ─── 3. RLS: blocked_users ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "blocked_self_all"   ON blocked_users;
DROP POLICY IF EXISTS "blocked_staff_read" ON blocked_users;

CREATE POLICY "blocked_self_all" ON blocked_users
  FOR ALL
  USING     (auth.uid()::text = blocker_id)
  WITH CHECK (auth.uid()::text = blocker_id);

CREATE POLICY "blocked_staff_read" ON blocked_users
  FOR SELECT USING (is_staff());


-- ─── 4. RLS: reports ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reports_insert"     ON reports;
DROP POLICY IF EXISTS "reports_staff_read" ON reports;

CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "reports_staff_read" ON reports
  FOR SELECT USING (is_staff());


-- ─── 5. RLS: profiles ────────────────────────────────────────────────────────
-- profiles.id = TEXT → auth.uid()::text

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read"               ON profiles;
DROP POLICY IF EXISTS "profiles_self_read"          ON profiles;
DROP POLICY IF EXISTS "profiles_read_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_self_write"         ON profiles;
DROP POLICY IF EXISTS "profiles_insert"             ON profiles;
DROP POLICY IF EXISTS "profiles_update"             ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update"       ON profiles;

CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated' OR is_staff());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid()::text = id OR is_staff());


-- ─── 6. RLS: likes ───────────────────────────────────────────────────────────
-- likes.from_user_id = TEXT → auth.uid()::text

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;

CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON likes
  FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);

CREATE POLICY "likes_delete" ON likes
  FOR DELETE USING (auth.uid()::text = from_user_id);


-- ─── 7. RLS: matches ─────────────────────────────────────────────────────────
-- matches.user1_id = TEXT, user2_id = TEXT → auth.uid()::text

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


-- ─── 8. RLS: moments ─────────────────────────────────────────────────────────
-- moments.user_id = TEXT → auth.uid()::text

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
  FOR UPDATE USING (auth.uid()::text = user_id OR is_staff());

CREATE POLICY "moments_delete" ON moments
  FOR DELETE USING (auth.uid()::text = user_id OR is_staff());


-- ─── 9. RLS: moment_likes ────────────────────────────────────────────────────
-- moment_likes.user_id = TEXT → auth.uid()::text

ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moment_likes_select" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_insert" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_delete" ON moment_likes;

CREATE POLICY "moment_likes_select" ON moment_likes FOR SELECT USING (true);

CREATE POLICY "moment_likes_insert" ON moment_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "moment_likes_delete" ON moment_likes
  FOR DELETE USING (auth.uid()::text = user_id);


-- ─── 10. RLS: meeting_feedback ───────────────────────────────────────────────
-- meeting_feedback.user_id = TEXT → auth.uid()::text

ALTER TABLE meeting_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mf_insert"      ON meeting_feedback;
DROP POLICY IF EXISTS "mf_self_select" ON meeting_feedback;

CREATE POLICY "mf_insert" ON meeting_feedback
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "mf_self_select" ON meeting_feedback
  FOR SELECT USING (auth.uid()::text = user_id OR is_staff());


-- ─── 11. RLS: payments ───────────────────────────────────────────────────────
-- payments.user_id = TEXT → auth.uid()::text

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_insert"    ON payments;
DROP POLICY IF EXISTS "payments_self_read" ON payments;
DROP POLICY IF EXISTS "payments_read"      ON payments;

CREATE POLICY "payments_insert" ON payments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "payments_read" ON payments
  FOR SELECT USING (auth.uid()::text = user_id OR is_staff());

ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);


-- ─── 12. RLS: referrals ──────────────────────────────────────────────────────
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


-- ─── 13. PROFILES — yetishmayotgan ustunlar ──────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city                    TEXT        DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_ru                TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at              TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday_bonus_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags                    JSONB       DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned                  BOOLEAN     DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_active            BOOLEAN     DEFAULT FALSE;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_region_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_region_check
  CHECK (region IN ('Hong Kong','Macau','Mainland','Mainland China','Other'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('trial','active','inactive','empty','cancelled'));


-- ─── 14. MOMENTS — yetishmayotgan ustunlar ───────────────────────────────────
ALTER TABLE moments ADD COLUMN IF NOT EXISTS status        TEXT    DEFAULT 'pending';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_urls    TEXT[]  DEFAULT ARRAY[]::TEXT[];
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_en       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_zh       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_ru       TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS likes_count   INT     DEFAULT 0;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT FALSE;


-- ─── 15. MATCHES — yetishmayotgan ustunlar ───────────────────────────────────
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status          TEXT        DEFAULT 'active';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS moment_posted   BOOLEAN     DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_rating TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_text   TEXT;


-- ─── 16. MOMENT_LIKES — emoji + unique constraint ────────────────────────────
ALTER TABLE moment_likes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';

ALTER TABLE moment_likes DROP CONSTRAINT IF EXISTS moment_likes_user_id_moment_id_key;
ALTER TABLE moment_likes DROP CONSTRAINT IF EXISTS moment_likes_unique;
ALTER TABLE moment_likes ADD CONSTRAINT moment_likes_unique
  UNIQUE (user_id, moment_id, emoji);


-- ─── 17. APP_SETTINGS — yetishmayotgan ustunlar ──────────────────────────────
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS lang_ru            BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS trial_credits      INT     DEFAULT 2;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS ai_matching_prompt TEXT    DEFAULT '';

UPDATE app_settings SET
  lang_ru            = COALESCE(lang_ru, FALSE),
  trial_credits      = COALESCE(trial_credits, 2),
  ai_matching_prompt = COALESCE(ai_matching_prompt, '')
WHERE id = 1;


-- ─── 18. NEWS — yetishmayotgan ustunlar ──────────────────────────────────────
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_ru   TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_en   TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID;


-- ─── 19. STORAGE BUCKETS ─────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('photos',  'photos',  true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('moments', 'moments', true) ON CONFLICT (id) DO NOTHING;


-- ─── 20. RPC: confirm_payment_atomic ─────────────────────────────────────────
-- Avval barcha overload versiyalarini o'chirish
DROP FUNCTION IF EXISTS confirm_payment_atomic(TEXT, TEXT, INT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS confirm_payment_atomic(UUID, TEXT, INT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS confirm_payment_atomic(TEXT, TEXT, INTEGER, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS confirm_payment_atomic(UUID, TEXT, INTEGER, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION confirm_payment_atomic(
  p_user_id           TEXT,
  p_payment_intent_id TEXT,
  p_credits           INT,
  p_amount            NUMERIC,
  p_method            TEXT
)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_credits INT;
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
GRANT EXECUTE ON FUNCTION confirm_payment_atomic(TEXT, TEXT, INT, NUMERIC, TEXT) TO authenticated;


-- ─── 21. RPC: increment_credits (TEXT) ───────────────────────────────────────
DROP FUNCTION IF EXISTS increment_credits(TEXT, INT);
DROP FUNCTION IF EXISTS increment_credits(UUID, INT);
DROP FUNCTION IF EXISTS increment_credits(TEXT, INTEGER);
DROP FUNCTION IF EXISTS increment_credits(UUID, INTEGER);

CREATE OR REPLACE FUNCTION increment_credits(p_user_id TEXT, p_credits INT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_credits INT;
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
GRANT EXECUTE ON FUNCTION increment_credits(TEXT, INT) TO authenticated;


-- ─── 22. RPC: get_dashboard_stats ────────────────────────────────────────────
DROP FUNCTION IF EXISTS get_dashboard_stats();

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_members  BIGINT, active_members BIGINT,
  men_count      BIGINT, women_count    BIGINT,
  new_today      BIGINT, new_week       BIGINT,
  new_month      BIGINT, new_prev_month BIGINT
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
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
  WHERE deleted_at IS NULL AND (banned IS NULL OR banned = FALSE);
$$;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;


-- ─── 23. RPC: credit_referral_bonus ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION credit_referral_bonus(p_referred_id TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
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

  UPDATE profiles SET coffee_credits = coffee_credits + v_reward,
    referral_count = referral_count + 1, updated_at = NOW()
  WHERE id = v_referrer_id;

  UPDATE profiles SET coffee_credits = coffee_credits + v_reward,
    updated_at = NOW()
  WHERE id = p_referred_id;

  UPDATE referrals SET credited = TRUE
  WHERE referrer_id = v_referrer_id AND referred_id = p_referred_id;
END;
$$;
GRANT EXECUTE ON FUNCTION credit_referral_bonus TO authenticated;


-- ─── 24. INDEXLAR ────────────────────────────────────────────────────────────
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
CREATE INDEX IF NOT EXISTS idx_blocked_blocker       ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported      ON reports(reported_id);


-- ─── 25. REALTIME ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;


-- ─── TEKSHIRISH ──────────────────────────────────────────────────────────────
SELECT 'profiles'         AS tbl, COUNT(*) FROM profiles         UNION ALL
SELECT 'blocked_users'    AS tbl, COUNT(*) FROM blocked_users    UNION ALL
SELECT 'reports'          AS tbl, COUNT(*) FROM reports          UNION ALL
SELECT 'referrals'        AS tbl, COUNT(*) FROM referrals        UNION ALL
SELECT 'meeting_feedback' AS tbl, COUNT(*) FROM meeting_feedback UNION ALL
SELECT 'matches'          AS tbl, COUNT(*) FROM matches          UNION ALL
SELECT 'moments'          AS tbl, COUNT(*) FROM moments;
