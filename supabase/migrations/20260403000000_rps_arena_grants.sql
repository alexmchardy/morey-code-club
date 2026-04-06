-- Grant permissions for RPS Arena tables

-- anon can SELECT
GRANT SELECT ON TABLE code_mob.rps_tournaments TO anon;
GRANT SELECT ON TABLE code_mob.rps_approved_names TO anon;
GRANT SELECT ON TABLE code_mob.rps_students TO anon;
GRANT SELECT ON TABLE code_mob.rps_functions TO anon;
GRANT SELECT ON TABLE code_mob.rps_match_queue TO anon;

-- anon can UPDATE match_queue status (for room display to start matches)
GRANT UPDATE ON TABLE code_mob.rps_match_queue TO anon;

-- RLS policy for anon to update match queue status
CREATE POLICY "anon_update_match_queue" ON code_mob.rps_match_queue
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- service_role gets full access
GRANT ALL ON TABLE code_mob.rps_tournaments TO service_role;
GRANT ALL ON TABLE code_mob.rps_approved_names TO service_role;
GRANT ALL ON TABLE code_mob.rps_students TO service_role;
GRANT ALL ON TABLE code_mob.rps_functions TO service_role;
GRANT ALL ON TABLE code_mob.rps_match_queue TO service_role;
