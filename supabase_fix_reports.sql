-- ═══════════════════════════════════════════════════════════════
-- FIX: reports table + admin_reports_view
-- Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

-- 1. reports jadvaliga yetishmayotgan ustunlar qo'shish
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'pending'
  CHECK (status IN ('pending','reviewed','resolved','dismissed'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- 2. profiles jadvaliga ban ustunlari qo'shish
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at  TIMESTAMPTZ;

-- 3. admin_reports_view ni qayta yaratish (to'liq ustunlar bilan)
DROP VIEW IF EXISTS admin_reports_view CASCADE;

CREATE OR REPLACE VIEW admin_reports_view AS
SELECT
  r.id,
  r.reporter_id,
  r.reported_id,
  r.reason,
  r.status,
  r.admin_notes,
  r.created_at,
  r.updated_at,
  rp.name  AS reporter_name,
  rp.email AS reporter_email,
  rd.name  AS reported_name,
  rd.email AS reported_email
FROM reports r
LEFT JOIN profiles rp ON rp.id = r.reporter_id
LEFT JOIN profiles rd ON rd.id = r.reported_id;

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

SELECT 'reports fixed' AS status;
