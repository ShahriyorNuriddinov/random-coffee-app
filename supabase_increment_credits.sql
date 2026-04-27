-- Atomic credit increment — prevents race condition on simultaneous payments
-- Run this in Supabase SQL Editor

create or replace function increment_credits(p_user_id uuid, p_credits int)
returns int
language plpgsql
security definer
as $$
declare
  new_credits int;
begin
  update profiles
  set
    coffee_credits = coffee_credits + p_credits,
    subscription_status = 'active',
    subscription_start = coalesce(subscription_start, now()),
    updated_at = now()
  where id = p_user_id
  returning coffee_credits into new_credits;

  return new_credits;
end;
$$;
