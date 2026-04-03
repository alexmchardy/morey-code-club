-- RPS Arena tables (in code_mob schema)

-- Tournaments
CREATE TABLE code_mob.rps_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'strict' CHECK (mode IN ('strict', 'nolimits')),
  team_mode BOOLEAN NOT NULL DEFAULT false,
  team_a_name TEXT,
  team_b_name TEXT,
  rounds_per_match INT NOT NULL DEFAULT 10,
  round_delay_ms INT NOT NULL DEFAULT 1500,
  match_delay_ms INT NOT NULL DEFAULT 3000,
  continuous BOOLEAN NOT NULL DEFAULT false,
  paused BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approved student names per tournament
CREATE TABLE code_mob.rps_approved_names (
  tournament_id UUID NOT NULL REFERENCES code_mob.rps_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, name)
);

-- Students (name + team assignment)
CREATE TABLE code_mob.rps_students (
  tournament_id UUID NOT NULL REFERENCES code_mob.rps_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  team TEXT CHECK (team IS NULL OR team IN ('a', 'b')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, name)
);

-- Submitted functions
CREATE TABLE code_mob.rps_functions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES code_mob.rps_tournaments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  function_name TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'js' CHECK (language IN ('js', 'python')),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  match_wins INT NOT NULL DEFAULT 0,
  match_losses INT NOT NULL DEFAULT 0,
  round_wins INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, student_name, function_name, version)
);

-- Match queue
CREATE TABLE code_mob.rps_match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES code_mob.rps_tournaments(id) ON DELETE CASCADE,
  function_a_id UUID NOT NULL REFERENCES code_mob.rps_functions(id) ON DELETE CASCADE,
  function_b_id UUID NOT NULL REFERENCES code_mob.rps_functions(id) ON DELETE CASCADE,
  position INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'completed')),
  winner_function_id UUID REFERENCES code_mob.rps_functions(id),
  is_tie BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rps_functions_tournament ON code_mob.rps_functions(tournament_id);
CREATE INDEX idx_rps_functions_active ON code_mob.rps_functions(tournament_id, is_archived) WHERE NOT is_archived;
CREATE INDEX idx_rps_match_queue_tournament ON code_mob.rps_match_queue(tournament_id, status);

-- Enable Realtime
ALTER TABLE code_mob.rps_tournaments REPLICA IDENTITY FULL;
ALTER TABLE code_mob.rps_approved_names REPLICA IDENTITY FULL;
ALTER TABLE code_mob.rps_functions REPLICA IDENTITY FULL;
ALTER TABLE code_mob.rps_match_queue REPLICA IDENTITY FULL;
ALTER TABLE code_mob.rps_students REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.rps_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.rps_approved_names;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.rps_functions;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.rps_match_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.rps_students;

-- RLS policies
ALTER TABLE code_mob.rps_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.rps_approved_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.rps_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.rps_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.rps_match_queue ENABLE ROW LEVEL SECURITY;

-- Anon can SELECT everything
CREATE POLICY "anon_select_tournaments" ON code_mob.rps_tournaments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_approved_names" ON code_mob.rps_approved_names FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_students" ON code_mob.rps_students FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_functions" ON code_mob.rps_functions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_match_queue" ON code_mob.rps_match_queue FOR SELECT TO anon USING (true);

-- Service role can do everything (for Edge Function)
CREATE POLICY "service_all_tournaments" ON code_mob.rps_tournaments FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_approved_names" ON code_mob.rps_approved_names FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_students" ON code_mob.rps_students FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_functions" ON code_mob.rps_functions FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_match_queue" ON code_mob.rps_match_queue FOR ALL TO service_role USING (true);

-- RPC for students to submit functions (validates tournament + approved name)
CREATE OR REPLACE FUNCTION code_mob.submit_rps_function(
  p_tournament_id UUID,
  p_student_name TEXT,
  p_function_name TEXT,
  p_code TEXT,
  p_language TEXT DEFAULT 'js'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
DECLARE
  v_tournament code_mob.rps_tournaments%ROWTYPE;
  v_next_version INT;
  v_function_id UUID;
BEGIN
  -- Check tournament exists and is active
  SELECT * INTO v_tournament FROM code_mob.rps_tournaments WHERE id = p_tournament_id AND is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found or inactive');
  END IF;

  -- Check student name is approved
  IF NOT EXISTS (
    SELECT 1 FROM code_mob.rps_approved_names
    WHERE tournament_id = p_tournament_id AND name = p_student_name
  ) THEN
    RETURN jsonb_build_object('error', 'Name not approved for this tournament');
  END IF;

  -- Ensure student record exists
  INSERT INTO code_mob.rps_students (tournament_id, name)
  VALUES (p_tournament_id, p_student_name)
  ON CONFLICT DO NOTHING;

  -- Get next version number for this function name
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM code_mob.rps_functions
  WHERE tournament_id = p_tournament_id
    AND student_name = p_student_name
    AND function_name = p_function_name;

  -- Insert the function
  INSERT INTO code_mob.rps_functions (
    tournament_id, student_name, function_name, version, code, language
  ) VALUES (
    p_tournament_id, p_student_name, p_function_name, v_next_version, p_code, p_language
  )
  RETURNING id INTO v_function_id;

  RETURN jsonb_build_object(
    'ok', true,
    'function_id', v_function_id,
    'version', v_next_version
  );
END;
$$;

-- RPC for students to archive their own functions
CREATE OR REPLACE FUNCTION code_mob.archive_rps_function(
  p_function_id UUID,
  p_student_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
BEGIN
  UPDATE code_mob.rps_functions
  SET is_archived = true
  WHERE id = p_function_id AND student_name = p_student_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Function not found or not yours');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
