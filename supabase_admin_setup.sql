-- ═══════════════════════════════════════════════════════════════
-- ADMIN PANEL — Supabase Setup SQL
-- ---------------------------------------------------------------
-- Ishga tushirish tartibi:
--   1. supabase_setup.sql  (yoki supabase_step1.sql)
--   2. supabase_stage2.sql
--   3. BU FAYL
--
-- Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════
-- QISM 1: USTUNLAR QO'SHISH
-- ════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned       BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email        TEXT;

ALTER TABLE moments  ADD COLUMN IF NOT EXISTS status       TEXT    DEFAULT 'pending';
ALTER TABLE moments  ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE moments  ADD COLUMN IF NOT EXISTS image_urls   TEXT[]  DEFAULT ARRAY[]::TEXT[];
ALTER TABLE moments  ADD COLUMN IF NOT EXISTS text_en      TEXT;
ALTER TABLE moments  ADD COLUMN IF NOT EXISTS text_zh      TEXT;

-- ════════════════════════════════════════════════════════════════
-- QISM 2: YANGI JADVALLAR
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS news (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  text       TEXT        NOT NULL,
  text_zh    TEXT,
  image_url  TEXT,
  pinned     BOOLEAN     DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id                 INT     PRIMARY KEY DEFAULT 1,
  standard_price     NUMERIC DEFAULT 15,
  standard_cups      INT     DEFAULT 1,
  best_price         NUMERIC DEFAULT 30,
  best_cups          INT     DEFAULT 3,
  reward_referral    INT     DEFAULT 1,
  reward_birthday    INT     DEFAULT 2,
  reward_post        INT     DEFAULT 1,
  lang_en            BOOLEAN DEFAULT TRUE,
  lang_zh            BOOLEAN DEFAULT TRUE,
  ai_matching_prompt TEXT    DEFAULT '',
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS ai_matching_prompt TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS staff (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        UNIQUE NOT NULL,
  phone      TEXT,
  role       TEXT        DEFAULT 'moderator' CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚠️  O'Z ADMIN EMAILLARINGIZNI YOZING:
INSERT INTO staff (name, email, role) VALUES
  ('Admin', 'admin@magollz.com', 'admin'),
  ('Yunna', 'yunna@magollz.com', 'admin')
ON CONFLICT (email) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- QISM 3: is_staff() FUNKSIYASI
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff WHERE email = auth.email()
  );
$$;

-- ════════════════════════════════════════════════════════════════
-- QISM 4: RLS POLICY'LARI
-- ════════════════════════════════════════════════════════════════

-- ─── profiles ────────────────────────────────────────────────────
-- profiles.id = TEXT
-- auth.uid()  = UUID  →  ::text cast kerak

DROP POLICY IF EXISTS "profiles_self_read"           ON profiles;
DROP POLICY IF EXISTS "profiles_self_write"          ON profiles;
DROP POLICY IF EXISTS "profiles_read_authenticated"  ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update"        ON profiles;
DROP POLICY IF EXISTS "profiles_read"                ON profiles;
DROP POLICY IF EXISTS "profiles_update"              ON profiles;

CREATE POLICY "profiles_read"
  ON profiles FOR SELECT
  USING (
    auth.uid()::text = id
    OR is_staff()
  );

CREATE POLICY "profiles_self_write"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (
    auth.uid()::text = id
    OR is_staff()
  );

-- ─── matches ─────────────────────────────────────────────────────
-- matches.user1_id = TEXT, matches.user2_id = TEXT
-- auth.uid() = UUID  →  ::text cast kerak

DROP POLICY IF EXISTS "matches_self_read"          ON matches;
DROP POLICY IF EXISTS "matches_read_authenticated" ON matches;
DROP POLICY IF EXISTS "matches_read"               ON matches;

CREATE POLICY "matches_read"
  ON matches FOR SELECT
  USING (
    auth.uid()::text = user1_id
    OR auth.uid()::text = user2_id
    OR is_staff()
  );

-- ─── payments ────────────────────────────────────────────────────
-- payments.user_id = TEXT
-- auth.uid()       = UUID  →  ::text cast kerak

DROP POLICY IF EXISTS "payments_self_read"          ON payments;
DROP POLICY IF EXISTS "payments_read_authenticated" ON payments;
DROP POLICY IF EXISTS "payments_read"               ON payments;

CREATE POLICY "payments_read"
  ON payments FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR is_staff()
  );

-- ─── news ─────────────────────────────────────────────────────────
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "news_public_read" ON news;
DROP POLICY IF EXISTS "news_auth_write"  ON news;
CREATE POLICY "news_public_read" ON news FOR SELECT USING (true);
CREATE POLICY "news_auth_write"  ON news FOR ALL    USING (auth.role() = 'authenticated');

-- ─── app_settings ─────────────────────────────────────────────────
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read" ON app_settings;
DROP POLICY IF EXISTS "settings_auth_write"  ON app_settings;
CREATE POLICY "settings_public_read" ON app_settings FOR SELECT USING (true);
CREATE POLICY "settings_auth_write"  ON app_settings FOR ALL    USING (auth.role() = 'authenticated');

-- ─── staff ────────────────────────────────────────────────────────
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_select_all"  ON staff;
DROP POLICY IF EXISTS "staff_admin_write" ON staff;
DROP POLICY IF EXISTS "staff_auth_all"    ON staff;
CREATE POLICY "staff_select_all"  ON staff FOR SELECT USING (true);
CREATE POLICY "staff_admin_write" ON staff FOR ALL    USING (is_staff());

ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_rating TEXT CHECK (feedback_rating IN ('excellent', 'good', 'normal', 'bad'));
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_text  TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status         TEXT DEFAULT 'active';

-- meeting_feedback table (user app FeedbackModal saves here)
CREATE TABLE IF NOT EXISTS meeting_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  match_id    UUID,
  status      TEXT        NOT NULL CHECK (status IN ('success', 'fail')),
  rating      TEXT,
  note        TEXT,
  fail_reason TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE meeting_feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mf_insert" ON meeting_feedback;
DROP POLICY IF EXISTS "mf_select" ON meeting_feedback;
CREATE POLICY "mf_insert" ON meeting_feedback FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "mf_select" ON meeting_feedback FOR SELECT USING (auth.uid()::text = user_id OR is_staff());
CREATE INDEX IF NOT EXISTS idx_mf_status ON meeting_feedback(status);

-- ════════════════════════════════════════════════════════════════
-- QISM 5: INDEXLAR
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_moments_status  ON moments(status);
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned);
CREATE INDEX IF NOT EXISTS idx_news_pinned     ON news(pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_email     ON staff(email);

-- ════════════════════════════════════════════════════════════════
-- TYPE CAST JADVALI (haqiqiy DB typelar):
--   profiles.id      = TEXT  →  auth.uid()::text = id
--   matches.user1_id = TEXT  →  auth.uid()::text = user1_id
--   matches.user2_id = TEXT  →  auth.uid()::text = user2_id
--   payments.user_id = TEXT  →  auth.uid()::text = user_id
--   moments.user_id  = TEXT  →  auth.uid()::text = user_id
--   likes.from_user_id = TEXT → auth.uid()::text = from_user_id
-- ════════════════════════════════════════════════════════════════
