-- ============================================================================
-- PUSH SUBSCRIPTIONS
-- Stores Web Push API subscriptions for browser notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL,
    p256dh      TEXT NOT NULL,
    auth        TEXT NOT NULL,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own subscriptions
CREATE POLICY "push_own_insert" ON push_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "push_own_select" ON push_subscriptions
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "push_own_delete" ON push_subscriptions
    FOR DELETE USING (user_id = auth.uid()::text);

-- Edge functions (service role) can read all subscriptions to send pushes
CREATE POLICY "push_service_select" ON push_subscriptions
    FOR SELECT USING (auth.role() = 'service_role');
