// SQL for kara management

export const selectAllMedias = `
	SELECT mediafile,
	mediasize,
	pk_kid AS kid
	FROM kara
`;

export const getAllKaras = (filterClauses: string[], typeClauses: string, orderClauses: string, havingClause: string, limitClause: string, offsetClause: string, statsSelectClause: string, statsJoinClause: string, favoritedSelectClause: string, favoritedJoinClause: string, favoritedGroupClause: string, whereClauses: string, additionalFrom: string[]) => `SELECT
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
  ${statsSelectClause}
  ${favoritedSelectClause}
  count(ak.pk_kid) OVER()::integer AS count
FROM all_karas AS ak
${statsJoinClause}
${favoritedJoinClause}
${additionalFrom.join('')}
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${whereClauses}
  ${typeClauses}
GROUP BY ${favoritedGroupClause} ak.pk_kid, ak.titles, ak.songorder, ak.tags, ak.serie_singer_sortable, ak.subfile, ak.year, ak.mediafile, ak.karafile, ak.duration, ak.gain, ak.loudnorm, ak.created_at, ak.modified_at, ak.mediasize, ak.repository, ak.songtypes_sortable, ak.titles_sortable
${havingClause}
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
