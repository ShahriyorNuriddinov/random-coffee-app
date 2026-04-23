-- ═══════════════════════════════════════════════════════════════
-- RANDOM COFFEE — Step 1 SQL (yukla hozir)
-- Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── PROFILES TABLE ──────────────────────────────────────────────
create table if not exists public.profiles (
  id                    text primary key,
  phone                 text unique,
  name                  text,
  dob                   text,
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
  photos                text[] default array[]::text[],
  subscription_status   text default 'trial'
                          check (subscription_status in ('trial','active','empty')),
  coffee_credits        integer default 2,
  subscription_start    timestamptz,
  subscription_end      timestamptz,
  referral_code         text unique,
  referred_by           text,
  referral_count        integer default 0,
  notif_new_matches     boolean default true,
  notif_important_news  boolean default true,
  boost_active          boolean default false,
  last_login            timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── AUTO referral_code ──────────────────────────────────────────
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

-- ─── AUTO updated_at ─────────────────────────────────────────────
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

-- ─── RLS: OFF (MOCK_SMS=true bo'lganda auth.uid() null) ──────────
-- Alibaba SMS tayyor bo'lgandan keyin RLS yoqiladi
alter table public.profiles disable row level security;

-- ─── INDEXES ─────────────────────────────────────────────────────
create index if not exists idx_profiles_phone         on public.profiles(phone);
create index if not exists idx_profiles_referral_code on public.profiles(referral_code);

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────
-- Dashboard → Storage → New bucket:
--   1. "avatars"  → Public: ON
--   2. "photos"   → Public: ON
-- Yoki quyidagi SQL ni alohida ishga tushir:
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict do nothing;

-- ─── DONE ────────────────────────────────────────────────────────
