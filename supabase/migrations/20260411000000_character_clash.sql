-- Character Clash tables (in code_mob schema)

-- Tournaments
CREATE TABLE code_mob.cc_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  locations JSONB NOT NULL DEFAULT '["bathroom", "cafeteria", "cliff", "city", "airplane"]'::jsonb,
  continuous BOOLEAN NOT NULL DEFAULT false,
  paused BOOLEAN NOT NULL DEFAULT false,
  encounter_delay_ms INT NOT NULL DEFAULT 5000,
  max_characters_per_student INT NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approved student names per tournament
CREATE TABLE code_mob.cc_approved_names (
  tournament_id UUID NOT NULL REFERENCES code_mob.cc_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, name)
);

-- Students
CREATE TABLE code_mob.cc_students (
  tournament_id UUID NOT NULL REFERENCES code_mob.cc_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, name)
);

-- Submitted characters
CREATE TABLE code_mob.cc_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES code_mob.cc_tournaments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  character_name TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'js' CHECK (language IN ('js', 'python')),
  character_data JSONB,
  xp INT NOT NULL DEFAULT 0,
  encounter_wins INT NOT NULL DEFAULT 0,
  encounter_losses INT NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, student_name, character_name, version)
);

-- Encounter queue
CREATE TABLE code_mob.cc_encounter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES code_mob.cc_tournaments(id) ON DELETE CASCADE,
  character_a_id UUID NOT NULL REFERENCES code_mob.cc_characters(id) ON DELETE CASCADE,
  character_b_id UUID NOT NULL REFERENCES code_mob.cc_characters(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  position INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'completed')),
  winner_character_id UUID REFERENCES code_mob.cc_characters(id),
  xp_delta_a INT,
  xp_delta_b INT,
  script JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cc_characters_tournament ON code_mob.cc_characters(tournament_id);
CREATE INDEX idx_cc_characters_active ON code_mob.cc_characters(tournament_id, is_archived) WHERE NOT is_archived;
CREATE INDEX idx_cc_encounter_queue_tournament ON code_mob.cc_encounter_queue(tournament_id, status);

-- Enable Realtime
ALTER TABLE code_mob.cc_tournaments REPLICA IDENTITY FULL;
ALTER TABLE code_mob.cc_approved_names REPLICA IDENTITY FULL;
ALTER TABLE code_mob.cc_characters REPLICA IDENTITY FULL;
ALTER TABLE code_mob.cc_encounter_queue REPLICA IDENTITY FULL;
ALTER TABLE code_mob.cc_students REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.cc_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.cc_approved_names;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.cc_characters;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.cc_encounter_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.cc_students;

-- RLS policies
ALTER TABLE code_mob.cc_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.cc_approved_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.cc_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.cc_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.cc_encounter_queue ENABLE ROW LEVEL SECURITY;

-- Anon can SELECT everything
CREATE POLICY "anon_select_cc_tournaments" ON code_mob.cc_tournaments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_cc_approved_names" ON code_mob.cc_approved_names FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_cc_students" ON code_mob.cc_students FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_cc_characters" ON code_mob.cc_characters FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_cc_encounter_queue" ON code_mob.cc_encounter_queue FOR SELECT TO anon USING (true);

-- Anon can UPDATE encounter_queue status (for room display to start encounters)
CREATE POLICY "anon_update_cc_encounter_queue" ON code_mob.cc_encounter_queue
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Service role can do everything (for Edge Function)
CREATE POLICY "service_all_cc_tournaments" ON code_mob.cc_tournaments FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_cc_approved_names" ON code_mob.cc_approved_names FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_cc_students" ON code_mob.cc_students FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_cc_characters" ON code_mob.cc_characters FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_cc_encounter_queue" ON code_mob.cc_encounter_queue FOR ALL TO service_role USING (true);

-- Grants
GRANT SELECT ON TABLE code_mob.cc_tournaments TO anon;
GRANT SELECT ON TABLE code_mob.cc_approved_names TO anon;
GRANT SELECT ON TABLE code_mob.cc_students TO anon;
GRANT SELECT ON TABLE code_mob.cc_characters TO anon;
GRANT SELECT ON TABLE code_mob.cc_encounter_queue TO anon;
GRANT UPDATE ON TABLE code_mob.cc_encounter_queue TO anon;

GRANT ALL ON TABLE code_mob.cc_tournaments TO service_role;
GRANT ALL ON TABLE code_mob.cc_approved_names TO service_role;
GRANT ALL ON TABLE code_mob.cc_students TO service_role;
GRANT ALL ON TABLE code_mob.cc_characters TO service_role;
GRANT ALL ON TABLE code_mob.cc_encounter_queue TO service_role;

-- RPC for students to submit characters (validates tournament + approved name + limit)
CREATE OR REPLACE FUNCTION code_mob.submit_cc_character(
  p_tournament_id UUID,
  p_student_name TEXT,
  p_character_name TEXT,
  p_code TEXT,
  p_character_data JSONB,
  p_language TEXT DEFAULT 'js'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
DECLARE
  v_tournament code_mob.cc_tournaments%ROWTYPE;
  v_next_version INT;
  v_character_id UUID;
  v_active_character_count INT;
  v_character_exists BOOLEAN;
BEGIN
  -- Check tournament exists and is active
  SELECT * INTO v_tournament FROM code_mob.cc_tournaments WHERE id = p_tournament_id AND is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found or inactive');
  END IF;

  -- Check student name is approved
  IF NOT EXISTS (
    SELECT 1 FROM code_mob.cc_approved_names
    WHERE tournament_id = p_tournament_id AND name = p_student_name
  ) THEN
    RETURN jsonb_build_object('error', 'Name not approved for this tournament');
  END IF;

  -- Check if this character name already exists for this student (any version)
  SELECT EXISTS (
    SELECT 1 FROM code_mob.cc_characters
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND character_name = p_character_name
  ) INTO v_character_exists;

  -- If this is a NEW character name, check the limit
  IF NOT v_character_exists THEN
    -- Count distinct active character names (those with at least one non-archived version)
    SELECT COUNT(DISTINCT character_name) INTO v_active_character_count
    FROM code_mob.cc_characters
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND is_archived = false;

    IF v_active_character_count >= v_tournament.max_characters_per_student THEN
      RETURN jsonb_build_object(
        'error',
        format('You''ve reached the maximum of %s characters. Archive one to submit a new one.', v_tournament.max_characters_per_student)
      );
    END IF;
  END IF;

  -- Ensure student record exists
  INSERT INTO code_mob.cc_students (tournament_id, name)
  VALUES (p_tournament_id, p_student_name)
  ON CONFLICT DO NOTHING;

  -- Get next version number for this character name
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM code_mob.cc_characters
  WHERE tournament_id = p_tournament_id
    AND student_name = p_student_name
    AND character_name = p_character_name;

  -- Insert the character
  INSERT INTO code_mob.cc_characters (
    tournament_id, student_name, character_name, version, code, language, character_data
  ) VALUES (
    p_tournament_id, p_student_name, p_character_name, v_next_version, p_code, p_language, p_character_data
  )
  RETURNING id INTO v_character_id;

  RETURN jsonb_build_object(
    'ok', true,
    'character_id', v_character_id,
    'version', v_next_version
  );
END;
$$;

-- RPC for students to archive their own characters
CREATE OR REPLACE FUNCTION code_mob.archive_cc_character(
  p_character_id UUID,
  p_student_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
BEGIN
  UPDATE code_mob.cc_characters
  SET is_archived = true
  WHERE id = p_character_id AND student_name = p_student_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Character not found or not yours');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- RPC for room to update encounter results
CREATE OR REPLACE FUNCTION code_mob.update_cc_encounter(
  p_encounter_id UUID,
  p_status TEXT,
  p_winner_character_id UUID DEFAULT NULL,
  p_xp_delta_a INT DEFAULT NULL,
  p_xp_delta_b INT DEFAULT NULL,
  p_script JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
DECLARE
  v_encounter code_mob.cc_encounter_queue%ROWTYPE;
BEGIN
  -- Get the encounter
  SELECT * INTO v_encounter FROM code_mob.cc_encounter_queue WHERE id = p_encounter_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Encounter not found');
  END IF;

  -- Update encounter
  UPDATE code_mob.cc_encounter_queue
  SET
    status = p_status,
    winner_character_id = COALESCE(p_winner_character_id, winner_character_id),
    xp_delta_a = COALESCE(p_xp_delta_a, xp_delta_a),
    xp_delta_b = COALESCE(p_xp_delta_b, xp_delta_b),
    script = COALESCE(p_script, script)
  WHERE id = p_encounter_id;

  -- Update character XP and win/loss counts if completed
  IF p_status = 'completed' AND p_xp_delta_a IS NOT NULL AND p_xp_delta_b IS NOT NULL THEN
    -- Update character A
    UPDATE code_mob.cc_characters
    SET
      xp = xp + p_xp_delta_a,
      encounter_wins = encounter_wins + CASE WHEN p_winner_character_id = v_encounter.character_a_id THEN 1 ELSE 0 END,
      encounter_losses = encounter_losses + CASE WHEN p_winner_character_id = v_encounter.character_b_id THEN 1 ELSE 0 END
    WHERE id = v_encounter.character_a_id;

    -- Update character B
    UPDATE code_mob.cc_characters
    SET
      xp = xp + p_xp_delta_b,
      encounter_wins = encounter_wins + CASE WHEN p_winner_character_id = v_encounter.character_b_id THEN 1 ELSE 0 END,
      encounter_losses = encounter_losses + CASE WHEN p_winner_character_id = v_encounter.character_a_id THEN 1 ELSE 0 END
    WHERE id = v_encounter.character_b_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
