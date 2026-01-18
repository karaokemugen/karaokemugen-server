ALTER TABLE inbox ADD COLUMN flag_fix BOOLEAN;
UPDATE inbox SET flag_fix = true WHERE edited_kid is not null;
UPDATE inbox SET flag_fix = false WHERE edited_kid is null;
