// SQL for kara management

export const selectAllMedias = (collectionClauses: string[]) => `
	SELECT k.mediafile,
	k.mediasize,
	k.pk_kid AS kid,
	k.titles AS titles,
	k.repository AS repository,
	k.songname AS songname,
	k.titles_default_language AS titles_default_language
	FROM kara k
	LEFT JOIN all_karas ak ON k.pk_kid = ak.pk_kid
	WHERE k.repository != 'Staging'
	${collectionClauses.length > 0 ? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})` : ''}

`;

export const getAllKaras = (
	filterClauses: string[],
	orderClauses: string,
	limitClause: string,
	offsetClause: string,
	selectClause: string,
	joinClause: string,
	groupClause: string,
	whereClauses: string[],
	fromClauses: string[],
	additionalFrom: string[],
	includeStaging: boolean,
	collectionClauses: string[],
	withCTE: string[],
	forPlayer: boolean,
	hardsubsInProgress: string[],
) => `
WITH ${withCTE.join(', \n')}
SELECT
  ak.pk_kid AS kid,
  ak.titles AS titles,
  ak.titles_default_language as titles_default_language,
  ak.pk_kid || '.' || ak.mediasize::text || '.' || COALESCE(ksub.subchecksum, 'no_ass_file') || '.mp4' AS hardsubbed_mediafile,
  ${selectClause}
  ${forPlayer ? 'true as dummy' : `
	ak.tags AS tags,
	ak.titles_aliases AS titles_aliases,
	ak.songorder AS songorder,
	ak.lyrics_infos AS lyrics_infos,
	ak.year AS year,
	ak.mediafile AS mediafile,
	ak.karafile AS karafile,
	ak.duration AS duration,
	ak.loudnorm AS loudnorm,
	ak.created_at AS created_at,
	ak.modified_at AS modified_at,
	ak.mediasize AS mediasize,
	ak.repository AS repository,
	ak.comment AS comment,
	ak.ignore_hooks AS ignore_hooks,
	ak.anilist_ids AS anilist_ids,
	ak.myanimelist_ids AS myanimelist_ids,
	ak.kitsu_ids AS kitsu_ids,
	ak.from_display_type AS from_display_type,
	ksub.subchecksum AS subchecksum,
	ak.songname as songname,
	array_remove(array_agg(DISTINCT plc.fk_plaid), null) AS playlists,
	array_remove(array_agg(DISTINCT krc.fk_kid_parent), null) AS parents,
	array_remove(array_agg(DISTINCT krp.fk_kid_child), null) AS children,
	COALESCE(array_remove((SELECT array_agg(DISTINCT fk_kid_child) FROM kara_relation WHERE fk_kid_parent = ANY (array_remove(array_agg(DISTINCT krc.fk_kid_parent), null))), ak.pk_kid), array[]::uuid[]) AS siblings
  `}
FROM ${fromClauses.join(', ')}
LEFT JOIN kara_subchecksum ksub ON ksub.fk_kid = ak.pk_kid
${forPlayer ? '' : `
	LEFT OUTER JOIN kara_relation krp ON krp.fk_kid_parent = ak.pk_kid
	LEFT OUTER JOIN kara_relation krc ON krc.fk_kid_child = ak.pk_kid
	LEFT JOIN playlist_content plc ON plc.fk_kid = ak.pk_kid
`}
${joinClause}
${additionalFrom.join('')}
WHERE ${includeStaging ? 'TRUE' : 'ak.repository != \'Staging\''}
    ${forPlayer ?
		`AND NOT (ak.pk_kid = ANY('{${hardsubsInProgress.join(',')}}'))`
	: ''}
	${forPlayer ?
		'AND NOT ak.tags @> \'[{"noLiveDownload": true}]\''
	: ''}
	${
	collectionClauses.length > 0
		? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})`
		: ''
	}
	${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
	${whereClauses.join(' ')}

GROUP BY ${groupClause}
	ak.pk_kid,
	ak.titles,
	ak.titles_default_language,
	ak.mediasize,
	ksub.subchecksum,
	ak.songname,

	${forPlayer ? 'dummy' : `
	ak.titles_aliases,
	ak.songorder,
	ak.tags,
	ak.serie_singergroup_singer_sortable,
	ak.lyrics_infos,
	ak.year,
	ak.mediafile,
	ak.karafile,
	ak.duration,
	ak.loudnorm,
	ak.created_at,
	ak.modified_at,
	ak.repository,
	ak.comment,
	ak.songtypes_sortable,
	ak.ignore_hooks,
	ak.titles_sortable,
	ak.kitsu_ids,
	ak.anilist_ids,
	ak.from_display_type,
	ak.myanimelist_ids
	`}
ORDER BY ${orderClauses} ${forPlayer ? 'dummy' : `
	ak.serie_singergroup_singer_sortable,
	ak.songtypes_sortable DESC,
	ak.songorder,
	ak.titles_sortable
`}
${limitClause}
${offsetClause}

`;

export const getAllKarasCount = (
	filterClauses: string[],
	joinClause: string,
	whereClauses: string[],
	fromClauses: string[],
	additionalFrom: string[],
	includeStaging: boolean,
	collectionClauses: string[],
	withCTE: string[],
) => `
SELECT COUNT(*)::integer AS count FROM (
	WITH ${withCTE.join(', \n')}
	SELECT
		DISTINCT ak.pk_kid AS kid
	FROM ${fromClauses.join(', ')}
	LEFT JOIN playlist_content plc ON plc.fk_kid = ak.pk_kid
	${joinClause}
${additionalFrom.join('')}
WHERE ${includeStaging ? 'TRUE' : 'ak.repository != \'Staging\''}
   ${
	collectionClauses.length > 0
		? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})`
		: ''
	}
	${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
	${whereClauses.join(' ')}
) res_to_count
`;

export const insertKara = `
INSERT INTO kara(
	titles,
	titles_aliases,
	titles_default_language,
	year,
	songorder,
	mediafile,
	duration,
	loudnorm,
	modified_at,
	created_at,
	karafile,
	pk_kid,
	repository,
	mediasize,
	download_status,
	comment,
	ignore_hooks,
	from_display_type,
	songname,
	lyrics_infos
)
VALUES(
	:titles,
	:titles_aliases,
	:titles_default_language,
	:year,
	:songorder,
	:mediafile,
	:duration,
	:loudnorm,
	:modified_at,
	:created_at,
	:karafile,
	:kid,
	:repository,
	:mediasize,
	:download_status,
	:comment,
	:ignoreHooks,
	:from_display_type,
	:songname,
	:lyrics_infos
);
`;

export const deleteKara = `
DELETE FROM kara WHERE pk_kid = ANY ($1);
`;

export const getYears = (orderClauses: string, collectionClauses: string[]) => `
SELECT DISTINCT
	k.year,
	COUNT(k2.pk_kid)::integer AS karacount
FROM kara AS k
LEFT JOIN kara k2 ON k2.pk_kid = k.pk_kid
LEFT JOIN all_karas ak ON k2.pk_kid = ak.pk_kid
WHERE true
${collectionClauses.length > 0 ? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})` : ''}
GROUP BY k.year
ORDER BY ${orderClauses};
`;

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

export const refreshKaraStats = {
	played: `
	WITH all_sessions AS (SELECT * FROM stats_session),
			all_played AS (SELECT * FROM stats_played)
		SELECT ak.pk_kid AS fk_kid,
		(SELECT
        	COUNT(sp.fk_kid)
        	FROM all_played sp
        	LEFT JOIN all_sessions ss ON ss.pk_seid = sp.fk_seid AND ss.flag_banned = FALSE
        	WHERE ak.pk_kid = sp.fk_kid
 		) AS played
 		FROM all_karas ak
	`,
	playedRecently: `
	WITH all_sessions AS (SELECT * FROM stats_session),
			all_played AS (SELECT * FROM stats_played)
		SELECT ak.pk_kid AS fk_kid,
		(SELECT
        	COUNT(sp.fk_kid)
        	FROM all_played sp
        	LEFT JOIN all_sessions ss ON ss.pk_seid = sp.fk_seid AND ss.flag_banned = FALSE
        	WHERE ak.pk_kid = sp.fk_kid
				AND played_at >= current_date - interval '1' year
 		) AS played_recently
 		FROM all_karas ak
	`,
	requested: `
		WITH all_sessions AS (SELECT * FROM stats_session),
			all_requested AS (SELECT * FROM stats_requested)
		SELECT ak.pk_kid AS fk_kid,
		(SELECT
			COUNT(sr.fk_kid)
			FROM all_requested sr
			LEFT JOIN all_sessions ss ON ss.pk_seid = sr.fk_seid AND ss.flag_banned = FALSE
			WHERE
				ak.pk_kid = sr.fk_kid
		) AS requested
		FROM all_karas ak
	`,
	requestedRecently: `
		WITH all_sessions AS (SELECT * FROM stats_session),
			all_requested AS (SELECT * FROM stats_requested)
		SELECT ak.pk_kid AS fk_kid,
		(SELECT
			COUNT(sr.fk_kid)
			FROM all_requested sr
			LEFT JOIN all_sessions ss ON ss.pk_seid = sr.fk_seid AND ss.flag_banned = FALSE
			WHERE
				ak.pk_kid = sr.fk_kid
				AND requested_at >= current_date - interval '1' year
		) AS requested_recently
		FROM all_karas ak
	`,
	favorited: `
	WITH all_favorites AS (SELECT * FROM users_favorites),
			all_users AS (SELECT pk_login, flag_sendstats FROM users)
		SELECT ak.pk_kid AS fk_kid,

			(SELECT
				COUNT(uf.fk_kid)
				FROM all_favorites uf
				LEFT JOIN all_users u ON u.pk_login = uf.fk_login
				WHERE ak.pk_kid = uf.fk_kid AND
				(u.flag_sendstats IS NULL OR u.flag_sendstats = TRUE)
		) AS favorited
		FROM all_karas ak
	`
};

export const createKaraStatsIndexes = `
CREATE UNIQUE INDEX idx_kara_stats_kid ON kara_stats(fk_kid);
CREATE INDEX idx_kara_stats_played ON kara_stats(played);
CREATE INDEX idx_kara_stats_requested ON kara_stats(requested);
CREATE INDEX idx_kara_stats_played_recently ON kara_stats(played_recently);
CREATE INDEX idx_kara_stats_requested_recently ON kara_stats(requested_recently);
CREATE INDEX idx_kara_stats_favorited ON kara_stats(favorited);
`;

export const insertKaraStats = `
INSERT INTO kara_stats
VALUES(
	$1,
	$2,
	$3,
	$4,
	$5,
	$6
) ON CONFLICT(fk_kid) DO UPDATE SET
  played = $2,
  played_recently = $3,
  requested = $4,
  requested_recently = $5,
  favorited = $6;
`;

export const deleteKaraStats = `
DELETE FROM kara_stats WHERE fk_kid NOT IN (SELECT fk_kid FROM all_karas);
`;

export const selectAllKIDs = (singleKID: string) => `
SELECT pk_kid AS kid
FROM kara
${singleKID ? 'WHERE pk_kid = $1' : ''}
`;

export const deleteChildrenKara = 'DELETE FROM kara_relation WHERE fk_kid_child = $1';

export const insertChildrenParentKara = `
INSERT INTO kara_relation(
	fk_kid_parent,
	fk_kid_child
)
VALUES(
	:parent_kid,
	:child_kid
);
`;
