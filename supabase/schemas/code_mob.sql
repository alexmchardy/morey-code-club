-- code-mob schema
-- Creates tables, RLS policies, and the submit_pixel() SECURITY DEFINER function
-- for the Pixel Poke game.

-- ─── Schema ───────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS code_mob;

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE code_mob.sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game          TEXT NOT NULL DEFAULT 'pixel-poke',
  paused        BOOLEAN NOT NULL DEFAULT FALSE,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  cleared_at    TIMESTAMPTZ,       -- room screen resets on change
  broadcast_msg TEXT,
  broadcast_at  TIMESTAMPTZ        -- room screen shows overlay on change
);

CREATE TABLE code_mob.pixels (
  session_id   UUID REFERENCES code_mob.sessions(id) ON DELETE CASCADE,
  x            SMALLINT NOT NULL CHECK (x BETWEEN 0 AND 39),
  y            SMALLINT NOT NULL CHECK (y BETWEEN 0 AND 39),
  color        TEXT NOT NULL,
  student_name TEXT NOT NULL,
  painted_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, x, y)
);

CREATE TABLE code_mob.students (
  session_id  UUID REFERENCES code_mob.sessions(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  pixel_count INTEGER NOT NULL DEFAULT 0,
  last_seen   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, name)
);

-- ─── Replica Identity (needed for Realtime UPDATE events to include OLD data) ─

ALTER TABLE code_mob.pixels   REPLICA IDENTITY FULL;
ALTER TABLE code_mob.students REPLICA IDENTITY FULL;
ALTER TABLE code_mob.sessions REPLICA IDENTITY FULL;

-- ─── Realtime Publication (required for non-public schemas) ───────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.pixels;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.students;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.sessions;

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE code_mob.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.pixels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.students ENABLE ROW LEVEL SECURITY;

-- Anon can read everything; writes go through submit_pixel() or Edge Function
CREATE POLICY "read_sessions" ON code_mob.sessions FOR SELECT USING (true);
CREATE POLICY "read_pixels"   ON code_mob.pixels   FOR SELECT USING (true);
CREATE POLICY "read_students" ON code_mob.students FOR SELECT USING (true);

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA code_mob TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA code_mob TO anon;
GRANT ALL    ON ALL TABLES IN SCHEMA code_mob TO service_role;

-- ─── submit_pixel() — SECURITY DEFINER RPC ────────────────────────────────────
-- Called by student.html via db.rpc('submit_pixel', ...).
-- Validates session state and color, upserts pixel, atomically increments
-- student pixel count. Returns {ok, pixelCount} or {error}.

CREATE OR REPLACE FUNCTION code_mob.submit_pixel(
  p_session_id  UUID,
  p_x           SMALLINT,
  p_y           SMALLINT,
  p_color       TEXT,
  p_student_name TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_paused BOOLEAN;
  v_count  INTEGER;
BEGIN
  -- Validate session exists and is not paused
  SELECT paused INTO v_paused
    FROM code_mob.sessions
   WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN '{"error":"Session not found"}'::JSONB;
  END IF;

  IF v_paused THEN
    RETURN '{"error":"Game is paused"}'::JSONB;
  END IF;

  -- Validate color: named color or valid hex
  IF p_color NOT IN ('cyan','pink','yellow','green','red','purple','white','orange')
     AND p_color !~ '^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$'
  THEN
    RETURN '{"error":"Invalid color"}'::JSONB;
  END IF;

  -- Upsert pixel
  INSERT INTO code_mob.pixels(session_id, x, y, color, student_name, painted_at)
  VALUES (p_session_id, p_x, p_y, p_color, p_student_name, NOW())
  ON CONFLICT (session_id, x, y) DO UPDATE
    SET color        = EXCLUDED.color,
        student_name = EXCLUDED.student_name,
        painted_at   = NOW();

  -- Upsert student, incrementing pixel count atomically
  INSERT INTO code_mob.students(session_id, name, pixel_count, last_seen)
  VALUES (p_session_id, p_student_name, 1, NOW())
  ON CONFLICT (session_id, name) DO UPDATE
    SET pixel_count = code_mob.students.pixel_count + 1,
        last_seen   = NOW();

  -- Return updated pixel count
  SELECT pixel_count INTO v_count
    FROM code_mob.students
   WHERE session_id = p_session_id
     AND name = p_student_name;

  RETURN jsonb_build_object('ok', true, 'pixelCount', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION code_mob.submit_pixel TO anon;
