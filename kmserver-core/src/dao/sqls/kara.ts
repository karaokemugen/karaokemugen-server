// SQL for kara management

export const selectAllMedias = `
	SELECT mediafile,
	mediasize,
	pk_kid AS kid
	FROM kara
	WHERE repository != 'Staging'
`;

export const getAllKaras = (filterClauses: string[], orderClauses: string, limitClause: string, offsetClause: string, selectClause: string, joinClause: string, groupClause: string, whereClauses: string, additionalFrom: string[], includeStaging: boolean, collectionClauses: string[]) => `SELECT
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
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 15)') AS warnings,
  jsonb_path_query_array( tags, '$[*] ? (@.type_in_kara == 16)') AS collections,
  ak.mediafile AS mediafile,
  ak.karafile AS karafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.loudnorm AS loudnorm,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize,
  ak.repository AS repository,
  ak.comment AS comment,
  ksub.subchecksum AS subchecksum,
  ${selectClause}
  array_remove(array_agg(krc.fk_kid_parent), null) AS parents,
  array_remove(array_agg(DISTINCT krp.fk_kid_child), null) AS children,
  array_remove((SELECT array_agg(DISTINCT fk_kid_child) FROM kara_relation WHERE fk_kid_parent = ANY (array_remove(array_agg(krc.fk_kid_parent), null))), ak.pk_kid) AS siblings,
  count(ak.pk_kid) OVER()::integer AS count
FROM all_karas AS ak
LEFT OUTER JOIN kara_relation krp ON krp.fk_kid_parent = ak.pk_kid
LEFT OUTER JOIN kara_relation krc ON krc.fk_kid_child = ak.pk_kid
LEFT JOIN kara_subchecksum ksub ON ksub.fk_kid = ak.pk_kid
${joinClause}
${additionalFrom.join('')}
WHERE ${includeStaging ? '1 = 1' : 'repository != \'Staging\''}
  ${
    collectionClauses.length > 0
	  ? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})`
      : ''
  }
  ${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
  ${whereClauses}
GROUP BY ${groupClause} ak.pk_kid, ak.titles, ak.songorder, ak.tags, ak.serie_singer_sortable, ak.subfile, ak.year, ak.mediafile, ak.karafile, ak.duration, ak.gain, ak.loudnorm, ak.created_at, ak.modified_at, ak.mediasize, ak.repository, ak.comment, ak.songtypes_sortable, ak.titles_sortable, ksub.subchecksum
ORDER BY ${orderClauses} ak.serie_singer_sortable, ak.songtypes_sortable DESC, ak.songorder, ak.titles_sortable
${limitClause}
${offsetClause}
`;

export const insertKara = `
INSERT INTO kara(
	titles,
	titles_aliases,
	year,
	songorder,
	mediafile,
	subfile,
	duration,
	gain,
	loudnorm,
	modified_at,
	created_at,
	karafile,
	pk_kid,
	repository,
	mediasize,
	download_status,
	comment,
	ignore_hooks
)
VALUES(
	:titles,
	:titles_aliases,
	:year,
	:songorder,
	:mediafile,
	:subfile,
	:duration,
	:gain,
	:loudnorm,
	:modified_at,
	:created_at,
	:karafile,
	:kid,
	:repository,
	:mediasize,
	:download_status,
	:comment,
	:ignoreHooks
);
`;

export const deleteKara = `
DELETE FROM kara WHERE pk_kid = ANY ($1);
`;

export const getYears = 'SELECT year, karacount::integer FROM all_years ORDER BY year';

export const selectBaseStats = `SELECT
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[2])::integer AS singers,
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[8])::integer AS songwriters,
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[4])::integer AS creators,
(SELECT COUNT(1) FROM all_tags WHERE types @> ARRAY[6])::integer AS authors,
(SELECT COUNT(1) FROM kara where repository != 'Staging')::integer AS karas,
(SELECT COUNT(1)::integer FROM all_tags WHERE types @> ARRAY[5] AND karacount::text NOT LIKE '{"count": 0}' ) AS languages,
(SELECT COUNT(1)::integer FROM all_tags WHERE types @> ARRAY[1] AND karacount::text NOT LIKE '{"count": 0}' ) AS series,
(SELECT SUM(mediasize) FROM kara where repository != 'Staging')::bigint AS mediasize,
(SELECT SUM(duration) FROM kara where repository != 'Staging')::integer AS duration;
`;

export const refreshKaraStats = `
INSERT INTO kara_stats
SELECT ak.pk_kid AS fk_kid,
 (SELECT COUNT(fk_kid) FROM stats_played WHERE ak.pk_kid = stats_played.fk_kid) AS played,
 (SELECT COUNT(fk_kid) FROM stats_requested WHERE ak.pk_kid = stats_requested.fk_kid) AS requested,
 (SELECT COUNT(uf.fk_kid) FROM users_favorites uf LEFT JOIN users u ON u.pk_login = uf.fk_login WHERE ak.pk_kid = uf.fk_kid AND (u.flag_sendstats IS NULL or u.flag_sendstats = TRUE)) AS favorited
FROM all_karas ak;
`;
