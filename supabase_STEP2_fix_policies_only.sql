-- ═══════════════════════════════════════════════════════════════════════════
-- QADAM 2: FAQAT RLS POLICY LARNI TO'G'IRLASH
-- auth.uid() = UUID, ustunlar = TEXT bo'lsa → auth.uid()::text ishlatamiz
-- auth.uid() = UUID, ustunlar = UUID bo'lsa → auth.uid() to'g'ridan ishlatamiz
--
-- Bu fayl IKKI VARIANT beradi — qaysi biri ishlasa o'shani qoldiring
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── PROFILES ────────────────────────────────────────────────────────────────
-- profiles.id = TEXT (setup.sql da TEXT deb yozilgan)

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


-- ─── LIKES ───────────────────────────────────────────────────────────────────
-- Avval likes.from_user_id tipini tekshiramiz va shunga qarab policy yozamiz

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;

CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);

-- Agar likes.from_user_id = UUID bo'lsa:
CREATE POLICY "likes_insert" ON likes
  FOR INSERT WITH CHECK (auth.uid() = from_user_id::uuid);

CREATE POLICY "likes_delete" ON likes
  FOR DELETE USING (auth.uid() = from_user_id::uuid);


-- ─── MATCHES ─────────────────────────────────────────────────────────────────
-- Agar matches.user1_id = UUID bo'lsa:

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "matches_read"               ON matches;
DROP POLICY IF EXISTS "matches_self_read"          ON matches;
DROP POLICY IF EXISTS "matches_read_authenticated" ON matches;
DROP POLICY IF EXISTS "matches_select"             ON matches;
DROP POLICY IF EXISTS "matches_insert"             ON matches;
DROP POLICY IF EXISTS "matches_update"             ON matches;

CREATE POLICY "matches_read" ON matches
  FOR SELECT
  USING (auth.uid() = user1_id::uuid
      OR auth.uid() = user2_id::uuid
      OR is_staff());

CREATE POLICY "matches_insert" ON matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "matches_update" ON matches
  FOR UPDATE
  USING (auth.uid() = user1_id::uuid
      OR auth.uid() = user2_id::uuid
      OR is_staff());


-- ─── MOMENTS ─────────────────────────────────────────────────────────────────
-- Agar moments.user_id = UUID bo'lsa:

ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moments_select"       ON moments;
DROP POLICY IF EXISTS "moments_insert"       ON moments;
DROP POLICY IF EXISTS "moments_delete"       ON moments;
DROP POLICY IF EXISTS "moments_update"       ON moments;
DROP POLICY IF EXISTS "moments_delete_staff" ON moments;
DROP POLICY IF EXISTS "moments_update_staff" ON moments;

CREATE POLICY "moments_select" ON moments FOR SELECT USING (true);

CREATE POLICY "moments_insert" ON moments
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "moments_update" ON moments
  FOR UPDATE USING (auth.uid() = user_id::uuid OR is_staff());

CREATE POLICY "moments_delete" ON moments
  FOR DELETE USING (auth.uid() = user_id::uuid OR is_staff());


-- ─── MOMENT_LIKES ────────────────────────────────────────────────────────────
-- Agar moment_likes.user_id = UUID bo'lsa:

ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moment_likes_select" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_insert" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_delete" ON moment_likes;

CREATE POLICY "moment_likes_select" ON moment_likes FOR SELECT USING (true);

CREATE POLICY "moment_likes_insert" ON moment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id::uuid);

CREATE POLICY "moment_likes_delete" ON moment_likes
  FOR DELETE USING (auth.uid() = user_id::uuid);


-- ─── MEETING_FEEDBACK ────────────────────────────────────────────────────────
-- meeting_feedback.user_id = TEXT (yangi jadval, biz TEXT qilib yaratamiz)

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
  FOR SELECT USING (auth.uid()::text = user_id OR is_staff());


-- ─── BLOCKED_USERS ───────────────────────────────────────────────────────────
-- TEXT tipida yaratilgan — auth.uid()::text ishlatamiz

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


-- ─── REPORTS ─────────────────────────────────────────────────────────────────

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
  FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "reports_staff_read" ON reports
  FOR SELECT USING (is_staff());


-- ─── REFERRALS ───────────────────────────────────────────────────────────────

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


-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
-- payments.user_id = TEXT (setup.sql da TEXT)

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
