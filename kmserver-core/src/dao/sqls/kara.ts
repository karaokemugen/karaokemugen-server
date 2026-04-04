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
	${collectionClauses.length > 0
		? `AND ((${collectionClauses
				.map(clause => `(${clause})`)
				.join(
					' OR '
				)}) OR jsonb_array_length(jsonb_path_query_array( ak.tags, '$[*] ? (@.type_in_kara == 16)')) = 0)`
		: ''
}

`;

export const selectAllKaras = (
	filterClauses: string[],
	orderClauses: string[],
	limitClause: string,
	offsetClause: string,
	selectClause: string,
	joinClause: string,
	whereClauses: string[],
	fromClauses: string[],
	additionalFrom: string[],
	includeStaging: boolean,
	collectionClauses: string[],
	sensitiveTagsClause: string,
	withCTE: string[],
	forPlayer: boolean,
	hardsubsInProgress: string[],
	random: number,
	favoritedBy: string,
) => `
WITH 
favorited AS (
    SELECT fk_kid 
	FROM users_favorites
	WHERE fk_login ${favoritedBy ? '= :username' : 'IS NULL'}
),
parents_agg AS (
    SELECT fk_kid_child AS pk_kid,
           array_agg(DISTINCT fk_kid_parent) AS parent_ids
    FROM kara_relation
    GROUP BY fk_kid_child
),
children_agg AS (
    SELECT fk_kid_parent AS pk_kid,
           array_agg(DISTINCT fk_kid_child) AS child_ids
    FROM kara_relation
    GROUP BY fk_kid_parent
),
siblings_agg AS (
    SELECT p.pk_kid,
           array_remove(array_agg(DISTINCT kr2.fk_kid_child), p.pk_kid) AS sibling_ids
    FROM parents_agg p
    JOIN kara_relation kr2 ON kr2.fk_kid_parent = ANY(p.parent_ids)
    GROUP BY p.pk_kid
),
playlists_agg AS (
    SELECT fk_kid AS pk_kid,
           array_agg(DISTINCT fk_plaid) AS playlist_ids
    FROM playlist_content
    GROUP BY fk_kid
),
${withCTE.join(', \n')}

SELECT
  ak.pk_kid AS kid,
  ${random ? 'true as dummy' : `
	ak.titles AS titles,
	ak.titles_default_language as titles_default_language,
	ak.pk_kid || '.' || ak.mediasize::text || '.' || COALESCE(ksub.subchecksum, 'no_ass_file') || '.mp4' AS hardsubbed_mediafile,
	${selectClause}
	${forPlayer ? 'true as dummy' : `
		ak.tags AS tags,
		COALESCE(ks.requested, 0)                        AS requested,
		COALESCE(ks.requested_recently, 0)               AS requested_recently,
		COALESCE(ks.played, 0)                        AS played,
		COALESCE(ks.played_recently, 0)               AS played_recently,
		COALESCE(ks.favorited, 0)                     AS favorited,
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
		${sensitiveTagsClause} AS flag_sensitive_content,
		COALESCE(pl.playlist_ids,  array[]::uuid[])      AS playlists,
    	COALESCE(pa.parent_ids,    array[]::uuid[])      AS parents,
    	COALESCE(ca.child_ids,     array[]::uuid[])      AS children,
    	COALESCE(sa.sibling_ids,   array[]::uuid[])      AS siblings
	`}
  `}
FROM ${fromClauses.join(', ')}
${random ? '' : `
	LEFT JOIN kara_subchecksum ksub ON ksub.fk_kid = ak.pk_kid
	LEFT OUTER JOIN all_karas_sortable AS aks ON aks.fk_kid = ak.pk_kid
	${forPlayer ? '' : `
		LEFT JOIN kara_stats         ks   ON ks.fk_kid  = ak.pk_kid
		LEFT JOIN parents_agg        pa   ON pa.pk_kid   = ak.pk_kid
		LEFT JOIN children_agg       ca   ON ca.pk_kid   = ak.pk_kid
		LEFT JOIN siblings_agg       sa   ON sa.pk_kid   = ak.pk_kid
		LEFT JOIN playlists_agg      pl   ON pl.pk_kid   = ak.pk_kid
	`}
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
		? `AND ((${collectionClauses
				.map(clause => `(${clause})`)
				.join(
					' OR '
				)}) OR jsonb_array_length(jsonb_path_query_array( ak.tags, '$[*] ? (@.type_in_kara == 16)')) = 0)`
		: ''

	}
	${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
	${whereClauses.length > 0 ? `AND ${whereClauses.join('\nAND ')}` : ''}

ORDER BY ${orderClauses.join(',\n')}
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
		? `AND ((${collectionClauses
				.map(clause => `(${clause})`)
				.join(
					' OR '
				)}) OR jsonb_array_length(jsonb_path_query_array( ak.tags, '$[*] ? (@.type_in_kara == 16)')) = 0)`
		: ''
    }
	${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
	${whereClauses.length > 0 ? `AND ${whereClauses.join('\nAND ')}` : ''}
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
)
ON CONFLICT (pk_kid) DO UPDATE SET
    titles = :titles,
	titles_aliases = :titles_aliases,
	titles_default_language = :titles_default_language,
	year = :year,
	songorder = :songorder,
	mediafile = :mediafile,
	duration = :duration,
	loudnorm = :loudnorm,
	modified_at = :modified_at,
	created_at = :created_at,
	karafile = :karafile,
	repository = :repository,
	mediasize = :mediasize,
	download_status = :download_status,
	comment = :comment,
	ignore_hooks = :ignoreHooks,
	from_display_type = :from_display_type,
	songname = :songname,
	lyrics_infos = :lyrics_infos
;
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
${collectionClauses.length > 0
	? `AND ((${collectionClauses
			.map(clause => `(${clause})`)
			.join(
				' OR '
			)}) OR jsonb_array_length(jsonb_path_query_array( ak.tags, '$[*] ? (@.type_in_kara == 16)')) = 0)`
	: ''
}
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

export const selectOtherLikedKIDs = `
WITH users_with_fav AS 
	(SELECT fk_login FROM users_favorites WHERE fk_kid = $1)
SELECT 
	f.fk_kid AS kid
FROM users_favorites f
LEFT JOIN users_with_fav f2 ON f2.fk_login = f.fk_login
WHERE 
	 f.fk_kid != $1
 AND f.fk_login IN (SELECT * FROM users_with_fav) 
GROUP BY f.fk_kid
ORDER BY RANDOM() 
LIMIT $2;
`;
