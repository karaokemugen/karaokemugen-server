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
	ADD fk_kid UUID;
ALTER TABLE inbox
	ADD edited_kid UUID;
