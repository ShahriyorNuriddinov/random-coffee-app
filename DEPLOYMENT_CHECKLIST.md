# 🚀 Deployment Checklist - Random Coffee HK

## Pre-Deployment: Supabase Database Setup

### Step 1: Run SQL Files in Order

Execute these SQL files in your Supabase SQL Editor in this exact order:

#### 1️⃣ Core Setup (Required)
```sql
-- File: supabase_setup.sql
-- Creates: profiles, payments, referrals, matches tables
-- Includes: referral_code auto-generation, credit_referral_bonus() function
```

#### 2️⃣ Stage 2 Tables (Required)
```sql
-- File: supabase_stage2.sql
-- Creates: likes, matches (updated), moments, moment_likes tables
-- Includes: check_and_create_match() trigger for mutual likes
```

#### 3️⃣ Admin Setup (Required)
```sql
-- File: supabase_admin_setup.sql
-- Creates: staff, app_settings, news, meeting_feedback tables
-- Adds: banned, email columns to profiles
-- Adds: status, reject_reason, image_urls, text_en, text_zh to moments
-- Includes: is_staff() function for admin RLS
```

#### 4️⃣ Critical Security (Required)
```sql
-- File: supabase/migrations/001_critical_security.sql
-- Creates: confirm_payment_atomic() function
-- Creates: dashboard_stats materialized view
-- Adds: Payment unique constraint
-- Updates: RLS policies for all tables
```

#### 5️⃣ Performance Indexes (Required)
```sql
-- File: supabase/migrations/002_indexes.sql
-- Creates: Performance indexes on all tables
```

#### 6️⃣ Row Level Security (Required)
```sql
-- File: supabase/migrations/003_row_level_security.sql
-- Updates: All RLS policies with correct TEXT/UUID casting
```

#### 7️⃣ Boost Match Atomic (Required)
```sql
-- File: supabase/migrations/004_boost_match_atomic.sql
-- Creates: create_boost_match() atomic function
```

#### 8️⃣ Function Fixes (Required)
```sql
-- File: supabase/migrations/006_fix_functions_cast.sql
-- Fixes: UUID/TEXT casting in all functions
-- Updates: confirm_payment_atomic(), increment_credits(), create_boost_match()
```

#### 9️⃣ Dashboard Stats RLS (Required)
```sql
-- File: supabase/migrations/008_dashboard_stats_rls.sql
-- Adds: RLS policy for dashboard_stats view
```

#### 🔟 Reports and Blocks (Required)
```sql
-- File: supabase/migrations/ADD_REPORTS_AND_BLOCKS.sql
-- Creates: reports, blocked_users tables
-- Creates: admin_reports_view for admin panel
```

#### 1️⃣1️⃣ Ban Fields (Required)
```sql
-- File: supabase/migrations/ADD_BAN_FIELDS.sql
-- Adds: banned, ban_reason, banned_at, banned_by to profiles
```

#### 1️⃣2️⃣ Moment Posted Tracking (Required)
```sql
-- File: supabase/migrations/ADD_MOMENT_POSTED_TRACKING.sql
-- Adds: moment_posted column to matches table
```

#### 1️⃣3️⃣ Russian Translations (NEW - Required)
```sql
-- File: supabase/migrations/ADD_RUSSIAN_TRANSLATIONS.sql
-- Adds: about_ru, gives_ru, wants_ru columns to profiles
```

#### 1️⃣4️⃣ Birthday Bonus (Optional - Requires pg_cron)
```sql
-- File: supabase_birthday_bonus.sql
-- Creates: give_birthday_bonuses() function
-- Adds: birthday_bonus_given_at column to profiles
-- Sets up: Daily cron job at 09:00 UTC
-- NOTE: Requires pg_cron extension enabled
```

#### 1️⃣5️⃣ Increment Credits Function (Required)
```sql
-- File: supabase_increment_credits.sql
-- Creates: increment_credits() atomic function
-- Used by: referral system, birthday bonus, admin actions
```

---

## Step 2: Verify Database Structure

Run this query to check all required columns exist:

```sql
-- Check profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check app_settings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_settings' 
ORDER BY ordinal_position;

-- Check referrals table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referrals' 
ORDER BY ordinal_position;

-- Check reports table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reports' 
ORDER BY ordinal_position;

-- Check blocked_users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'blocked_users' 
ORDER BY ordinal_position;
```

### Required Columns Checklist:

**profiles table:**
- ✅ id (TEXT, PK)
- ✅ coffee_credits (INT, default 2)
- ✅ subscription_status (TEXT, default 'trial')
- ✅ referral_code (TEXT, unique)
- ✅ referred_by (TEXT, FK)
- ✅ referral_count (INT, default 0)
- ✅ about_zh, gives_zh, wants_zh (TEXT) - Chinese translations
- ✅ about_ru, gives_ru, wants_ru (TEXT) - Russian translations (NEW)
- ✅ banned (BOOLEAN, default false)
- ✅ ban_reason (TEXT)
- ✅ banned_at (TIMESTAMPTZ)
- ✅ banned_by (TEXT)
- ✅ birthday_bonus_given_at (TIMESTAMPTZ)
- ✅ deleted_at (TIMESTAMPTZ)

**app_settings table:**
- ✅ id (INT, PK, default 1)
- ✅ reward_referral (INT, default 1)
- ✅ reward_birthday (INT, default 2)
- ✅ reward_post (INT, default 1)
- ✅ standard_price (NUMERIC, default 15)
- ✅ standard_cups (INT, default 1)
- ✅ best_price (NUMERIC, default 30)
- ✅ best_cups (INT, default 3)
- ✅ lang_en (BOOLEAN, default TRUE)
- ✅ lang_zh (BOOLEAN, default TRUE)
- ✅ ai_matching_prompt (TEXT)

**referrals table:**
- ✅ id (UUID, PK)
- ✅ referrer_id (TEXT, FK to profiles.id)
- ✅ referred_id (TEXT, FK to profiles.id)
- ✅ credited (BOOLEAN, default false)
- ✅ created_at (TIMESTAMPTZ)
- ✅ UNIQUE(referrer_id, referred_id)

**reports table:**
- ✅ id (UUID, PK)
- ✅ reporter_id (TEXT, FK to profiles.id)
- ✅ reported_id (TEXT, FK to profiles.id)
- ✅ reason (TEXT)
- ✅ status (TEXT, default 'pending')
- ✅ admin_notes (TEXT)
- ✅ created_at (TIMESTAMPTZ)

**blocked_users table:**
- ✅ id (UUID, PK)
- ✅ blocker_id (TEXT, FK to profiles.id)
- ✅ blocked_id (TEXT, FK to profiles.id)
- ✅ created_at (TIMESTAMPTZ)
- ✅ UNIQUE(blocker_id, blocked_id)

---

## Step 3: Verify Functions Exist

Run this query:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'confirm_payment_atomic',
    'increment_credits',
    'credit_referral_bonus',
    'create_boost_match',
    'give_birthday_bonuses',
    'is_staff',
    'refresh_dashboard_stats'
)
ORDER BY routine_name;
```

### Required Functions:
- ✅ `confirm_payment_atomic(p_user_id UUID, ...)` - Atomic payment processing
- ✅ `increment_credits(p_user_id UUID, p_credits INT)` - Atomic credit increment
- ✅ `credit_referral_bonus(p_referred_id TEXT)` - Award referral bonus
- ✅ `create_boost_match(p_user_id UUID, ...)` - Atomic boost match creation
- ✅ `give_birthday_bonuses()` - Daily birthday bonus (optional)
- ✅ `is_staff()` - Check if current user is admin
- ✅ `refresh_dashboard_stats()` - Refresh materialized view

---

## Step 4: Insert Admin Staff

```sql
-- Add your admin emails to staff table
INSERT INTO staff (name, email, role) VALUES
  ('Admin Name', 'your-email@example.com', 'admin')
ON CONFLICT (email) DO NOTHING;
```

---

## Step 5: Create Storage Buckets

In Supabase Dashboard → Storage:

1. Create bucket: `avatars` (Public)
2. Create bucket: `photos` (Public)
3. Create bucket: `moments` (Public)

Or run:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('photos', 'photos', true),
  ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;
```

---

## Step 6: Environment Variables

Create `.env` file with:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-key
VITE_OPENAI_API_KEY=your-openai-key
VITE_AIRWALLEX_CLIENT_ID=your-airwallex-id
```

---

## Step 7: Build and Deploy

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to your hosting (Vercel/Netlify/Render)
# Or test locally:
npm run preview
```

---

## Post-Deployment Verification

### Test User Flow:
1. ✅ Register with email OTP
2. ✅ Complete profile (name, dob, gender, region)
3. ✅ Fill profile details (about, gives, wants)
4. ✅ Upload avatar
5. ✅ Browse people
6. ✅ Send interest
7. ✅ Use boost search
8. ✅ Post moment
9. ✅ Buy credits
10. ✅ Apply referral code

### Test Admin Flow:
1. ✅ Login with admin email
2. ✅ View dashboard stats
3. ✅ Manage members
4. ✅ Approve/reject moments
5. ✅ Create news posts
6. ✅ Handle reports
7. ✅ Update settings
8. ✅ Manage staff

### Test Features:
- ✅ Referral system (apply code, get bonus)
- ✅ Birthday bonus (if cron enabled)
- ✅ Post creation reward (+1 credit on approval)
- ✅ Block/report users
- ✅ Russian language support
- ✅ AI translations
- ✅ Payment processing
- ✅ Boost search

---

## Known Issues & Limitations

### ⚠️ Birthday Bonus
- Requires `pg_cron` extension (may not be available on all Supabase plans)
- Alternative: Use Supabase Edge Function with scheduled trigger

### ⚠️ Referral Code Entry
- No UI for entering referral code during signup
- Users must apply code post-registration (feature not visible in current screens)

### ⚠️ Payment Processing
- Currently using MOCK mode for Airwallex
- Need to integrate real Airwallex SDK before production

### ⚠️ AI API Keys
- API keys are in client-side code (security risk)
- Should move to Supabase Edge Functions before production

---

## Critical Security Notes

1. **API Keys Exposure**: Move AI calls to Edge Functions
2. **Payment Security**: Implement real Airwallex integration
3. **Rate Limiting**: Add rate limits on credit-earning actions
4. **Input Validation**: All user inputs are sanitized
5. **RLS Policies**: All tables have proper RLS enabled

---

## Support

For deployment issues:
- Check Supabase logs: Dashboard → Logs
- Check browser console for errors
- Verify all migrations ran successfully
- Test with a fresh user account

---

## Files Modified in This Session

1. ✅ `src/components/people/PersonProfileSheet.jsx` - Russian language support
2. ✅ `supabase/migrations/ADD_RUSSIAN_TRANSLATIONS.sql` - Russian translation columns
3. ✅ `src/index.css` - Mobile responsive padding fixes
4. ✅ `src/admin/AdminApp.jsx` - Removed fixed padding
5. ✅ `src/admin/screens/*.jsx` - Changed p-5 to px-4 py-4
6. ✅ `src/screens/SettingsScreen.jsx` - Changed px-5 to px-4
7. ✅ `src/screens/PhoneScreen.jsx` - Changed px-5 to px-4
8. ✅ `src/screens/OtpScreen.jsx` - Changed px-5 to px-4

---

## Next Steps

1. Run all SQL migrations in Supabase
2. Add your admin email to staff table
3. Create storage buckets
4. Set environment variables
5. Build and deploy
6. Test all features
7. Monitor for errors

Good luck! 🚀
