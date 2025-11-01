CREATE TABLE IF NOT EXISTS all_karas_sortable (
	fk_kid UUID NOT NULL,
	titles TEXT,
	langs TEXT,
	songtypes TEXT,
	series_singergroups_singers TEXT
);

TRUNCATE all_karas_sortable CASCADE;

ALTER TABLE IF EXISTS all_karas DROP COLUMN IF EXISTS titles_sortable;
ALTER TABLE IF EXISTS all_karas DROP COLUMN IF EXISTS languages_sortable;
ALTER TABLE IF EXISTS all_karas DROP COLUMN IF EXISTS songtypes_sortable;
ALTER TABLE IF EXISTS all_karas DROP COLUMN IF EXISTS serie_singergroup_singer_sortable;