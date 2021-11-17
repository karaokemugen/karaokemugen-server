DROP MATERIALIZED VIEW kara_stats;

CREATE TABLE kara_stats(
	fk_kid UUID,
	played INTEGER,
	requested INTEGER,
	favorited INTEGER,
	CONSTRAINT fk_kid
      FOREIGN KEY(fk_kid)
	  REFERENCES kara(pk_kid)
);

INSERT INTO kara_stats
SELECT ak.pk_kid AS fk_kid,
 (SELECT COUNT(fk_kid) FROM stats_played WHERE ak.pk_kid = stats_played.fk_kid) AS played,
 (SELECT COUNT(fk_kid) FROM stats_requested WHERE ak.pk_kid = stats_requested.fk_kid) AS requested,
 (SELECT COUNT(uf.fk_kid) FROM users_favorites uf LEFT JOIN users u ON u.pk_login = uf.fk_login WHERE ak.pk_kid = uf.fk_kid AND (u.flag_sendstats IS NULL or u.flag_sendstats = TRUE)) AS favorited
FROM all_karas ak;

