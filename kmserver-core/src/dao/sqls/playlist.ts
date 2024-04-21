export const selectPlaylists = (joinClauses: string[], whereClauses: string[], filterClauses: string[], additionalFrom: string, orderClause: string, selectClauses: string[], groupClauses: string[]) => `
WITH all_users AS (
	SELECT
		pk_login AS username,
		nickname,
		avatar_file
	FROM users
)
SELECT
	pk_plaid AS plaid,
	name,
	description,
	slug,
	karacount,
	duration,
	p.created_at,
	modified_at,
	p.flag_visible,
	flag_visible_online,
	${selectClauses.join(', \n')}
	p.fk_login AS username,
	u.nickname AS nickname,
	u.avatar_file AS avatar_file,
	COALESCE(ps.favorited, 0) AS favorited,
	(SELECT coalesce(array_to_json(array_agg(row_to_json(contribs))), '[]')::jsonb
		FROM (
	SELECT * FROM all_users WHERE all_users.username = ANY((array_remove(array_agg(DISTINCT pco.fk_login), null))
	)) AS contribs) AS contributors
FROM playlist p
LEFT JOIN playlist_contributor pco ON pco.fk_plaid = p.pk_plaid
LEFT JOIN users u ON u.pk_login = p.fk_login
LEFT OUTER JOIN playlist_stats ps ON ps.fk_plaid = p.pk_plaid
${joinClauses.join('\n')}
${additionalFrom}
WHERE ${whereClauses.join(' \n AND ')}
${filterClauses.map(clause => ` AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
GROUP BY ${groupClauses.join(', ')}${groupClauses.length > 0 ? ',' : ''} p.pk_plaid, u.nickname, u.avatar_file, ps.favorited
ORDER BY ${orderClause}
`;

export const deletePlaylist = `
DELETE FROM playlist WHERE pk_plaid = $1
`;

export const editPlaylist = `
UPDATE playlist SET
	name = :name,
	description = :description,
	slug = :slug,
	flag_visible = :flag_visible,
	flag_visible_online = :flag_visible_online,
	search_vector = to_tsvector('public.unaccent_conf', :name) || to_tsvector('public.unaccent_conf', COALESCE(:description, '')) || to_tsvector('public.unaccent_conf', 	u.nickname)
FROM users u
WHERE pk_plaid = :plaid
  AND u.pk_login = playlist.fk_login
`;

export const createPlaylist = `
INSERT INTO playlist(
	pk_plaid,
	name,
	description,
	slug,
	karacount,
	duration,
	created_at,
	modified_at,
	flag_visible,
	flag_visible_online,
	fk_login,
	search_vector
)
VALUES(
	:plaid,
	:name,
	:description,
	:slug,
	0,
	0,
	:created_at,
	:modified_at,
	:flag_visible,
	:flag_visible_online,
	:username,
	to_tsvector(:name) || to_tsvector(:description) || to_tsvector((SELECT nickname FROM users WHERE pk_login = :username))
)
`;

export const updatePLCSetPos = `
UPDATE playlist_content
SET pos = $1
WHERE pk_plcid = $2;
`;

export const updatePlaylistLastEditTime = `
UPDATE playlist SET
	modified_at = :modified_at
WHERE pk_plaid = :plaid;
`;

export const insertContributor = `
INSERT INTO playlist_contributor(fk_plaid, fk_login)
VALUES ($1, $2) ON CONFLICT DO NOTHING;
`;

export const deleteContributor = `
DELETE FROM playlist_contributor
WHERE fk_plaid = $1 AND fk_login = $2
`;

export const updatePlaylistKaraCount = `
UPDATE playlist SET
	karacount = (
		SELECT COUNT(fk_kid)
		FROM playlist_content
		WHERE fk_plaid = $1
	)
WHERE pk_plaid = $1
`;

export const reorderPlaylist = `
UPDATE playlist_content
SET pos = A.new_pos
FROM  (SELECT ROW_NUMBER() OVER (ORDER BY pos) AS new_pos, pk_plcid
    FROM playlist_content
	INNER JOIN kara k ON playlist_content.fk_kid = k.pk_kid
    WHERE fk_plaid = $1) AS A
WHERE A.pk_plcid = playlist_content.pk_plcid
`;

export const updatePlaylistDuration = `
UPDATE playlist SET
	duration = (
		SELECT COALESCE(SUM(kara.duration),0) AS duration
			FROM kara, playlist_content
			WHERE playlist_content.fk_kid = kara.pk_kid
				AND playlist_content.fk_plaid = $1
				AND playlist_content.pos >= 0)
WHERE pk_plaid = $1;
`;

export const removeKaraFromPlaylist = `
DELETE FROM playlist_content
WHERE pk_plcid = ANY ($1)
`;

export const truncatePlaylist = `
DELETE FROM playlist_content
WHERE fk_plaid = $1
`;

export const updatePLC = `
UPDATE playlist_content
SET
	flag_refused = :flag_refused,
	flag_accepted = :flag_accepted,
	flag_visible = :flag_visible,
	flag_free = :flag_free
WHERE
    pk_plcid = :plcid
`;

export const selectPLCMini = `
SELECT
	pk_plcid AS plcid,
	fk_login AS username,
	fk_plaid AS plaid,
	fk_kid AS kid,
	flag_refused,
	flag_accepted,
	flag_visible,
	flag_free,
	pos
FROM
	playlist_content
WHERE pk_plcid = $1
`;

export const selectPlaylistContents = (
	filterClauses: string[],
	orderClause: string,
	limitClause: string,
	offsetClause: string,
	additionalFrom: string
) => `
SELECT
  ak.tags,
  ak.pk_kid AS kid,
  ak.titles,
  ak.titles_aliases,
  ak.titles_default_language,
  ak.songorder,
  ak.subfile,
  ak.year,
  ak.mediafile,
  ak.karafile,
  ak.duration,
  pc.created_at AS added_at,
  ak.mediasize,
  ksub.subchecksum AS subchecksum,
  ak.pk_kid || '.' || ak.mediasize::text || '.' || COALESCE(ksub.subchecksum, 'no_ass_file') || '.mp4' AS hardsubbed_mediafile,
  (CASE WHEN uf.fk_kid IS NULL
		THEN FALSE
		ELSE TRUE
  END) as flag_favorites,
  pc.nickname AS nickname,
  pc.fk_login AS username,
  u.avatar_file AS avatar_file,
  pc.pos AS pos,
  pc.pk_plcid AS plcid,
  pc.fk_plaid AS plaid,
  pc.flag_visible AS flag_visible,
  pc.flag_free AS flag_free,
  pc.flag_refused AS flag_refused,
  pc.flag_accepted AS flag_accepted,
  COUNT(*) OVER()::integer AS count,
  ak.repository AS repository
FROM all_karas AS ak
LEFT OUTER JOIN kara k ON k.pk_kid = ak.pk_kid
INNER JOIN playlist_content AS pc ON pc.fk_kid = ak.pk_kid
LEFT JOIN kara_subchecksum ksub ON ksub.fk_kid = ak.pk_kid
LEFT OUTER JOIN users AS u ON u.pk_login = pc.fk_login
LEFT OUTER JOIN users_favorites uf ON uf.fk_kid = ak.pk_kid AND uf.fk_login = :username
${additionalFrom}
WHERE pc.fk_plaid = :plaid
${filterClauses.map(clause => `AND (${clause})`).join(' ')}
GROUP BY ak.pk_kid, ak.titles, ak.titles_aliases, ak.titles_default_language, ak.songorder, ak.tags, ak.subfile, ak.year, ak.mediafile, ak.karafile, ak.duration, ak.mediasize, pc.created_at, pc.nickname, ak.download_status, ksub.subchecksum, pc.fk_login, pc.pos, pc.pk_plcid, uf.fk_kid, u.avatar_file, ak.repository
ORDER BY ${orderClause}
${limitClause}
${offsetClause}
`;

export const shiftPosInPlaylist = `
UPDATE playlist_content
SET pos = pos + :shift
WHERE fk_plaid = :plaid
	AND pos >= :pos
`;

export const getMaxPosInPlaylist = `
SELECT MAX(pos) AS maxpos
FROM playlist_content
WHERE fk_plaid = $1;
`;

export const addKaraToPlaylist = `
INSERT INTO playlist_content(
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

export const updatePlaylistSearchVector = (username: string) => `
UPDATE playlist
SET search_vector =
	to_tsvector('public.unaccent_conf', name) ||
	to_tsvector('public.unaccent_conf', COALESCE(description, '')) ||
	to_tsvector('public.unaccent_conf', u.nickname)
FROM users u
WHERE u.pk_login = playlist.fk_login
${username ? ' AND fk_login = $1' : ''}
`;

export const deleteFavoritePlaylist = `
DELETE FROM users_playlist_favorites
WHERE fk_login = $1 AND fk_plaid = $2
`;

export const insertFavoritePlaylist = `
INSERT INTO users_playlist_favorites VALUES(
	$1,
	$2
) ON CONFLICT(fk_login, fk_plaid) DO NOTHING
`;

export const refreshPlaylistStats = `
WITH all_favorites AS (SELECT * FROM users_playlist_favorites),
	all_users AS (SELECT * FROM users)
SELECT p.pk_plaid AS fk_plaid,
 (SELECT
        COUNT(uf.fk_plaid)
        FROM all_favorites uf
        LEFT JOIN all_users u ON u.pk_login = uf.fk_login
        WHERE p.pk_plaid = uf.fk_plaid AND
        (u.flag_sendstats IS NULL OR u.flag_sendstats = TRUE)
 ) AS favorited
FROM playlist p;
`;

export const createPlaylistStatsIndexes = `
CREATE INDEX idx_playlist_stats_plaid ON playlist_stats(fk_plaid);
CREATE INDEX idx_playlist_stats_favorited ON playlist_stats(favorited);
`;
