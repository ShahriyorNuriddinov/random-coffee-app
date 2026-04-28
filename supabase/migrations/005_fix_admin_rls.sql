-- ============================================================================
-- FIX ADMIN RLS POLICIES
-- Fixes SEC-02: reports/blocked_users had USING (true) open to all users.
-- NOTE: profiles.id is TEXT — auth.uid() must be cast to ::text when
--       comparing against profiles.id.
-- ============================================================================

-- ── Helper: is_admin() ───────────────────────────────────────────────────────
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

COMMENT ON FUNCTION is_admin IS
'Returns true if the current user is in the staff table with admin or moderator role.';

-- ── Fix reports policies ─────────────────────────────────────────────────────
-- reporter_id is UUID so auth.uid() = reporter_id works without cast
DROP POLICY IF EXISTS "Admin can view all reports"       ON reports;
DROP POLICY IF EXISTS "Admin can update reports"         ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;

CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id OR is_admin());

CREATE POLICY "Admin can update reports"
    ON reports FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ── Fix app_settings policies ────────────────────────────────────────────────
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read settings"  ON app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON app_settings;

CREATE POLICY "Anyone can read settings"
    ON app_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin can update settings"
    ON app_settings FOR UPDATE
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ── Fix staff table policies ─────────────────────────────────────────────────
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage staff" ON staff;

CREATE POLICY "Admin can manage staff"
    ON staff FOR ALL
    TO authenticated
    USING (is_admin())
    WITH CHECK (is_admin());

-- ── Recreate admin_reports_view ──────────────────────────────────────────────
-- Joins profiles directly (no auth.users join) to avoid schema exposure.
-- reporter_id is UUID, profiles.id is TEXT — cast reporter_id::text.
-- reported_id is already TEXT — direct join.
DROP VIEW IF EXISTS admin_reports_view;

CREATE VIEW admin_reports_view AS
SELECT
    r.id,
    r.reason,
    r.status,
    r.admin_notes,
    r.created_at,
    r.updated_at,
    r.reporter_id,
    COALESCE(reporter.name,  'Unknown')  AS reporter_name,
    COALESCE(reporter.email, 'No email') AS reporter_email,
    r.reported_id,
    COALESCE(reported.name,  'Unknown')  AS reported_name,
    COALESCE(reported.email, 'No email') AS reported_email
FROM reports r
LEFT JOIN profiles reporter ON r.reporter_id::text = reporter.id
LEFT JOIN profiles reported ON r.reported_id        = reported.id
ORDER BY r.created_at DESC;

REVOKE ALL  ON admin_reports_view FROM authenticated;
GRANT SELECT ON admin_reports_view TO authenticated;

DO $done$ BEGIN
    RAISE NOTICE 'Admin RLS policies fixed successfully';
END $done$;
