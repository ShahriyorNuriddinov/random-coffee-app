-- ============================================================================
-- ADD REPORTS AND BLOCKED USERS TABLES
-- This enables user reporting and blocking functionality
-- ============================================================================

-- 1. CREATE REPORTS TABLE
-- ============================================================================
-- Note: Using TEXT for user IDs to match profiles table structure
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id TEXT NOT NULL,
    reported_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate reports from same user for same target
    CONSTRAINT unique_report UNIQUE (reporter_id, reported_id, reason)
);

-- 2. CREATE BLOCKED USERS TABLE
-- ============================================================================
-- Note: Using TEXT for user IDs to match profiles table structure
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate blocks
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id),
    
    -- Prevent self-blocking
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocked ON blocked_users(blocked_id);
CREATE INDEX IF NOT EXISTS idx_blocked_created ON blocked_users(created_at DESC);

-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES FOR REPORTS
-- ============================================================================

-- Users can insert their own reports
CREATE POLICY "Users can create reports"
    ON reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT
    TO authenticated
    USING (auth.uid()::text = reporter_id);

-- Admin can view all reports (add admin check if needed)
CREATE POLICY "Admin can view all reports"
    ON reports FOR SELECT
    TO authenticated
    USING (true);  -- TODO: Add admin role check

-- Admin can update reports
CREATE POLICY "Admin can update reports"
    ON reports FOR UPDATE
    TO authenticated
    USING (true)  -- TODO: Add admin role check
    WITH CHECK (true);

-- 6. RLS POLICIES FOR BLOCKED USERS
-- ============================================================================

-- Users can block others
CREATE POLICY "Users can block others"
    ON blocked_users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = blocker_id);

-- Users can view their own blocks
CREATE POLICY "Users can view their blocks"
    ON blocked_users FOR SELECT
    TO authenticated
    USING (auth.uid()::text = blocker_id);

-- Users can unblock others
CREATE POLICY "Users can unblock"
    ON blocked_users FOR DELETE
    TO authenticated
    USING (auth.uid()::text = blocker_id);

-- 7. GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON reports TO authenticated;
GRANT ALL ON blocked_users TO authenticated;

-- 8. CREATE ADMIN VIEW FOR REPORTS (Optional)
-- ============================================================================
CREATE OR REPLACE VIEW admin_reports_view AS
SELECT 
    r.id,
    r.reason,
    r.status,
    r.admin_notes,
    r.created_at,
    r.updated_at,
    reporter.id as reporter_id,
    reporter.name as reporter_name,
    reporter.email as reporter_email,
    reported.id as reported_id,
    reported.name as reported_name,
    reported.email as reported_email
FROM reports r
LEFT JOIN profiles reporter ON r.reporter_id = reporter.id
LEFT JOIN profiles reported ON r.reported_id = reported.id
ORDER BY r.created_at DESC;

-- Grant access to admin view
GRANT SELECT ON admin_reports_view TO authenticated;

-- DONE!
-- Now users can report and block other users
-- Reports will be visible in admin panel for moderation
