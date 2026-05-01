-- ═══════════════════════════════════════════════════════════════
-- blocked_users.blocker_id va reports.reporter_id: UUID → TEXT
-- ═══════════════════════════════════════════════════════════════

-- ── 1. blocked_users ─────────────────────────────────────────
-- Barcha policy + FK + view larni o'chirish
DROP POLICY IF EXISTS "blocked_insert"     ON blocked_users;
DROP POLICY IF EXISTS "blocked_select"     ON blocked_users;
DROP POLICY IF EXISTS "blocked_delete"     ON blocked_users;
DROP POLICY IF EXISTS "blocked_all"        ON blocked_users;
DROP POLICY IF EXISTS "blocked_self_all"   ON blocked_users;
DROP POLICY IF EXISTS "blocked_staff_read" ON blocked_users;

ALTER TABLE blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey;
ALTER TABLE blocked_users DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;

ALTER TABLE blocked_users ALTER COLUMN blocker_id TYPE TEXT USING blocker_id::TEXT;
ALTER TABLE blocked_users ALTER COLUMN blocked_id TYPE TEXT USING blocked_id::TEXT;

-- Policy larni qayta yaratish
CREATE POLICY "blocked_self_all" ON blocked_users
  FOR ALL
  USING     (auth.uid()::text = blocker_id)
  WITH CHECK (auth.uid()::text = blocker_id);

CREATE POLICY "blocked_staff_read" ON blocked_users
  FOR SELECT USING (is_staff());


-- ── 2. reports ───────────────────────────────────────────────
DROP VIEW  IF EXISTS admin_reports_view CASCADE;

DROP POLICY IF EXISTS "reports_insert"     ON reports;
DROP POLICY IF EXISTS "reports_select"     ON reports;
DROP POLICY IF EXISTS "reports_all"        ON reports;
DROP POLICY IF EXISTS "reports_staff_read" ON reports;

ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_reported_id_fkey;

ALTER TABLE reports ALTER COLUMN reporter_id TYPE TEXT USING reporter_id::TEXT;
ALTER TABLE reports ALTER COLUMN reported_id TYPE TEXT USING reported_id::TEXT;

-- Policy larni qayta yaratish
CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (auth.uid()::text = reporter_id);

CREATE POLICY "reports_staff_read" ON reports
  FOR SELECT USING (is_staff());

-- View ni qayta yaratish
CREATE OR REPLACE VIEW admin_reports_view AS
SELECT
  r.id,
  r.reporter_id,
  r.reported_id,
  r.reason,
  r.created_at,
  rp.name  AS reporter_name,
  rp.email AS reporter_email,
  rd.name  AS reported_name,
  rd.email AS reported_email
FROM reports r
LEFT JOIN profiles rp ON rp.id = r.reporter_id
LEFT JOIN profiles rd ON rd.id = r.reported_id;


-- ── Tekshirish ───────────────────────────────────────────────
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('blocked_users','reports')
  AND column_name IN ('blocker_id','blocked_id','reporter_id','reported_id')
ORDER BY table_name, column_name;
