-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE code_mob.pixels (
  session_id uuid NOT NULL,
  x smallint NOT NULL CHECK (x >= 0 AND x <= 39),
  y smallint NOT NULL CHECK (y >= 0 AND y <= 39),
  color text NOT NULL,
  student_name text NOT NULL,
  painted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pixels_pkey PRIMARY KEY (session_id, x, y),
  CONSTRAINT pixels_session_id_fkey FOREIGN KEY (session_id) REFERENCES code_mob.sessions(id)
);
CREATE TABLE code_mob.rps_approved_names (
  tournament_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rps_approved_names_pkey PRIMARY KEY (tournament_id, name),
  CONSTRAINT rps_approved_names_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.rps_tournaments(id)
);
CREATE TABLE code_mob.rps_functions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  student_name text NOT NULL,
  function_name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  code text NOT NULL,
  language text NOT NULL DEFAULT 'js'::text CHECK (language = ANY (ARRAY['js'::text, 'python'::text])),
  is_archived boolean NOT NULL DEFAULT false,
  match_wins integer NOT NULL DEFAULT 0,
  match_losses integer NOT NULL DEFAULT 0,
  round_wins integer NOT NULL DEFAULT 0,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rps_functions_pkey PRIMARY KEY (id),
  CONSTRAINT rps_functions_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.rps_tournaments(id)
);
CREATE TABLE code_mob.rps_match_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  function_a_id uuid NOT NULL,
  function_b_id uuid NOT NULL,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'playing'::text, 'completed'::text])),
  winner_function_id uuid,
  is_tie boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rps_match_queue_pkey PRIMARY KEY (id),
  CONSTRAINT rps_match_queue_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.rps_tournaments(id),
  CONSTRAINT rps_match_queue_function_a_id_fkey FOREIGN KEY (function_a_id) REFERENCES code_mob.rps_functions(id),
  CONSTRAINT rps_match_queue_function_b_id_fkey FOREIGN KEY (function_b_id) REFERENCES code_mob.rps_functions(id),
  CONSTRAINT rps_match_queue_winner_function_id_fkey FOREIGN KEY (winner_function_id) REFERENCES code_mob.rps_functions(id)
);
CREATE TABLE code_mob.rps_students (
  tournament_id uuid NOT NULL,
  name text NOT NULL,
  team text CHECK (team IS NULL OR (team = ANY (ARRAY['a'::text, 'b'::text]))),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT rps_students_pkey PRIMARY KEY (tournament_id, name),
  CONSTRAINT rps_students_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.rps_tournaments(id)
);
CREATE TABLE code_mob.rps_tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mode text NOT NULL DEFAULT 'strict'::text CHECK (mode = ANY (ARRAY['strict'::text, 'nolimits'::text])),
  team_mode boolean NOT NULL DEFAULT false,
  team_a_name text,
  team_b_name text,
  rounds_per_match integer NOT NULL DEFAULT 10,
  round_delay_ms integer NOT NULL DEFAULT 1500,
  match_delay_ms integer NOT NULL DEFAULT 3000,
  continuous boolean NOT NULL DEFAULT false,
  paused boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  max_functions_per_student integer NOT NULL DEFAULT 5,
  CONSTRAINT rps_tournaments_pkey PRIMARY KEY (id)
);
CREATE TABLE code_mob.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  game text NOT NULL DEFAULT 'pixel-poke'::text,
  paused boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone DEFAULT now(),
  cleared_at timestamp with time zone,
  broadcast_msg text,
  broadcast_at timestamp with time zone,
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE code_mob.students (
  session_id uuid NOT NULL,
  name text NOT NULL,
  pixel_count integer NOT NULL DEFAULT 0,
  last_seen timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (session_id, name),
  CONSTRAINT students_session_id_fkey FOREIGN KEY (session_id) REFERENCES code_mob.sessions(id)
);
