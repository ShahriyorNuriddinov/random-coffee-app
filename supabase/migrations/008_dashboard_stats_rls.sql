-- ============================================================================
-- FIX: dashboard_stats materialized view — UNRESTRICTED
-- Problem: dashboard_stats shows as UNRESTRICTED in Supabase Table Editor,
--          meaning any anon user can read aggregate stats.
-- Solution: Enable RLS and restrict access to admin/moderator staff only.
-- ============================================================================

-- Materialized views don't support RLS directly in PostgreSQL.
-- The standard approach is to wrap it in a security-definer function
-- that checks the caller's role before returning data.

-- Step 1: Revoke public access from the materialized view
REVOKE ALL ON dashboard_stats FROM anon;
REVOKE ALL ON dashboard_stats FROM authenticated;

-- Step 2: Grant access only to postgres (service role) — no direct client access
GRANT SELECT ON dashboard_stats TO postgres;

-- Step 3: Create a secure wrapper function that checks admin role
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
    total_members    BIGINT,
    active_members   BIGINT,
    men_count        BIGINT,
    women_count      BIGINT,
    new_today        BIGINT,
    new_week         BIGINT,
    new_month        BIGINT,
    new_prev_month   BIGINT,
    last_refresh     TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $fn$
BEGIN
    -- Only allow staff with admin or moderator role
    IF NOT EXISTS (
        SELECT 1 FROM staff
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND role IN ('admin', 'moderator')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    RETURN QUERY SELECT
        ds.total_members,
        ds.active_members,
        ds.men_count,
        ds.women_count,
        ds.new_today,
        ds.new_week,
        ds.new_month,
        ds.new_prev_month,
        ds.last_refresh
    FROM dashboard_stats ds;
END;
$fn$;

-- Step 4: Grant execute on the function to authenticated users
-- (the function itself enforces admin check internally)
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- Step 5: Also secure refresh_dashboard_stats — only admins should refresh
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $rfn$
BEGIN
    -- Allow postgres/service role to call without check (for cron jobs)
    -- For authenticated users, check admin role
    IF current_user != 'postgres' AND NOT EXISTS (
        SELECT 1 FROM staff
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
          AND role IN ('admin', 'moderator')
    ) THEN
        RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$rfn$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated;

DO $done$
BEGIN
    RAISE NOTICE 'dashboard_stats secured — access restricted to admin/moderator staff';
END $done$;
