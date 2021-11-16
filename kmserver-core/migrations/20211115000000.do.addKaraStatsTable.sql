CREATE MATERIALIZED VIEW kara_stats AS
SELECT ak.pk_kid AS kid,
 (SELECT COUNT(fk_kid) FROM stats_played WHERE ak.pk_kid = stats_played.fk_kid) AS played,
 (SELECT COUNT(fk_kid) FROM stats_requested WHERE ak.pk_kid = stats_requested.fk_kid) AS requested,
 (SELECT COUNT(uf.fk_kid) FROM users_favorites uf LEFT JOIN users u ON u.pk_login = uf.fk_login WHERE ak.pk_kid = uf.fk_kid AND (u.flag_sendstats IS NULL or u.flag_sendstats = TRUE)) AS favorited
FROM all_karas ak;

CREATE INDEX idx_kara_stats_kid ON kara_stats(kid);
CREATE INDEX idx_kara_stats_played ON kara_stats(played);
CREATE INDEX idx_kara_stats_requested ON kara_stats(requested);
CREATE INDEX idx_kara_stats_favorited ON kara_stats(favorited);

