-- ═══════════════════════════════════════════════════════════════
-- PUSH NOTIFICATIONS — push_subscriptions jadvali
-- Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  endpoint   TEXT        NOT NULL,
  p256dh     TEXT,
  auth       TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_self_all"   ON push_subscriptions;
DROP POLICY IF EXISTS "push_staff_read" ON push_subscriptions;

-- User can manage own subscriptions
CREATE POLICY "push_self_all" ON push_subscriptions
  FOR ALL
  USING     (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Staff can read all (for sending notifications)
CREATE POLICY "push_staff_read" ON push_subscriptions
  FOR SELECT USING (is_staff());

CREATE INDEX IF NOT EXISTS idx_push_user_id ON push_subscriptions(user_id);

-- Verify
SELECT 'push_subscriptions created' AS status;
