-- ============================================================================
-- FIX REPORTS AND BLOCKED_USERS TYPE MISMATCH
-- Run this if you get "operator does not exist: uuid = text" error
-- ============================================================================

-- 1. Drop existing view and tables
DROP VIEW IF EXISTS admin_reports_view CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS blocked_users CASCADE;

-- 2. Recreate reports table with correct types
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id TEXT NOT NULL,  -- TEXT to match profiles.id
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_report UNIQUE (reporter_id, reported_id, reason)
);

-- 3. Recreate blocked_users table with correct types
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL,  -- TEXT to match profiles.id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    CONSTRAINT no_self_block CHECK (blocker_id::text != blocked_id)
);

-- 4. Create indexes
CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_reported ON reports(reported_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);

CREATE INDEX idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX idx_blocked_blocked ON blocked_users(blocked_id);
CREATE INDEX idx_blocked_created ON blocked_users(created_at DESC);

-- 5. Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for reports
CREATE POLICY "Users can create reports"
    ON reports FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT TO authenticated
    USING (auth.uid() = reporter_id);

CREATE POLICY "Admin can view all reports"
    ON reports FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Admin can update reports"
    ON reports FOR UPDATE TO authenticated
    USING (true) WITH CHECK (true);

-- 7. RLS Policies for blocked_users
CREATE POLICY "Users can block others"
    ON blocked_users FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their blocks"
    ON blocked_users FOR SELECT TO authenticated
    USING (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
    ON blocked_users FOR DELETE TO authenticated
    USING (auth.uid() = blocker_id);

-- 8. Grant permissions
GRANT ALL ON reports TO authenticated;
GRANT ALL ON blocked_users TO authenticated;

-- 9. Create admin view with correct type casting
CREATE OR REPLACE VIEW admin_reports_view AS
SELECT 
    r.id,
    r.reason,
    r.status,
    r.admin_notes,
    r.created_at,
    r.updated_at,
    r.reporter_id,
    COALESCE(reporter.name, 'Unknown') as reporter_name,
    COALESCE(reporter.email, 'No email') as reporter_email,
    r.reported_id,
    COALESCE(reported.name, 'Unknown') as reported_name,
    COALESCE(reported.email, 'No email') as reported_email
FROM reports r
LEFT JOIN auth.users reporter_auth ON r.reporter_id = reporter_auth.id
LEFT JOIN profiles reporter ON reporter_auth.id::text = reporter.id
LEFT JOIN profiles reported ON r.reported_id = reported.id
ORDER BY r.created_at DESC;

GRANT SELECT ON admin_reports_view TO authenticated;

-- Done! Type mismatch fixed.
