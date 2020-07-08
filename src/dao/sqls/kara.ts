// SQL for kara management

export const selectAllMedias = `
	SELECT mediafile,
	mediasize
	FROM kara
`;

export const getAllKaras = (filterClauses: string[], typeClauses: string, orderClauses: string, havingClause: string, limitClause: string, offsetClause: string, statsSelectClause: string, statsJoinClause: string) => `SELECT
  ak.kid AS kid,
  ak.title AS title,
  ak.songorder AS songorder,
  ak.series->0->>'name' AS serie,
  ak.series AS series,
  ak.subfile AS subfile,
  COALESCE(ak.series, '[]'::jsonb) AS series,
  COALESCE(ak.singers, '[]'::jsonb) AS singers,
  COALESCE(ak.songtypes, '[]'::jsonb) AS songtypes,
  COALESCE(ak.creators, '[]'::jsonb) AS creators,
  COALESCE(ak.songwriters, '[]'::jsonb) AS songwriters,
  ak.year AS year,
  COALESCE(ak.languages, '[]'::jsonb) AS langs,
  COALESCE(ak.authors, '[]'::jsonb) AS authors,
  COALESCE(ak.groups, '[]'::jsonb) AS groups,
  COALESCE(ak.misc, '[]'::jsonb) AS misc,
  COALESCE(ak.origins, '[]'::jsonb) AS origins,
  COALESCE(ak.platforms, '[]'::jsonb) AS platforms,
  COALESCE(ak.families, '[]'::jsonb) AS families,
  COALESCE(ak.genres, '[]'::jsonb) AS genres,
  ak.mediafile AS mediafile,
  ak.karafile AS karafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize,
  ak.subchecksum AS subchecksum,
  ak.repository AS repository,
  ak.tagfiles AS tagfiles,
  ${statsSelectClause}
  count(ak.kid) OVER()::integer AS count
FROM all_karas AS ak
${statsJoinClause}
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
GROUP BY ak.kid, ak.title, ak.songorder, ak.serie_singer_sortable, ak.subfile, ak.series, ak.singers, ak.songtypes, ak.creators, ak.songwriters, ak.year, ak.languages, ak.groups, ak.authors, ak.misc, ak.genres, ak.families, ak.platforms, ak.origins, ak.mediafile, ak.karafile, ak.duration, ak.gain, ak.created_at, ak.modified_at, ak.mediasize, ak.groups, ak.repository, ak.songtypes_sortable, ak.tagfiles, ak.subchecksum
${havingClause}
ORDER BY ${orderClauses} ak.serie_singer_sortable, ak.songtypes_sortable DESC, ak.songorder, lower(unaccent(ak.title))
${limitClause}
${offsetClause}
`;

export const getYears = 'SELECT year, karacount::integer FROM all_years ORDER BY year';

export const selectBaseStats = `SELECT
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[2])::integer AS singers,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[8])::integer AS songwriters,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[4])::integer AS creators,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[6])::integer AS authors,
(SELECT COUNT(pk_kid) FROM kara)::integer AS karas,
(SELECT COUNT(tid)::integer FROM all_tags WHERE types @> ARRAY[5] AND karacount::text NOT LIKE '{"count": 0}' ) AS languages,
(SELECT COUNT(tid)::integer FROM all_tags WHERE types @> ARRAY[1] AND karacount::text NOT LIKE '{"count": 0}' ) AS series,
(SELECT SUM(mediasize) FROM kara)::bigint AS mediasize,
(SELECT SUM(duration) FROM kara)::integer AS duration;
`;