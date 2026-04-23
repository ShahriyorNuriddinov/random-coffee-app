-- ═══════════════════════════════════════════════════════════════
-- RANDOM COFFEE — Supabase Setup SQL
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. PROFILES TABLE ───────────────────────────────────────────
create table if not exists public.profiles (
  id                    text primary key,          -- Supabase auth user id
  phone                 text unique,
  name                  text,
  dob                   text,                       -- ISO date string
  gender                text check (gender in ('male','female')),
  about                 text,
  gives                 text,
  wants                 text,
  balance               text default '50_50'
                          check (balance in ('30_70','50_50','70_30')),
  wechat                text,
  whatsapp              text,
  show_age              boolean default true,
  dating_mode           boolean default false,
  dating_gender         text default 'women'
                          check (dating_gender in ('men','women')),
  languages             text[] default array['EN'],
  region                text default 'Hong Kong'
                          check (region in ('Hong Kong','Macau','Mainland China')),
  email                 text,
  email_verified        boolean default false,
  avatar_url            text,
  photos                text[] default array[]::text[],  -- up to 4 extra photos
  -- ── Subscription ──────────────────────────────────────────────
  subscription_status   text default 'trial'
                          check (subscription_status in ('trial','active','empty')),
  coffee_credits        integer default 2,          -- trial starts with 2
  subscription_start    timestamptz,
  subscription_end      timestamptz,
  -- ── Referral ──────────────────────────────────────────────────
  referral_code         text unique,
  referred_by           text references public.profiles(id),
  referral_count        integer default 0,
  -- ── Notifications ─────────────────────────────────────────────
  notif_new_matches     boolean default true,
  notif_important_news  boolean default true,
  -- ── Boost ─────────────────────────────────────────────────────
  boost_active          boolean default false,
  -- ── Meta ──────────────────────────────────────────────────────
  last_login            timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── 2. PAYMENTS TABLE ───────────────────────────────────────────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         text references public.profiles(id) on delete cascade,
  amount          numeric(10,2) not null,
  currency        text default 'HKD',
  credits         integer not null,                 -- how many credits purchased
  payment_method  text,                             -- visa / wechat / alipay
  provider        text default 'airwallex',
  provider_ref    text,                             -- Airwallex payment intent id
  status          text default 'pending'
                    check (status in ('pending','success','failed','refunded')),
  created_at      timestamptz default now()
);

-- ─── 3. REFERRALS TABLE ──────────────────────────────────────────
create table if not exists public.referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     text references public.profiles(id) on delete cascade,
  referred_id     text references public.profiles(id) on delete cascade,
  credited        boolean default false,            -- bonus credited?
  created_at      timestamptz default now(),
  unique (referrer_id, referred_id)
);

-- ─── 4. MATCHES TABLE (Stage 2) ──────────────────────────────────
create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  user_a          text references public.profiles(id) on delete cascade,
  user_b          text references public.profiles(id) on delete cascade,
  week_start      date not null,                    -- Monday of the week
  status          text default 'pending'
                    check (status in ('pending','accepted','completed','cancelled')),
  boost_used      boolean default false,
  created_at      timestamptz default now()
);

-- ─── 5. AUTO-GENERATE REFERRAL CODE ──────────────────────────────
create or replace function generate_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code := upper(substring(md5(new.id || now()::text) from 1 for 8));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_referral_code on public.profiles;
create trigger trg_referral_code
  before insert on public.profiles
  for each row execute function generate_referral_code();

-- ─── 6. AUTO-UPDATE updated_at ───────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_updated_at on public.profiles;
create trigger trg_updated_at
  before update on public.profiles
  for each row execute function update_updated_at();

-- ─── 7. CREDIT REFERRAL BONUS ────────────────────────────────────
-- Called when a referred user activates subscription
create or replace function credit_referral_bonus(p_referred_id text)
returns void language plpgsql as $$
declare
  v_referrer_id text;
begin
  select referrer_id into v_referrer_id
  from public.referrals
  where referred_id = p_referred_id and credited = false
  limit 1;

  if v_referrer_id is not null then
    -- Give +1 credit to referrer
    update public.profiles
    set coffee_credits = coffee_credits + 1,
        referral_count = referral_count + 1
    where id = v_referrer_id;

    -- Give +1 credit to referred user
    update public.profiles
    set coffee_credits = coffee_credits + 1
    where id = p_referred_id;

    -- Mark as credited
    update public.referrals
    set credited = true
    where referrer_id = v_referrer_id and referred_id = p_referred_id;
  end if;
end;
$$;

-- ─── 8. STORAGE BUCKETS ──────────────────────────────────────────
-- Run these separately in Supabase Dashboard → Storage
-- Or via API:
--
-- insert into storage.buckets (id, name, public)
-- values ('avatars', 'avatars', true)
-- on conflict do nothing;
--
-- insert into storage.buckets (id, name, public)
-- values ('photos', 'photos', true)
-- on conflict do nothing;

-- ─── 9. ROW LEVEL SECURITY ───────────────────────────────────────
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.referrals enable row level security;
alter table public.matches enable row level security;

-- profiles: users can read/write only their own row
create policy "profiles_self_read"  on public.profiles for select using (auth.uid()::text = id);
create policy "profiles_self_write" on public.profiles for all    using (auth.uid()::text = id);

-- payments: users can read their own payments
create policy "payments_self_read"  on public.payments for select using (auth.uid()::text = user_id);

-- referrals: users can read their own referrals
create policy "referrals_self_read" on public.referrals for select
  using (auth.uid()::text = referrer_id or auth.uid()::text = referred_id);

-- matches: users can read their own matches
create policy "matches_self_read"   on public.matches for select
  using (auth.uid()::text = user_a or auth.uid()::text = user_b);

-- ─── 10. INDEXES ─────────────────────────────────────────────────
create index if not exists idx_profiles_phone         on public.profiles(phone);
create index if not exists idx_profiles_referral_code on public.profiles(referral_code);
create index if not exists idx_profiles_region        on public.profiles(region);
create index if not exists idx_payments_user_id       on public.payments(user_id);
create index if not exists idx_matches_week           on public.matches(week_start);

-- ─── DONE ─────────────────────────────────────────────────────────
-- Tables: profiles, payments, referrals, matches
-- Triggers: auto referral_code, auto updated_at, credit_referral_bonus()
-- RLS: enabled on all tables with self-access policies
-- Next: set MOCK_SMS=false in supabaseClient.js after Alibaba approval
