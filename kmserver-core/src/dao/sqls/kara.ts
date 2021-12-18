// SQL for kara management

export const selectAllMedias = `
	SELECT mediafile,
	mediasize,
	pk_kid AS kid
	FROM kara
`;

export const getAllKaras = (filterClauses: string[], typeClauses: string, orderClauses: string, limitClause: string, offsetClause: string, selectClause: string, joinClause: string, groupClause: string, whereClauses: string, additionalFrom: string[],) => `SELECT
  ak.pk_kid AS kid,
  ak.titles AS titles,
  ak.songorder AS songorder,
  ak.subfile AS subfile,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 2)') AS singers,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 3)') AS songtypes,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 4)') AS creators,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 8)') AS songwriters,
  ak.year AS year,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 5)') AS langs,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 6)') AS authors,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 9)') AS groups,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 7)') AS misc,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 11)') AS origins,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 13)') AS platforms,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 10)') AS families,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 12)') AS genres,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 1)') AS series,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 14)') AS versions,
  ak.mediafile AS mediafile,
  ak.karafile AS karafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.loudnorm AS loudnorm,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize,
  ak.repository AS repository,
  ks.subchecksum AS subchecksum,
  ${selectClause}
  array_remove(array_agg(krc.fk_kid_parent), null) AS parents,
  array_remove(array_agg(DISTINCT krp.fk_kid_child), null) AS children,
  count(ak.pk_kid) OVER()::integer AS count
FROM all_karas AS ak
LEFT OUTER JOIN kara_relation krp ON krp.fk_kid_parent = ak.pk_kid
LEFT OUTER JOIN kara_relation krc ON krc.fk_kid_child = ak.pk_kid
LEFT JOIN kara_subchecksum ks ON ks.fk_kid = ak.pk_kid
${joinClause}
${additionalFrom.join('')}
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${whereClauses}
  ${typeClauses}
GROUP BY ${groupClause} ak.pk_kid, ak.titles, ak.songorder, ak.tags, ak.serie_singer_sortable, ak.subfile, ak.year, ak.mediafile, ak.karafile, ak.duration, ak.gain, ak.loudnorm, ak.created_at, ak.modified_at, ak.mediasize, ak.repository, ak.songtypes_sortable, ak.titles_sortable, ks.subchecksum
ORDER BY ${orderClauses} ak.serie_singer_sortable, ak.songtypes_sortable DESC, ak.songorder, ak.titles_sortable
${limitClause}
${offsetClause}
`;

export const getYears = 'SELECT year, karacount::integer FROM all_years ORDER BY year';

export const selectBaseStats = `SELECT
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[2])::integer AS singers,
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[8])::integer AS songwriters,
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[4])::integer AS creators,
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[6])::integer AS authors,
(SELECT COUNT(1) FROM kara)::integer AS karas,
(SELECT COUNT(1)::integer FROM all_tags WHERE types @> ARRAY[5] AND karacount::text NOT LIKE '{"count": 0}' ) AS languages,
(SELECT COUNT(1)::integer FROM all_tags WHERE types @> ARRAY[1] AND karacount::text NOT LIKE '{"count": 0}' ) AS series,
(SELECT SUM(mediasize) FROM kara)::bigint AS mediasize,
(SELECT SUM(duration) FROM kara)::integer AS duration;
`;

export const refreshKaraStats = `
INSERT INTO kara_stats
SELECT ak.pk_kid AS fk_kid,
 (SELECT COUNT(fk_kid) FROM stats_played WHERE ak.pk_kid = stats_played.fk_kid) AS played,
 (SELECT COUNT(fk_kid) FROM stats_requested WHERE ak.pk_kid = stats_requested.fk_kid) AS requested,
 (SELECT COUNT(uf.fk_kid) FROM users_favorites uf LEFT JOIN users u ON u.pk_login = uf.fk_login WHERE ak.pk_kid = uf.fk_kid AND (u.flag_sendstats IS NULL or u.flag_sendstats = TRUE)) AS favorited
FROM all_karas ak;
`;