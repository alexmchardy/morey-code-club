-- Add configurable power-up item count to bmb_tournaments.
-- Default of 2 matches the previous hardcoded behaviour (1 star + 1 mushroom).
ALTER TABLE code_mob.bmb_tournaments
  ADD COLUMN power_up_count INT NOT NULL DEFAULT 2;
