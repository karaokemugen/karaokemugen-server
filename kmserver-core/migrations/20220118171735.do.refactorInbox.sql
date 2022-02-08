ALTER TABLE inbox
	DROP COLUMN kara;
ALTER TABLE inbox
	DROP COLUMN extra_tags;
ALTER TABLE inbox
	DROP COLUMN lyrics;
ALTER TABLE inbox
	DROP COLUMN mediafile;
ALTER TABLE inbox
	DROP COLUMN fix;

ALTER TABLE inbox
	ADD fk_kid UUID NOT NULL;
ALTER TABLE inbox
	ADD edited_kid UUID;

-- set existing imports to random KIDs
UPDATE inbox SET fk_kid = gen_random_uuid();

