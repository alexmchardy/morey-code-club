-- Botty McBotface tables (in code_mob schema)

-- Tournaments
CREATE TABLE code_mob.bmb_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grid_width INT NOT NULL DEFAULT 10,
  grid_height INT NOT NULL DEFAULT 10,
  good_item_count INT NOT NULL DEFAULT 10,
  bad_item_count INT NOT NULL DEFAULT 5,
  wall_count INT NOT NULL DEFAULT 10,
  starting_energy INT NOT NULL DEFAULT 50,
  power_ups_enabled BOOLEAN NOT NULL DEFAULT false,
  max_turns INT NOT NULL DEFAULT 200,
  max_bots_per_student INT NOT NULL DEFAULT 3,
  paused BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approved student names per tournament
CREATE TABLE code_mob.bmb_approved_names (
  tournament_id UUID NOT NULL REFERENCES code_mob.bmb_tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tournament_id, name)
);

-- Submitted bots
CREATE TABLE code_mob.bmb_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES code_mob.bmb_tournaments(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  bot_name TEXT NOT NULL,
  bot_emoji TEXT NOT NULL DEFAULT '🤖',
  version INT NOT NULL DEFAULT 1,
  code TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  match_wins INT NOT NULL DEFAULT 0,
  match_losses INT NOT NULL DEFAULT 0,
  total_collected INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, student_name, bot_name, version)
);

-- Match queue
CREATE TABLE code_mob.bmb_match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES code_mob.bmb_tournaments(id) ON DELETE CASCADE,
  bot_ids UUID[] NOT NULL,
  grid_seed TEXT,
  position INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'playing', 'completed')),
  winner_bot_id UUID,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bmb_bots_tournament ON code_mob.bmb_bots(tournament_id);
CREATE INDEX idx_bmb_bots_active ON code_mob.bmb_bots(tournament_id, is_archived) WHERE NOT is_archived;
CREATE INDEX idx_bmb_match_queue_tournament ON code_mob.bmb_match_queue(tournament_id, status);

-- Enable Realtime
ALTER TABLE code_mob.bmb_tournaments REPLICA IDENTITY FULL;
ALTER TABLE code_mob.bmb_approved_names REPLICA IDENTITY FULL;
ALTER TABLE code_mob.bmb_bots REPLICA IDENTITY FULL;
ALTER TABLE code_mob.bmb_match_queue REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.bmb_tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.bmb_approved_names;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.bmb_bots;
ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.bmb_match_queue;

-- RLS policies
ALTER TABLE code_mob.bmb_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.bmb_approved_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.bmb_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_mob.bmb_match_queue ENABLE ROW LEVEL SECURITY;

-- Anon can SELECT everything
CREATE POLICY "anon_select_bmb_tournaments" ON code_mob.bmb_tournaments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_bmb_approved_names" ON code_mob.bmb_approved_names FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_bmb_bots" ON code_mob.bmb_bots FOR SELECT TO anon USING (true);
CREATE POLICY "anon_select_bmb_match_queue" ON code_mob.bmb_match_queue FOR SELECT TO anon USING (true);

-- Anon can UPDATE match_queue status (for room display to advance match state)
CREATE POLICY "anon_update_bmb_match_queue" ON code_mob.bmb_match_queue
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "service_all_bmb_tournaments" ON code_mob.bmb_tournaments FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_bmb_approved_names" ON code_mob.bmb_approved_names FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_bmb_bots" ON code_mob.bmb_bots FOR ALL TO service_role USING (true);
CREATE POLICY "service_all_bmb_match_queue" ON code_mob.bmb_match_queue FOR ALL TO service_role USING (true);

-- Grants
GRANT SELECT ON TABLE code_mob.bmb_tournaments TO anon;
GRANT SELECT ON TABLE code_mob.bmb_approved_names TO anon;
GRANT SELECT ON TABLE code_mob.bmb_bots TO anon;
GRANT SELECT ON TABLE code_mob.bmb_match_queue TO anon;
GRANT UPDATE ON TABLE code_mob.bmb_match_queue TO anon;

GRANT ALL ON TABLE code_mob.bmb_tournaments TO service_role;
GRANT ALL ON TABLE code_mob.bmb_approved_names TO service_role;
GRANT ALL ON TABLE code_mob.bmb_bots TO service_role;
GRANT ALL ON TABLE code_mob.bmb_match_queue TO service_role;

-- RPC for students to submit bots (validates tournament + approved name + limit)
CREATE OR REPLACE FUNCTION code_mob.submit_bmb_bot(
  p_tournament_id UUID,
  p_student_name TEXT,
  p_bot_name TEXT,
  p_bot_emoji TEXT,
  p_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
DECLARE
  v_tournament code_mob.bmb_tournaments%ROWTYPE;
  v_next_version INT;
  v_bot_id UUID;
  v_active_bot_count INT;
  v_bot_name_exists BOOLEAN;
BEGIN
  -- Check tournament exists and is active
  SELECT * INTO v_tournament FROM code_mob.bmb_tournaments WHERE id = p_tournament_id AND is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found or inactive');
  END IF;

  -- Check student name is approved
  IF NOT EXISTS (
    SELECT 1 FROM code_mob.bmb_approved_names
    WHERE tournament_id = p_tournament_id AND name = p_student_name
  ) THEN
    RETURN jsonb_build_object('error', 'Name not approved for this tournament');
  END IF;

  -- Check if this bot name already exists for this student (any version)
  SELECT EXISTS (
    SELECT 1 FROM code_mob.bmb_bots
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND bot_name = p_bot_name
  ) INTO v_bot_name_exists;

  -- If this is a new bot name, check the limit against active (non-archived) distinct bot names
  IF NOT v_bot_name_exists THEN
    SELECT COUNT(DISTINCT bot_name) INTO v_active_bot_count
    FROM code_mob.bmb_bots
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND is_archived = false;

    IF v_active_bot_count >= v_tournament.max_bots_per_student THEN
      RETURN jsonb_build_object(
        'error',
        format('You''ve reached the maximum of %s bots. Archive one to submit a new one.', v_tournament.max_bots_per_student)
      );
    END IF;
  END IF;

  -- Get next version number for this bot name
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM code_mob.bmb_bots
  WHERE tournament_id = p_tournament_id
    AND student_name = p_student_name
    AND bot_name = p_bot_name;

  -- Insert the bot
  INSERT INTO code_mob.bmb_bots (
    tournament_id, student_name, bot_name, bot_emoji, version, code
  ) VALUES (
    p_tournament_id, p_student_name, p_bot_name, p_bot_emoji, v_next_version, p_code
  )
  RETURNING id INTO v_bot_id;

  RETURN jsonb_build_object(
    'ok', true,
    'bot_id', v_bot_id,
    'version', v_next_version
  );
END;
$$;

-- RPC for room to complete a match and update bot win/loss stats
CREATE OR REPLACE FUNCTION code_mob.complete_bmb_match(
  p_match_id UUID,
  p_winner_bot_id UUID,
  p_results JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
DECLARE
  v_match code_mob.bmb_match_queue%ROWTYPE;
  v_bot_id UUID;
  v_collected INT;
BEGIN
  -- Get the match
  SELECT * INTO v_match FROM code_mob.bmb_match_queue WHERE id = p_match_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;

  IF v_match.status = 'completed' THEN
    RETURN jsonb_build_object('error', 'Match already completed');
  END IF;

  -- Update match record
  UPDATE code_mob.bmb_match_queue
  SET
    status = 'completed',
    winner_bot_id = p_winner_bot_id,
    results = p_results
  WHERE id = p_match_id;

  -- Update win/loss counts and total_collected for each bot in the match
  FOREACH v_bot_id IN ARRAY v_match.bot_ids LOOP
    v_collected := COALESCE((p_results -> v_bot_id::TEXT ->> 'collected')::INT, 0);

    UPDATE code_mob.bmb_bots
    SET
      match_wins   = match_wins   + CASE WHEN v_bot_id = p_winner_bot_id THEN 1 ELSE 0 END,
      match_losses = match_losses + CASE WHEN v_bot_id != p_winner_bot_id THEN 1 ELSE 0 END,
      total_collected = total_collected + v_collected
    WHERE id = v_bot_id;
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- RPC for students to archive their own bots
CREATE OR REPLACE FUNCTION code_mob.archive_bmb_bot(
  p_bot_id UUID,
  p_student_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = code_mob
AS $$
BEGIN
  UPDATE code_mob.bmb_bots
  SET is_archived = true
  WHERE id = p_bot_id AND student_name = p_student_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bot not found or not yours');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
