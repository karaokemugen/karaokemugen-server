export const sqlselectPlaylists = (joinClauses: string[], whereClauses: string[]) => `
SELECT
	pk_plaid AS plaid,
	name,
	slug,
	karacount,
	duration,
	created_at,
	modified_at,
	flag_visible,
	flag_visible_online,
	p.fk_login AS username,
	fk_id_plcontent_playing AS plcontent_id_playing,
	array_agg(pco.fk_login) AS contributors
FROM playlists p
LEFT JOIN playlists_contributors pco ON pco.fk_plaid = p.pk_plaid
${joinClauses.join('\n')}
WHERE ${whereClauses.join(' \n AND ')}
GROUP BY p.pk_plaid
ORDER BY p.name
`;

export const sqldeletePlaylist = `
DELETE FROM playlists WHERE pk_plaid = $1
`;

export const sqleditPlaylist = `
UPDATE playlists SET
	name = :name,
	slug = :slug,
	flag_visible = :flag_visible,
	flag_visible_online = :flag_visible_online
WHERE pk_plaid = :plaid;
`;

export const sqlcreatePlaylist = `
INSERT INTO playlists(
	pk_plaid,
	name,
	slug,
	karacount,
	duration,
	created_at,
	modified_at,
	flag_visible,
	flag_visible_online,
	fk_login
)
VALUES(
	:plaid,
	:name,
	:slug,
	0,
	0,
	:created_at,
	:modified_at,
	:flag_visible,
	:flag_visible_online,
	:username
)
`;

export const sqlupdatePLCSetPos = `
UPDATE playlists_content
SET pos = $1
WHERE pk_plcid = $2;
`;

export const sqlupdatePlaylistLastEditTime = `
UPDATE playlists SET
	modified_at = :modified_at
WHERE pk_plaid = :plaid;
`;

export const sqlinsertContributor = `
INSERT INTO playlists_contributors(fk_plaid, fk_login)
VALUES ($1, $2) ON CONFLICT DO NOTHING;
`;

export const sqldeleteContributor = `
DELETE FROM playlists_contributors
WHERE fk_plaid = $1 AND fk_login = $2
`;

export const sqlupdatePlaylistKaraCount = `
UPDATE playlists SET
	karacount = (
		SELECT COUNT(fk_kid)
		FROM playlists_content, kara AS k
		WHERE fk_plaid = $1
		  AND fk_kid = pk_kid
	)
WHERE pk_plaid = $1
`;

export const sqlreorderPlaylist = `
UPDATE playlists_content
SET pos = A.new_pos
FROM  (SELECT ROW_NUMBER() OVER (ORDER BY pos) AS new_pos, pk_plcid
    FROM playlists_content
	INNER JOIN kara k ON playlists_content.fk_kid = k.pk_kid
    WHERE fk_plaid = $1) AS A
WHERE A.pk_plcid = playlists_content.pk_plcid
`;

export const sqlupdatePlaylistDuration = `
UPDATE playlists SET
	duration = (
		SELECT COALESCE(SUM(kara.duration),0) AS duration
			FROM kara, playlists_content
			WHERE playlists_content.fk_kid = kara.pk_kid
				AND playlists_content.fk_plaid = $1
				AND playlists_content.pos >= 0)
WHERE pk_plaid = $1;
`;

export const sqlremoveKaraFromPlaylist = `
DELETE FROM playlists_content
WHERE pk_plcid = ANY ($1)
`;

export const sqltruncatePL = `
DELETE FROM playlists_contents
WHERE fk_plaid = $1
`;
export const sqlupdatePLC = `
UPDATE playlists_content
SET
	flag_refused = :flag_refused,
	flag_accepted = :flag_accepted,
	flag_visible = :flag_visible,
	flag_free = :flag_free
WHERE
    pk_plcid = :plcid
`;

export const sqlselectPLCMini = `
SELECT
pk_plcid,
fk_login AS username,
fk_plaid AS plaid,
fk_kid AS kid,
flag_refused,
flag_accepted,
flag_visible,
flag_free,
pos
FROM
playlists_content
WHERE pk_plcid = $1
`;

export const sqlgetPlaylistContents = (filterClauses: string[], whereClause: string, orderClause: string, limitClause: string, offsetClause: string,
	additionalFrom: string) => `
SELECT
ak.pk_kid AS kid,
ak.title AS title,
ak.songorder AS songorder,
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
COALESCE(ak.versions, '[]'::jsonb) AS versions,
ak.mediafile AS mediafile,
ak.karafile AS karafile,
ak.duration AS duration,
pc.created_at AS created_at,
ak.mediasize AS mediasize,
(CASE WHEN f.fk_kid IS NULL
THEN FALSE
ELSE TRUE
END) as flag_favorites,
pc.nickname AS nickname,
pc.fk_login AS username,
u.avatar_file AS avatar_file,
u.type AS user_type,
pc.pos AS pos,
pc.flag_visible AS flag_visible,
pc.flag_free AS flag_free,
pc.flag_accepted AS flag_accepted,
pc.flag_refused AS flag_refused,
pc.pk_plcid AS plcid,
COUNT(pc.pk_plcid) OVER()::integer AS count,
ak.repository AS repository
FROM all_karas AS ak
INNER JOIN playlists_content AS pc ON pc.fk_kid = ak.pk_kid
LEFT OUTER JOIN users AS u ON u.pk_login = pc.fk_login
LEFT OUTER JOIN users_favorites f ON f.fk_kid = ak.pk_kid AND f.fk_login = :username
LEFT OUTER JOIN playlists AS pl ON pl.pk_plaid = pc.fk_plaid
${additionalFrom}
WHERE pc.fk_plaid = :plaid
${filterClauses.map(clause => 'AND (' + clause + ')').join(' ')}
${whereClause}
GROUP BY ak.pk_kid, ak.title, ak.songorder, ak.series, ak.subfile, ak.singers, ak.songtypes,
ak.creators, ak.songwriters, ak.year, ak.languages, ak.authors, ak.misc, ak.origins, ak.families, ak.genres,
ak.platforms, ak.versions, ak.mediafile, ak.groups, ak.karafile, ak.duration, ak.mediasize, pc.created_at, pc.nickname,
pc.fk_login, pc.pos, pc.pk_plcid, f.fk_kid, u.avatar_file, u.type, ak.repository
ORDER BY ${orderClause}
${limitClause}
${offsetClause}
`;

export const sqlshiftPosInPlaylist = `
UPDATE playlists_content
SET pos = pos + :shift
WHERE fk_plaid = :plaid
	AND pos >= :pos
`;

export const sqlgetMaxPosInPlaylist = `
SELECT MAX(pos) AS maxpos
FROM playlists_content
WHERE fk_plaid = $1;
`;

export const sqladdKaraToPlaylist = `
INSERT INTO playlists_content(
	fk_plaid,
	fk_login,
	nickname,
	fk_kid,
	created_at,
	pos,
	flag_free,
	flag_visible,
	flag_refused,
	flag_accepted
) VALUES(
	$1,
	$2,
	$3,
	$4,
	$5,
	$6,
	$7,
	$8,
	$9,
	$10
) RETURNING pk_plcid AS plcid, fk_kid AS kid, pos, fk_login AS username
`;