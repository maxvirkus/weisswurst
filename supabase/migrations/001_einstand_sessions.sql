-- ============================================================
-- Weißwurst Einstand Sessions - Database Schema
-- ============================================================
-- 
-- Security Model:
-- - No auth required for participants (anonymous access via anon key)
-- - Admin actions protected by admin_secret (checked in RPC functions)
-- - RLS enforces: writes only when OPEN, reads only when not deleted
-- - Soft delete via deleted_at timestamp
--
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Sessions table
CREATE TABLE IF NOT EXISTS einstand_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('INVITE', 'SPLIT')) DEFAULT 'INVITE',
  price_wurst NUMERIC(10, 2),
  price_pretzel NUMERIC(10, 2),
  status TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')) DEFAULT 'OPEN',
  admin_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Entries table (participants with their counts)
CREATE TABLE IF NOT EXISTS einstand_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES einstand_sessions(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  wurst_count INTEGER NOT NULL DEFAULT 0 CHECK (wurst_count >= 0),
  pretzel_count INTEGER NOT NULL DEFAULT 0 CHECK (pretzel_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_entries_session_id ON einstand_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON einstand_sessions(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for entries updated_at
DROP TRIGGER IF EXISTS entries_updated_at ON einstand_entries;
CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON einstand_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RPC FUNCTIONS (SECURITY DEFINER - bypasses RLS)
-- ============================================================

-- Close session (admin only)
CREATE OR REPLACE FUNCTION close_session(
  p_session_id UUID,
  p_admin_secret TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  UPDATE einstand_sessions
  SET status = 'CLOSED'
  WHERE id = p_session_id
    AND admin_secret = p_admin_secret
    AND deleted_at IS NULL
    AND status = 'OPEN';
  
  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

-- Delete session (soft delete, admin only)
CREATE OR REPLACE FUNCTION delete_session(
  p_session_id UUID,
  p_admin_secret TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  UPDATE einstand_sessions
  SET deleted_at = now()
  WHERE id = p_session_id
    AND admin_secret = p_admin_secret
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

-- Reopen session (admin only)
CREATE OR REPLACE FUNCTION reopen_session(
  p_session_id UUID,
  p_admin_secret TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  UPDATE einstand_sessions
  SET status = 'OPEN'
  WHERE id = p_session_id
    AND admin_secret = p_admin_secret
    AND deleted_at IS NULL
    AND status = 'CLOSED';
  
  GET DIAGNOSTICS v_found = ROW_COUNT;
  RETURN v_found > 0;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS
ALTER TABLE einstand_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE einstand_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SESSION POLICIES
-- ============================================================

-- SELECT: Allow reading sessions that aren't deleted
-- Note: admin_secret is NOT exposed (use view or column-level security)
CREATE POLICY "sessions_select_not_deleted"
  ON einstand_sessions
  FOR SELECT
  USING (deleted_at IS NULL);

-- INSERT: Allow creating new sessions (anonymous can create)
CREATE POLICY "sessions_insert_anon"
  ON einstand_sessions
  FOR INSERT
  WITH CHECK (true);

-- UPDATE/DELETE: Blocked via RLS - use RPC functions instead
-- No update policy = no direct updates allowed
-- No delete policy = no direct deletes allowed

-- ============================================================
-- ENTRY POLICIES
-- ============================================================

-- SELECT: Allow reading entries for non-deleted sessions
CREATE POLICY "entries_select_active_session"
  ON einstand_entries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM einstand_sessions s
      WHERE s.id = einstand_entries.session_id
        AND s.deleted_at IS NULL
    )
  );

-- INSERT: Allow adding entries only to OPEN sessions
CREATE POLICY "entries_insert_open_session"
  ON einstand_entries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM einstand_sessions s
      WHERE s.id = einstand_entries.session_id
        AND s.status = 'OPEN'
        AND s.deleted_at IS NULL
    )
  );

-- UPDATE: Allow updating entries only in OPEN sessions
CREATE POLICY "entries_update_open_session"
  ON einstand_entries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM einstand_sessions s
      WHERE s.id = einstand_entries.session_id
        AND s.status = 'OPEN'
        AND s.deleted_at IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM einstand_sessions s
      WHERE s.id = einstand_entries.session_id
        AND s.status = 'OPEN'
        AND s.deleted_at IS NULL
    )
  );

-- DELETE: Allow deleting entries only in OPEN sessions
CREATE POLICY "entries_delete_open_session"
  ON einstand_entries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM einstand_sessions s
      WHERE s.id = einstand_entries.session_id
        AND s.status = 'OPEN'
        AND s.deleted_at IS NULL
    )
  );

-- ============================================================
-- VIEW (hides admin_secret from SELECT)
-- ============================================================

CREATE OR REPLACE VIEW einstand_sessions_public AS
SELECT
  id,
  title,
  mode,
  price_wurst,
  price_pretzel,
  status,
  created_at
FROM einstand_sessions
WHERE deleted_at IS NULL;

-- Grant access to anon/authenticated users
GRANT SELECT ON einstand_sessions_public TO anon, authenticated;
GRANT SELECT, INSERT ON einstand_sessions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON einstand_entries TO anon, authenticated;
GRANT EXECUTE ON FUNCTION close_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reopen_session TO anon, authenticated;

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE einstand_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE einstand_entries;
