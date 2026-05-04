-- Allow anon to call the student-facing SECURITY DEFINER RPCs.
-- The functions run as their owner so they can write to bmb_bots
-- without granting anon direct INSERT/UPDATE on that table.
GRANT EXECUTE ON FUNCTION code_mob.submit_bmb_bot(UUID, TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION code_mob.archive_bmb_bot(UUID, TEXT) TO anon;
