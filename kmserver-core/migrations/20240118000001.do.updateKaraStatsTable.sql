--We start over with this table
DROP TABLE IF EXISTS kara_stats;

CREATE TABLE kara_stats(
	fk_kid UUID,
	played INTEGER,
	played_recently INTEGER,
	requested INTEGER,
	requested_recently INTEGER,
	favorited INTEGER
);

CREATE UNIQUE INDEX idx_kara_stats_kid ON kara_stats(fk_kid);
CREATE INDEX idx_kara_stats_played ON kara_stats(played);
CREATE INDEX idx_kara_stats_requested ON kara_stats(requested);
CREATE INDEX idx_kara_stats_played_recently ON kara_stats(played_recently);
CREATE INDEX idx_kara_stats_requested_recently ON kara_stats(requested_recently);
CREATE INDEX idx_kara_stats_favorited ON kara_stats(favorited);
