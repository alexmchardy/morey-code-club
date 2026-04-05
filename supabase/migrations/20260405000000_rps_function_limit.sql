-- Add max functions per student setting to tournaments
ALTER TABLE code_mob.rps_tournaments
ADD COLUMN max_functions_per_student INT NOT NULL DEFAULT 5;

-- Replace submit_rps_function to enforce function limit
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
  v_active_function_count INT;
  v_function_exists BOOLEAN;
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

  -- Check if this function name already exists for this student (any version)
  SELECT EXISTS (
    SELECT 1 FROM code_mob.rps_functions
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND function_name = p_function_name
  ) INTO v_function_exists;

  -- If this is a NEW function name, check the limit
  IF NOT v_function_exists THEN
    -- Count distinct active function names (those with at least one non-archived version)
    SELECT COUNT(DISTINCT function_name) INTO v_active_function_count
    FROM code_mob.rps_functions
    WHERE tournament_id = p_tournament_id
      AND student_name = p_student_name
      AND is_archived = false;

    IF v_active_function_count >= v_tournament.max_functions_per_student THEN
      RETURN jsonb_build_object(
        'error',
        format('You''ve reached the maximum of %s functions. Archive one to submit a new one.', v_tournament.max_functions_per_student)
      );
    END IF;
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
