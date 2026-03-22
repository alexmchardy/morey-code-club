create schema if not exists "code_mob";


  create table "code_mob"."pixels" (
    "session_id" uuid not null,
    "x" smallint not null,
    "y" smallint not null,
    "color" text not null,
    "student_name" text not null,
    "painted_at" timestamp with time zone default now()
      );


alter table "code_mob"."pixels" enable row level security;


  create table "code_mob"."sessions" (
    "id" uuid not null default gen_random_uuid(),
    "game" text not null default 'pixel-poke'::text,
    "paused" boolean not null default false,
    "started_at" timestamp with time zone default now(),
    "cleared_at" timestamp with time zone,
    "broadcast_msg" text,
    "broadcast_at" timestamp with time zone
      );


alter table "code_mob"."sessions" enable row level security;


  create table "code_mob"."students" (
    "session_id" uuid not null,
    "name" text not null,
    "pixel_count" integer not null default 0,
    "last_seen" timestamp with time zone default now()
      );


alter table "code_mob"."students" enable row level security;

CREATE UNIQUE INDEX pixels_pkey ON code_mob.pixels USING btree (session_id, x, y);

CREATE UNIQUE INDEX sessions_pkey ON code_mob.sessions USING btree (id);

CREATE UNIQUE INDEX students_pkey ON code_mob.students USING btree (session_id, name);

alter table "code_mob"."pixels" add constraint "pixels_pkey" PRIMARY KEY using index "pixels_pkey";

alter table "code_mob"."sessions" add constraint "sessions_pkey" PRIMARY KEY using index "sessions_pkey";

alter table "code_mob"."students" add constraint "students_pkey" PRIMARY KEY using index "students_pkey";

alter table "code_mob"."pixels" add constraint "pixels_session_id_fkey" FOREIGN KEY (session_id) REFERENCES code_mob.sessions(id) ON DELETE CASCADE not valid;

alter table "code_mob"."pixels" validate constraint "pixels_session_id_fkey";

alter table "code_mob"."pixels" add constraint "pixels_x_check" CHECK (((x >= 0) AND (x <= 39))) not valid;

alter table "code_mob"."pixels" validate constraint "pixels_x_check";

alter table "code_mob"."pixels" add constraint "pixels_y_check" CHECK (((y >= 0) AND (y <= 39))) not valid;

alter table "code_mob"."pixels" validate constraint "pixels_y_check";

alter table "code_mob"."students" add constraint "students_session_id_fkey" FOREIGN KEY (session_id) REFERENCES code_mob.sessions(id) ON DELETE CASCADE not valid;

alter table "code_mob"."students" validate constraint "students_session_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION code_mob.submit_pixel(p_session_id uuid, p_x smallint, p_y smallint, p_color text, p_student_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

grant select on table "code_mob"."pixels" to "anon";

grant delete on table "code_mob"."pixels" to "service_role";

grant insert on table "code_mob"."pixels" to "service_role";

grant references on table "code_mob"."pixels" to "service_role";

grant select on table "code_mob"."pixels" to "service_role";

grant trigger on table "code_mob"."pixels" to "service_role";

grant truncate on table "code_mob"."pixels" to "service_role";

grant update on table "code_mob"."pixels" to "service_role";

grant select on table "code_mob"."sessions" to "anon";

grant delete on table "code_mob"."sessions" to "service_role";

grant insert on table "code_mob"."sessions" to "service_role";

grant references on table "code_mob"."sessions" to "service_role";

grant select on table "code_mob"."sessions" to "service_role";

grant trigger on table "code_mob"."sessions" to "service_role";

grant truncate on table "code_mob"."sessions" to "service_role";

grant update on table "code_mob"."sessions" to "service_role";

grant select on table "code_mob"."students" to "anon";

grant delete on table "code_mob"."students" to "service_role";

grant insert on table "code_mob"."students" to "service_role";

grant references on table "code_mob"."students" to "service_role";

grant select on table "code_mob"."students" to "service_role";

grant trigger on table "code_mob"."students" to "service_role";

grant truncate on table "code_mob"."students" to "service_role";

grant update on table "code_mob"."students" to "service_role";


  create policy "read_pixels"
  on "code_mob"."pixels"
  as permissive
  for select
  to public
using (true);



  create policy "read_sessions"
  on "code_mob"."sessions"
  as permissive
  for select
  to public
using (true);



  create policy "read_students"
  on "code_mob"."students"
  as permissive
  for select
  to public
using (true);



