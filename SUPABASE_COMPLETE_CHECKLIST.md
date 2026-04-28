# Supabase Complete Database Checklist

## ✅ REQUIRED TABLES

### 1. profiles (TEXT id)
```sql
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,  -- Supabase auth.uid()::text
    phone TEXT UNIQUE,
    name TEXT,
    dob TEXT,  -- ISO date string
    gender TEXT CHECK (gender IN ('male','female')),
    about TEXT,
    gives TEXT,
    wants TEXT,
    about_zh TEXT,  -- Chinese translation
    gives_zh TEXT,
    wants_zh TEXT,
    about_ru TEXT,  -- Russian translation ✅ NEW
    gives_ru TEXT,  -- ✅ NEW
    wants_ru TEXT,  -- ✅ NEW
    balance TEXT DEFAULT '50_50' CHECK (balance IN ('30_70','50_50','70_30')),
    wechat TEXT,
    whatsapp TEXT,
    show_age BOOLEAN DEFAULT TRUE,
    dating_mode BOOLEAN DEFAULT FALSE,
    dating_gender TEXT DEFAULT 'women' CHECK (dating_gender IN ('men','women')),
    languages TEXT[] DEFAULT ARRAY['EN'],
    region TEXT DEFAULT 'Hong Kong',
    city TEXT,
    email TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags JSONB DEFAULT '[]'::jsonb,
    -- Subscription
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','empty')),
    coffee_credits INT DEFAULT 2,
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    -- Referral
    referral_code TEXT UNIQUE,
    referred_by TEXT REFERENCES profiles(id),
    referral_count INT DEFAULT 0,
    -- Notifications
    notif_new_matches BOOLEAN DEFAULT TRUE,
    notif_important_news BOOLEAN DEFAULT TRUE,
    -- Boost
    boost_active BOOLEAN DEFAULT FALSE,
    -- Admin
    banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    banned_at TIMESTAMPTZ,
    birthday_bonus_given_at TIMESTAMPTZ,  -- ✅ REQUIRED for birthday bonus
    deleted_at TIMESTAMPTZ,
    -- Meta
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. payments (UUID user_id)
```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,  -- auth.uid() directly
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'HKD',
    credits INT NOT NULL,
    payment_method TEXT,
    provider TEXT DEFAULT 'airwallex',
    provider_ref TEXT UNIQUE,  -- ✅ REQUIRED for duplicate prevention
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. referrals (TEXT ids)
```sql
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    credited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (referrer_id, referred_id)
);
```

### 4. matches (UUID ids)
```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    moment_posted BOOLEAN DEFAULT FALSE,  -- ✅ REQUIRED
    feedback_rating TEXT,
    feedback_text TEXT,
    boost_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    UNIQUE (user1_id, user2_id)
);
```

### 5. likes (UUID ids)
```sql
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (from_user_id, to_user_id)
);
```

### 6. moments (UUID user_id)
```sql
CREATE TABLE moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    text_en TEXT,
    text_zh TEXT,
    text_ru TEXT,  -- ✅ REQUIRED
    image_url TEXT,
    image_urls TEXT[],
    likes_count INT DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reject_reason TEXT,
    is_admin_post BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. moment_likes (UUID ids)
```sql
CREATE TABLE moment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    moment_id UUID NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
    emoji TEXT DEFAULT '❤️',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, moment_id, emoji)
);
```

### 8. reports (UUID reporter_id, TEXT reported_id)
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id TEXT NOT NULL,  -- TEXT to match profiles.id
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_report UNIQUE (reporter_id, reported_id, reason)
);
```

### 9. blocked_users (UUID blocker_id, TEXT blocked_id)
```sql
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL,  -- TEXT to match profiles.id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id::text != blocked_id)
);
```

### 10. meeting_feedback (TEXT user_id)
```sql
CREATE TABLE meeting_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,  -- TEXT to match profiles.id
    match_id UUID,
    status TEXT NOT NULL CHECK (status IN ('success','fail')),
    rating TEXT,
    note TEXT,
    fail_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. news
```sql
CREATE TABLE news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    text_en TEXT,  -- ✅ REQUIRED
    text_zh TEXT,
    text_ru TEXT,  -- ✅ REQUIRED
    image_url TEXT,
    pinned BOOLEAN DEFAULT FALSE,
    moment_id UUID REFERENCES moments(id) ON DELETE SET NULL,  -- ✅ REQUIRED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 12. app_settings
```sql
CREATE TABLE app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    standard_price NUMERIC DEFAULT 15,
    standard_cups INT DEFAULT 1,
    best_price NUMERIC DEFAULT 30,
    best_cups INT DEFAULT 3,
    reward_referral INT DEFAULT 1,
    reward_birthday INT DEFAULT 2,
    reward_post INT DEFAULT 1,
    lang_en BOOLEAN DEFAULT TRUE,
    lang_zh BOOLEAN DEFAULT TRUE,
    lang_ru BOOLEAN DEFAULT FALSE,  -- ✅ REQUIRED
    ai_matching_prompt TEXT DEFAULT '',
    notif_seen_at TIMESTAMPTZ,  -- ✅ REQUIRED for admin notifications
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
```

### 13. staff
```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'moderator' CHECK (role IN ('admin','moderator')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 14. audit_log
```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 15. dashboard_stats (Materialized View)
```sql
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
```

---

## ✅ REQUIRED FUNCTIONS

### 1. confirm_payment_atomic(UUID, TEXT, INT, DECIMAL, TEXT) → INT
- Atomically inserts payment and increments credits
- Prevents duplicate payments via unique constraint
- **CRITICAL:** profiles.id is TEXT, so `WHERE id = p_user_id::text`

### 2. increment_credits(UUID, INT) → INT
- Atomically increments credits
- Used for referral rewards, birthday bonus
- **CRITICAL:** profiles.id is TEXT, so `WHERE id = p_user_id::text`

### 3. create_boost_match(UUID, UUID) → UUID
- Atomically creates match and deducts 1 credit
- Prevents race conditions
- **CRITICAL:** profiles.id is TEXT, so `WHERE id = p_user_id::text`

### 4. credit_referral_bonus(TEXT) → void
- Awards +1 credit to referrer and referred user
- Called after first payment
- Marks referral as credited

### 5. give_birthday_bonuses() → void
- Runs daily via pg_cron at 09:00 UTC
- Awards birthday bonus to users whose birthday is today
- **REQUIRES:** `birthday_bonus_given_at` column in profiles

### 6. refresh_dashboard_stats() → void
- Refreshes materialized view
- Admin-only access

### 7. get_dashboard_stats() → TABLE
- Secure wrapper for dashboard_stats view
- Admin-only access
- Returns aggregate stats

### 8. is_admin() → BOOLEAN
- Checks if current user is in staff table
- Used in RLS policies

### 9. generate_referral_code() → TRIGGER
- Auto-generates referral code on profile insert

### 10. update_updated_at() → TRIGGER
- Auto-updates updated_at on profile update

### 11. check_and_create_match() → TRIGGER
- Auto-creates match when mutual like exists

---

## ✅ REQUIRED VIEWS

### 1. admin_reports_view
```sql
CREATE VIEW admin_reports_view AS
SELECT 
    r.id, r.reason, r.status, r.admin_notes, r.created_at, r.updated_at,
    r.reporter_id,
    COALESCE(reporter.name, 'Unknown') as reporter_name,
    COALESCE(reporter.email, 'No email') as reporter_email,
    r.reported_id,
    COALESCE(reported.name, 'Unknown') as reported_name,
    COALESCE(reported.email, 'No email') as reported_email
FROM reports r
LEFT JOIN profiles reporter ON r.reporter_id::text = reporter.id
LEFT JOIN profiles reported ON r.reported_id = reported.id
ORDER BY r.created_at DESC;
```

---

## ✅ REQUIRED INDEXES

### profiles
- idx_profiles_subscription_status
- idx_profiles_created_at
- idx_profiles_region
- idx_profiles_banned
- idx_profiles_email
- idx_profiles_search (GIN for full-text)
- idx_profiles_phone
- idx_profiles_referral_code

### matches
- idx_matches_user1_created
- idx_matches_user2_created
- idx_matches_status
- idx_matches_composite
- idx_matches_moment_posted ✅ REQUIRED

### moments
- idx_moments_status_created
- idx_moments_user_id
- idx_moments_admin_posts
- idx_moments_status

### payments
- idx_payments_user_created
- idx_payments_created_at
- idx_payments_user_id

### likes
- idx_likes_from_user
- idx_likes_to_user
- idx_likes_mutual

### moment_likes
- idx_moment_likes_moment
- idx_moment_likes_user

### reports
- idx_reports_reporter
- idx_reports_reported
- idx_reports_status
- idx_reports_created

### blocked_users
- idx_blocked_blocker
- idx_blocked_blocked
- idx_blocked_created

### meeting_feedback
- idx_mf_status

### news
- idx_news_pinned

### staff
- idx_staff_email

### audit_log
- idx_audit_log_table_record
- idx_audit_log_created_at

---

## ✅ REQUIRED RLS POLICIES

### profiles
- "Public profiles are viewable by everyone" (SELECT) - deleted_at IS NULL AND banned = false
- "Users can update own profile" (UPDATE) - auth.uid()::text = id
- "Admin can read all profiles" (SELECT) - is_admin()
- "Admin can update all profiles" (UPDATE) - is_admin()

### matches
- "Users can view own matches" (SELECT) - auth.uid() = user1_id OR user2_id
- "Users can update own matches" (UPDATE) - auth.uid() = user1_id OR user2_id

### likes
- "Users can view own likes" (SELECT) - auth.uid() = from_user_id
- "Users can insert own likes" (INSERT) - auth.uid() = from_user_id
- "Users can delete own likes" (DELETE) - auth.uid() = from_user_id

### moments
- "Approved moments are viewable by everyone" (SELECT) - status = 'approved' OR auth.uid() = user_id
- "Users can insert own moments" (INSERT) - auth.uid() = user_id
- "Users can update own moments" (UPDATE) - auth.uid() = user_id
- "Users can delete own moments" (DELETE) - auth.uid() = user_id

### moment_likes
- "moment_likes_select" (SELECT) - true
- "moment_likes_insert" (INSERT) - auth.uid() = user_id
- "moment_likes_delete" (DELETE) - auth.uid() = user_id

### payments
- "Users can view own payments" (SELECT) - auth.uid() = user_id

### reports
- "Users can create reports" (INSERT) - auth.uid() = reporter_id
- "Users can view their own reports" (SELECT) - auth.uid() = reporter_id OR is_admin()
- "Admin can update reports" (UPDATE) - is_admin()

### blocked_users
- "Users can block others" (INSERT) - auth.uid() = blocker_id
- "Users can view their blocks" (SELECT) - auth.uid() = blocker_id
- "Users can unblock" (DELETE) - auth.uid() = blocker_id

### meeting_feedback
- "mf_insert" (INSERT) - auth.uid()::text = user_id
- "mf_select" (SELECT) - auth.uid()::text = user_id OR is_admin()

### news
- "news_public_read" (SELECT) - true
- "news_auth_write" (ALL) - is_admin()

### app_settings
- "Anyone can read settings" (SELECT) - true
- "Admin can update settings" (UPDATE) - is_admin()

### staff
- "Admin can manage staff" (ALL) - is_admin()

---

## ✅ REQUIRED STORAGE BUCKETS

### 1. avatars (public)
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;
```

### 2. photos (public)
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT DO NOTHING;
```

### 3. moments (public)
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('moments', 'moments', true)
ON CONFLICT DO NOTHING;
```

---

## ✅ REQUIRED EXTENSIONS

### 1. pg_cron (for birthday bonus)
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'birthday-bonus-daily',
    '0 9 * * *',
    'SELECT give_birthday_bonuses()'
);
```

---

## ✅ REQUIRED GRANTS

```sql
GRANT EXECUTE ON FUNCTION confirm_payment_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION increment_credits TO authenticated;
GRANT EXECUTE ON FUNCTION create_boost_match TO authenticated;
GRANT EXECUTE ON FUNCTION credit_referral_bonus TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION give_birthday_bonuses TO postgres;

GRANT ALL ON reports TO authenticated;
GRANT ALL ON blocked_users TO authenticated;
GRANT SELECT ON admin_reports_view TO authenticated;
```

---

## ⚠️ CRITICAL TYPE MISMATCHES TO FIX

### profiles.id = TEXT (not UUID!)
All comparisons with auth.uid() must cast:
- ✅ `auth.uid()::text = profiles.id`
- ❌ `auth.uid() = profiles.id` (will fail!)

### matches.user1_id / user2_id = UUID
- ✅ `auth.uid() = matches.user1_id`
- ❌ `auth.uid()::text = matches.user1_id` (wrong!)

### payments.user_id = UUID
- ✅ `auth.uid() = payments.user_id`

### likes.from_user_id / to_user_id = UUID
- ✅ `auth.uid() = likes.from_user_id`

### moments.user_id = UUID
- ✅ `auth.uid() = moments.user_id`

### reports.reporter_id = UUID, reported_id = TEXT
- ✅ `auth.uid() = reports.reporter_id`
- ✅ `reports.reported_id = profiles.id` (both TEXT)

### blocked_users.blocker_id = UUID, blocked_id = TEXT
- ✅ `auth.uid() = blocked_users.blocker_id`
- ✅ `blocked_users.blocked_id = profiles.id` (both TEXT)

### meeting_feedback.user_id = TEXT
- ✅ `auth.uid()::text = meeting_feedback.user_id`

---

## 📋 MIGRATION EXECUTION ORDER

Run these in Supabase SQL Editor in this exact order:

1. ✅ `supabase_setup.sql` - Core tables (profiles, payments, referrals, matches)
2. ✅ `supabase_stage2.sql` - Likes, moments, moment_likes
3. ✅ `supabase_admin_setup.sql` - Admin tables (news, app_settings, staff, meeting_feedback)
4. ✅ `supabase_translations.sql` - Chinese translation columns
5. ✅ `supabase_add_text_en.sql` - English translation columns for moments
6. ✅ `supabase_increment_credits.sql` - Atomic credit increment function
7. ✅ `supabase_birthday_bonus.sql` - Birthday bonus function + cron
8. ✅ `001_critical_security.sql` - Payment security, dashboard stats, audit log
9. ✅ `002_indexes.sql` - Performance indexes
10. ✅ `003_row_level_security.sql` - RLS policies
11. ✅ `005_fix_admin_rls.sql` - Admin RLS fixes, is_admin() function
12. ✅ `006_fix_functions_cast.sql` - Type casting fixes for all functions
13. ✅ `008_dashboard_stats_rls.sql` - Secure dashboard stats access
14. ✅ `ADD_REPORTS_AND_BLOCKS.sql` OR `FIX_REPORTS_TYPES.sql` - Reports and blocks
15. ✅ `ADD_MOMENT_POSTED_TRACKING.sql` - moment_posted column
16. ✅ `ADD_RUSSIAN_TRANSLATIONS.sql` - Russian translation columns for profiles
17. ✅ `ADD_LANG_RU_SETTING.sql` - Russian language setting + missing news columns

---

## ❌ POTENTIAL MISSING ITEMS

### 1. profiles table columns
- ✅ `about_ru`, `gives_ru`, `wants_ru` - Added in ADD_RUSSIAN_TRANSLATIONS.sql
- ✅ `birthday_bonus_given_at` - Added in supabase_birthday_bonus.sql
- ✅ `banned`, `ban_reason`, `banned_at` - Added in supabase_admin_setup.sql
- ✅ `deleted_at` - Added in 001_critical_security.sql
- ✅ `tags` - Added in supabase_stage2.sql
- ✅ `city` - Should exist from supabase_setup.sql (check if missing!)

### 2. moments table columns
- ✅ `text_en`, `text_zh` - Added in supabase_add_text_en.sql
- ✅ `text_ru` - Should be added (check if missing!)
- ✅ `image_urls` - Added in supabase_add_text_en.sql
- ✅ `status`, `reject_reason` - Added in supabase_admin_setup.sql
- ✅ `is_admin_post` - Should exist (check if missing!)

### 3. matches table columns
- ✅ `status` - Added in supabase_add_text_en.sql
- ✅ `moment_posted` - Added in ADD_MOMENT_POSTED_TRACKING.sql
- ✅ `feedback_rating`, `feedback_text` - Added in supabase_admin_setup.sql
- ✅ `updated_at` - Added in supabase_add_text_en.sql

### 4. news table columns
- ⚠️ `text_en` - MISSING! Add in ADD_LANG_RU_SETTING.sql
- ⚠️ `text_ru` - MISSING! Add in ADD_LANG_RU_SETTING.sql
- ⚠️ `moment_id` - MISSING! Add in ADD_LANG_RU_SETTING.sql

### 5. app_settings table columns
- ⚠️ `lang_ru` - MISSING! Add in ADD_LANG_RU_SETTING.sql
- ⚠️ `notif_seen_at` - MISSING! Add in ADD_LANG_RU_SETTING.sql

### 6. moment_likes table columns
- ⚠️ `emoji` - MISSING! Should be added (currently defaults to '❤️' in code)

---

## 🔧 QUICK FIX SQL (Run this to add all missing items)

```sql
-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS about_ru TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gives_ru TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wants_ru TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday_bonus_given_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- moments
ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_ru TEXT;
ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT FALSE;

-- news
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_en TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS text_ru TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS moment_id UUID REFERENCES moments(id) ON DELETE SET NULL;

-- app_settings
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS lang_ru BOOLEAN DEFAULT FALSE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS notif_seen_at TIMESTAMPTZ;

-- moment_likes
ALTER TABLE moment_likes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';
```

---

## 🎯 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Run all migrations in order (1-17)
- [ ] Run QUICK FIX SQL above
- [ ] Create storage buckets (avatars, photos, moments)
- [ ] Enable pg_cron extension
- [ ] Schedule birthday bonus cron job
- [ ] Insert admin emails into staff table
- [ ] Verify all functions exist: `\df` in psql
- [ ] Verify all tables exist: `\dt` in psql
- [ ] Test referral system (create referral, apply code, check credit)
- [ ] Test birthday bonus (manually run `SELECT give_birthday_bonuses()`)
- [ ] Test post creation reward (approve moment, check credit)
- [ ] Test payment flow (mock payment, check credit increment)
- [ ] Test boost match (boost search, check credit deduction)
- [ ] Test reports and blocks (report user, block user)
- [ ] Test Russian translations (change language, view profiles)
- [ ] Verify RLS policies work (try accessing other user's data)
- [ ] Check admin panel loads (dashboard, members, moments, settings)
- [ ] Verify toggle switches work in admin settings

---

## 🚨 KNOWN ISSUES

### 1. Type Inconsistency
- `profiles.id` is TEXT
- `matches.user1_id`, `matches.user2_id` are UUID
- `likes.from_user_id`, `likes.to_user_id` are UUID
- `moments.user_id` is UUID
- This creates casting complexity — consider migrating profiles.id to UUID

### 2. Missing Emoji Column
- `moment_likes` table doesn't have `emoji` column in some migrations
- Code assumes emoji exists and defaults to '❤️'
- Add: `ALTER TABLE moment_likes ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '❤️';`

### 3. Missing is_admin_post Column
- `moments` table may not have `is_admin_post` column
- Admin news posts need this flag
- Add: `ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_admin_post BOOLEAN DEFAULT FALSE;`

### 4. Missing text_ru in moments
- `moments` table has `text_en` and `text_zh` but not `text_ru`
- Russian users won't see translated posts
- Add: `ALTER TABLE moments ADD COLUMN IF NOT EXISTS text_ru TEXT;`

---

## 📝 FINAL NOTES

- All migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` - safe to re-run
- Type casting is critical: profiles.id is TEXT, most other user_id fields are UUID
- Birthday bonus requires pg_cron extension and scheduled job
- Referral bonus is triggered by first payment (non-blocking)
- Post creation reward is manual in admin code (no trigger)
- Dashboard stats are cached in materialized view (refresh every 5 min recommended)
- Admin access controlled by staff table + is_admin() function
- All sensitive operations use SECURITY DEFINER functions
