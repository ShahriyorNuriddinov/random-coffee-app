-- ─── Staff table ─────────────────────────────────────────────────────────────
create table if not exists public.staff (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    email       text,
    phone       text,
    role        text not null default 'moderator', -- 'admin' | 'moderator'
    created_at  timestamptz not null default now()
);

-- ─── RLS: allow anon to read/insert/delete (admin panel uses anon key) ────────
alter table public.staff enable row level security;

-- Drop existing policies if any
drop policy if exists "staff_select" on public.staff;
drop policy if exists "staff_insert" on public.staff;
drop policy if exists "staff_delete" on public.staff;

-- Allow all operations for anon (admin panel is password-protected at app level)
create policy "staff_select" on public.staff for select using (true);
create policy "staff_insert" on public.staff for insert with check (true);
create policy "staff_delete" on public.staff for delete using (true);

-- ─── Seed existing admins (optional, edit as needed) ─────────────────────────
insert into public.staff (name, email, role) values
    ('Shahriyor', 'nuriddinovlar20@gmail.com', 'admin'),
    ('Yunna',     'yunna@magollz.com',          'admin'),
    ('Admin',     'russianhongkonger@gmail.com', 'admin')
on conflict do nothing;
