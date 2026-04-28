-- ============================================================================
-- COMPLETE FIX — Run this in Supabase SQL Editor
-- Adds ALL missing columns, functions, and fixes
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- ─── 1. PROFILES: Missing columns ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_ru TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_ru TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_ru TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday_bonus_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS boost_active BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_new_matches BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notif_important_news BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_zh TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_zh TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_zh TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coffee_credits INT DEFAULT 2;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_age BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dating_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dating_gender TEXT DEFAULT 'women';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['EN'];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'Hong Kong';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ─── 2. MOMENTS: Missing columns ─────────────────────────────────────────────
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_en TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_zh TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_ru TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS image_urls TEXT[];
ALTER TABLE moments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE moments ADD COLUMN IF NOT EXISTS reject_reason TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT FALSE;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0;

-- ─── 3. MOMENT_LIKES: Missing emoji column ────────────────────────────────────
ALTER TABLE moment_likes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';

-- ─── 4. MATCHES: Missing columns ─────────────────────────────────────────────
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE matches ADD COLUMN IF NOT EXISTS moment_posted BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_rating TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS feedback_text TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS boost_used BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ─── 5. NEWS: Missing columns ────────────────────────────────────────────────
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_en TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_ru TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID;

-- ─── 6. APP_SETTINGS: Missing columns ────────────────────────────────────────
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS lang_ru BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS notif_seen_at TIMESTAMPTZ;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS ai_matching_prompt TEXT DEFAULT '';

-- Ensure default row exists
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ─── 7. PAYMENTS: Unique constraint ──────────────────────────────────────────
DO $pay$
BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS unique_provider_ref;
    ALTER TABLE payments ADD CONSTRAINT unique_provider_ref UNIQUE (provider_ref);
EXCEPTION WHEN OTHERS THEN NULL;
END $pay$;

-- ─── 8. REFERRALS TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    credited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (referrer_id, referred_id)
);

-- ─── 9. MEETING_FEEDBACK TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    match_id UUID,
    status TEXT NOT NULL CHECK (status IN ('success','fail')),
    rating TEXT,
    note TEXT,
    fail_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 10. AUDIT_LOG TABLE ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 11. REPORTS TABLE ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_report UNIQUE (reporter_id, reported_id, reason)
);

-- ─── 12. BLOCKED_USERS TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id::text != blocked_id)
);

-- ─── 13. STAFF TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'moderator' CHECK (role IN ('admin','moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 14. INDEXES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned) WHERE banned = true;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

CREATE INDEX IF NOT EXISTS idx_matches_user1_created ON matches(user1_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_user2_created ON matches(user2_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_moment_posted ON matches(moment_posted);

CREATE INDEX IF NOT EXISTS idx_moments_status_created ON moments(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moments_user_id ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_status ON moments(status);

CREATE INDEX IF NOT EXISTS idx_payments_user_created ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_likes_from_user ON likes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON likes(to_user_id);

CREATE INDEX IF NOT EXISTS idx_moment_likes_moment ON moment_likes(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_likes_user ON moment_likes(user_id, moment_id);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_id);

CREATE INDEX IF NOT EXISTS idx_mf_status ON meeting_feedback(status);
CREATE INDEX IF NOT EXISTS idx_news_pinned ON news(pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- ─── 15. is_admin() FUNCTION ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $isadmin$
    SELECT EXISTS (
        SELECT 1 FROM staff
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND role IN ('admin', 'moderator')
    )
$isadmin$;

-- ─── 16. is_staff() FUNCTION (alias) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $isstaff$
    SELECT EXISTS (
        SELECT 1 FROM staff WHERE email = auth.email()
    )
$isstaff$;

-- ─── 17. confirm_payment_atomic FUNCTION ─────────────────────────────────────
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
    INSERT INTO payments (user_id, provider_ref, credits, amount, payment_method, provider, status, currency, created_at)
    VALUES (p_user_id, p_payment_intent_id, p_credits, p_amount, p_method, 'airwallex', 'success', 'HKD', NOW());

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
        SELECT coffee_credits INTO v_new_credits FROM profiles WHERE id = p_user_id::text;
        RETURN v_new_credits;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 18. increment_credits FUNCTION ──────────────────────────────────────────
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

-- ─── 19. create_boost_match FUNCTION ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_boost_match(p_user_id UUID, p_partner_id UUID)
RETURNS UUID AS $fn$
DECLARE
    v_match_id UUID;
BEGIN
    -- Deduct 1 credit atomically (profiles.id is TEXT)
    UPDATE profiles
    SET coffee_credits = coffee_credits - 1, updated_at = NOW()
    WHERE id = p_user_id::text AND coffee_credits > 0;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_credits';
    END IF;

    -- Insert match with ordered IDs to prevent duplicates
    -- matches.user1_id and user2_id may be UUID or TEXT depending on setup
    -- Use text comparison for ordering to be safe
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
        CASE WHEN p_user_id::text < p_partner_id::text THEN p_user_id ELSE p_partner_id END,
        CASE WHEN p_user_id::text < p_partner_id::text THEN p_partner_id ELSE p_user_id END
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_match_id;

    RETURN v_match_id;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 20. credit_referral_bonus FUNCTION ──────────────────────────────────────
CREATE OR REPLACE FUNCTION credit_referral_bonus(p_referred_id TEXT)
RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
    v_referrer_id TEXT;
    v_reward INT;
BEGIN
    SELECT referrer_id INTO v_referrer_id
    FROM referrals
    WHERE referred_id = p_referred_id AND credited = false
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
        SELECT COALESCE(reward_referral, 1) INTO v_reward FROM app_settings WHERE id = 1;

        UPDATE profiles
        SET coffee_credits = coffee_credits + v_reward,
            referral_count = referral_count + 1,
            subscription_status = 'active',
            updated_at = NOW()
        WHERE id = v_referrer_id;

        UPDATE profiles
        SET coffee_credits = coffee_credits + 1,
            subscription_status = 'active',
            updated_at = NOW()
        WHERE id = p_referred_id;

        UPDATE referrals
        SET credited = true
        WHERE referrer_id = v_referrer_id AND referred_id = p_referred_id;
    END IF;
END;
$fn$;

-- ─── 21. give_birthday_bonuses FUNCTION ──────────────────────────────────────
CREATE OR REPLACE FUNCTION give_birthday_bonuses()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
    reward INT;
BEGIN
    SELECT COALESCE(reward_birthday, 2) INTO reward FROM app_settings WHERE id = 1;

    UPDATE profiles
    SET coffee_credits = COALESCE(coffee_credits, 0) + reward,
        subscription_status = 'active',
        updated_at = NOW()
    WHERE dob IS NOT NULL
      AND EXTRACT(MONTH FROM dob::date) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(DAY FROM dob::date) = EXTRACT(DAY FROM NOW())
      AND (birthday_bonus_given_at IS NULL
           OR EXTRACT(YEAR FROM birthday_bonus_given_at) < EXTRACT(YEAR FROM NOW()));

    UPDATE profiles
    SET birthday_bonus_given_at = NOW()
    WHERE dob IS NOT NULL
      AND EXTRACT(MONTH FROM dob::date) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(DAY FROM dob::date) = EXTRACT(DAY FROM NOW());
END;
$fn$;

-- ─── 22. generate_referral_code TRIGGER ──────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id || NOW()::text) FROM 1 FOR 8));
    END IF;
    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_referral_code ON profiles;
CREATE TRIGGER trg_referral_code
    BEFORE INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- ─── 23. update_updated_at TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $fn$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_updated_at ON profiles;
CREATE TRIGGER trg_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 24. DASHBOARD MATERIALIZED VIEW ─────────────────────────────────────────
DROP MATERIALIZED VIEW IF EXISTS dashboard_stats CASCADE;

CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
    COUNT(*) AS total_members,
    COUNT(*) FILTER (WHERE subscription_status = 'active') AS active_members,
    COUNT(*) FILTER (WHERE gender = 'male') AS men_count,
    COUNT(*) FILTER (WHERE gender = 'female') AS women_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS new_today,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS new_week,
    COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS new_month,
    COUNT(*) FILTER (
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
          AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    ) AS new_prev_month,
    NOW() AS last_refresh
FROM profiles
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX idx_dashboard_stats_refresh ON dashboard_stats (last_refresh);

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $rfn$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$rfn$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_members BIGINT, active_members BIGINT,
    men_count BIGINT, women_count BIGINT,
    new_today BIGINT, new_week BIGINT,
    new_month BIGINT, new_prev_month BIGINT,
    last_refresh TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $fn$
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;
    RETURN QUERY SELECT ds.total_members, ds.active_members, ds.men_count, ds.women_count,
        ds.new_today, ds.new_week, ds.new_month, ds.new_prev_month, ds.last_refresh
    FROM dashboard_stats ds;
END;
$fn$;

-- ─── 25. ADMIN REPORTS VIEW ───────────────────────────────────────────────────
DROP VIEW IF EXISTS admin_reports_view;

CREATE VIEW admin_reports_view AS
SELECT
    r.id, r.reason, r.status, r.admin_notes, r.created_at, r.updated_at,
    r.reporter_id,
    COALESCE(reporter.name, 'Unknown') AS reporter_name,
    COALESCE(reporter.email, 'No email') AS reporter_email,
    r.reported_id,
    COALESCE(reported.name, 'Unknown') AS reported_name,
    COALESCE(reported.email, 'No email') AS reported_email
FROM reports r
LEFT JOIN profiles reporter ON r.reporter_id::text = reporter.id
LEFT JOIN profiles reported ON r.reported_id = reported.id
ORDER BY r.created_at DESC;

-- ─── 26. RLS ENABLE ──────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- ─── 27. RLS POLICIES ────────────────────────────────────────────────────────
-- TYPE MAP (actual DB types):
--   profiles.id          = TEXT   → auth.uid()::text = id
--   matches.user1_id     = UUID   → auth.uid() = user1_id   (NO cast)
--   matches.user2_id     = UUID   → auth.uid() = user2_id   (NO cast)
--   likes.from_user_id   = UUID   → auth.uid() = from_user_id (NO cast)
--   likes.to_user_id     = UUID   → auth.uid() = to_user_id   (NO cast)
--   moments.user_id      = UUID   → auth.uid() = user_id      (NO cast)
--   moment_likes.user_id = UUID   → auth.uid() = user_id      (NO cast)
--   payments.user_id     = UUID   → auth.uid() = user_id      (NO cast)
--   reports.reporter_id  = UUID   → auth.uid() = reporter_id  (NO cast)
--   blocked_users.blocker_id = UUID → auth.uid() = blocker_id (NO cast)
--   meeting_feedback.user_id = TEXT → auth.uid()::text = user_id

-- ── profiles (id = TEXT → must cast auth.uid()) ───────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_read" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_self_write" ON profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;

CREATE POLICY "profiles_public_select"
    ON profiles FOR SELECT
    USING ((deleted_at IS NULL OR deleted_at > NOW()) AND (banned IS NULL OR banned = false));

CREATE POLICY "profiles_own_update"
    ON profiles FOR UPDATE
    USING (auth.uid()::text = id);  -- TEXT cast required

CREATE POLICY "profiles_own_insert"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid()::text = id);  -- TEXT cast required

CREATE POLICY "profiles_admin_select"
    ON profiles FOR SELECT TO authenticated
    USING (is_admin());

CREATE POLICY "profiles_admin_update"
    ON profiles FOR UPDATE TO authenticated
    USING (is_admin());

-- ── matches (user1_id/user2_id — handle both UUID and TEXT safely) ────────────
DROP POLICY IF EXISTS "Users can view own matches" ON matches;
DROP POLICY IF EXISTS "Users can update own matches" ON matches;
DROP POLICY IF EXISTS "matches_read" ON matches;
DROP POLICY IF EXISTS "matches_select" ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;

-- Cast both sides to text to handle UUID or TEXT column types
CREATE POLICY "matches_select"
    ON matches FOR SELECT
    USING (
        auth.uid()::text = user1_id::text
        OR auth.uid()::text = user2_id::text
        OR is_admin()
    );

CREATE POLICY "matches_own_update"
    ON matches FOR UPDATE
    USING (
        auth.uid()::text = user1_id::text
        OR auth.uid()::text = user2_id::text
    );

CREATE POLICY "matches_insert"
    ON matches FOR INSERT
    WITH CHECK (true);

-- ── likes (from_user_id — handle both UUID and TEXT safely) ──────────────────
DROP POLICY IF EXISTS "Users can view own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "likes_insert" ON likes;
DROP POLICY IF EXISTS "likes_select" ON likes;
DROP POLICY IF EXISTS "likes_delete" ON likes;

CREATE POLICY "likes_select" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON likes FOR INSERT
    WITH CHECK (auth.uid()::text = from_user_id::text);
CREATE POLICY "likes_delete" ON likes FOR DELETE
    USING (auth.uid()::text = from_user_id::text);

-- ── moments (user_id — handle both UUID and TEXT safely) ─────────────────────
DROP POLICY IF EXISTS "Approved moments are viewable by everyone" ON moments;
DROP POLICY IF EXISTS "Users can insert own moments" ON moments;
DROP POLICY IF EXISTS "Users can update own moments" ON moments;
DROP POLICY IF EXISTS "Users can delete own moments" ON moments;
DROP POLICY IF EXISTS "moments_select" ON moments;
DROP POLICY IF EXISTS "moments_insert" ON moments;
DROP POLICY IF EXISTS "moments_update" ON moments;
DROP POLICY IF EXISTS "moments_delete" ON moments;

CREATE POLICY "moments_select" ON moments FOR SELECT
    USING (status = 'approved' OR auth.uid()::text = user_id::text OR is_admin());

CREATE POLICY "moments_insert" ON moments FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text OR is_admin());

CREATE POLICY "moments_update" ON moments FOR UPDATE
    USING (auth.uid()::text = user_id::text OR is_admin());

CREATE POLICY "moments_delete" ON moments FOR DELETE
    USING (auth.uid()::text = user_id::text OR is_admin());

-- ── moment_likes (user_id — handle both UUID and TEXT safely) ─────────────────
DROP POLICY IF EXISTS "moment_likes_select" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_insert" ON moment_likes;
DROP POLICY IF EXISTS "moment_likes_delete" ON moment_likes;

CREATE POLICY "moment_likes_select" ON moment_likes FOR SELECT USING (true);
CREATE POLICY "moment_likes_insert" ON moment_likes FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "moment_likes_delete" ON moment_likes FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- ── payments (user_id type unknown — handle both UUID and TEXT safely) ─────────
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "payments_read" ON payments;
DROP POLICY IF EXISTS "payments_self_read" ON payments;

-- payments.user_id is TEXT in supabase_setup.sql → cast auth.uid() to text
CREATE POLICY "payments_read" ON payments FOR SELECT
    USING (auth.uid()::text = user_id::text OR is_admin());

-- ── reports (reporter_id = UUID → NO cast) ────────────────────────────────────
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Admin can view all reports" ON reports;
DROP POLICY IF EXISTS "Admin can update reports" ON reports;
DROP POLICY IF EXISTS "reports_insert" ON reports;
DROP POLICY IF EXISTS "reports_select" ON reports;
DROP POLICY IF EXISTS "reports_admin_update" ON reports;

CREATE POLICY "reports_insert" ON reports FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = reporter_id::text);

CREATE POLICY "reports_select" ON reports FOR SELECT TO authenticated
    USING (auth.uid()::text = reporter_id::text OR is_admin());

CREATE POLICY "reports_admin_update" ON reports FOR UPDATE TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── blocked_users (blocker_id = UUID → NO cast) ───────────────────────────────
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can view their blocks" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;
DROP POLICY IF EXISTS "blocked_insert" ON blocked_users;
DROP POLICY IF EXISTS "blocked_select" ON blocked_users;
DROP POLICY IF EXISTS "blocked_delete" ON blocked_users;

CREATE POLICY "blocked_insert" ON blocked_users FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = blocker_id::text);

CREATE POLICY "blocked_select" ON blocked_users FOR SELECT TO authenticated
    USING (auth.uid()::text = blocker_id::text);

CREATE POLICY "blocked_delete" ON blocked_users FOR DELETE TO authenticated
    USING (auth.uid()::text = blocker_id::text);

-- ── meeting_feedback (user_id = TEXT → must cast auth.uid()) ─────────────────
DROP POLICY IF EXISTS "mf_insert" ON meeting_feedback;
DROP POLICY IF EXISTS "mf_select" ON meeting_feedback;

CREATE POLICY "mf_insert" ON meeting_feedback FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);  -- TEXT cast required

CREATE POLICY "mf_select" ON meeting_feedback FOR SELECT
    USING (auth.uid()::text = user_id OR is_admin());  -- TEXT cast required

-- ── news (public read, admin write) ──────────────────────────────────────────
DROP POLICY IF EXISTS "news_public_read" ON news;
DROP POLICY IF EXISTS "news_auth_write" ON news;

CREATE POLICY "news_public_read" ON news FOR SELECT USING (true);
CREATE POLICY "news_admin_write" ON news FOR ALL USING (is_admin());

-- ── app_settings (authenticated read, admin write) ────────────────────────────
DROP POLICY IF EXISTS "Anyone can read settings" ON app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON app_settings;
DROP POLICY IF EXISTS "settings_public_read" ON app_settings;
DROP POLICY IF EXISTS "settings_auth_write" ON app_settings;

CREATE POLICY "settings_read" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings_admin_write" ON app_settings FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ── staff (public read, admin write) ─────────────────────────────────────────
DROP POLICY IF EXISTS "Admin can manage staff" ON staff;
DROP POLICY IF EXISTS "staff_select_all" ON staff;
DROP POLICY IF EXISTS "staff_admin_write" ON staff;
DROP POLICY IF EXISTS "staff_auth_all" ON staff;

CREATE POLICY "staff_select_all" ON staff FOR SELECT USING (true);
CREATE POLICY "staff_admin_write" ON staff FOR ALL TO authenticated
    USING (is_admin()) WITH CHECK (is_admin());

-- ─── 28. GRANTS ───────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION increment_credits TO authenticated;
GRANT EXECUTE ON FUNCTION create_boost_match TO authenticated;
GRANT EXECUTE ON FUNCTION credit_referral_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff TO authenticated;
GRANT ALL ON reports TO authenticated;
GRANT ALL ON blocked_users TO authenticated;
GRANT SELECT ON admin_reports_view TO authenticated;

-- ─── 29. REVOKE PUBLIC ACCESS FROM DASHBOARD STATS ───────────────────────────
REVOKE ALL ON dashboard_stats FROM anon;
REVOKE ALL ON dashboard_stats FROM authenticated;
GRANT SELECT ON dashboard_stats TO postgres;

-- ─── 30. REFRESH DASHBOARD STATS ─────────────────────────────────────────────
SELECT refresh_dashboard_stats();

-- ─── DONE ─────────────────────────────────────────────────────────────────────
DO $done$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COMPLETE FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All missing columns, functions, and policies added.';
    RAISE NOTICE 'Next: Create storage buckets (avatars, photos, moments)';
    RAISE NOTICE 'Next: Enable pg_cron and schedule birthday bonus';
    RAISE NOTICE 'Next: Insert admin emails into staff table';
END $done$;
