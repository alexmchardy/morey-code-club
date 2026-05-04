-- Admin page writes directly with the anon key (no Edge Function / token auth).
-- Grant the operations admin.html performs: INSERT+UPDATE tournaments,
-- INSERT+DELETE approved_names, INSERT+DELETE match_queue.

-- RLS policies
CREATE POLICY "anon_insert_bmb_tournaments" ON code_mob.bmb_tournaments
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_bmb_tournaments" ON code_mob.bmb_tournaments
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_insert_bmb_approved_names" ON code_mob.bmb_approved_names
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_delete_bmb_approved_names" ON code_mob.bmb_approved_names
  FOR DELETE TO anon USING (true);

CREATE POLICY "anon_insert_bmb_match_queue" ON code_mob.bmb_match_queue
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_delete_bmb_match_queue" ON code_mob.bmb_match_queue
  FOR DELETE TO anon USING (true);

-- Grants
GRANT INSERT, UPDATE ON TABLE code_mob.bmb_tournaments TO anon;
GRANT INSERT, DELETE ON TABLE code_mob.bmb_approved_names TO anon;
GRANT INSERT, DELETE ON TABLE code_mob.bmb_match_queue TO anon;
