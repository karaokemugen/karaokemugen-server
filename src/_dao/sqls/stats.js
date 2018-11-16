export const upsertInstance = `
INSERT INTO instance(
	modified_at,
	instance_id,
	version,
	locale,
	screens,
	cpu_manufacturer,
	cpu_model,
	cpu_speed,
	cpu_cores,
	memory,
	total_disk_space,
	os_platform,
	os_distro,
	os_release,
	config)
	VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	ON CONFLICT (instance_id) DO UPDATE SET
	modified_at = $1,
	version = $3,
	locale = $4,
	screens = $5,
	cpu_manufacturer = $6,
	cpu_model = $7,
	cpu_speed = $8,
	cpu_cores = $9,
	memory = $10,
	total_disk_space = $11,
	os_platform = $12,
	os_distro = $13,
	os_release = $14,
	config = $15;
`;

export const deleteFavorites = `
DELETE FROM favorite
WHERE fk_id_instance = (SELECT pk_id_instance FROM instance WHERE instance_id = $1);
`;

export const insertFavorite = `
INSERT INTO favorite(fk_id_instance, kid)
VALUES(
	(SELECT pk_id_instance FROM instance WHERE instance_id = $1),
	$2
)
`;

export const insertViewcount = `
INSERT INTO played(fk_id_instance, kid, session_started_at, played_at)
VALUES(
	(SELECT pk_id_instance FROM instance WHERE instance_id = $1),
	$2,
	$3,
	$4
)
ON CONFLICT (fk_id_instance, kid, session_started_at, played_at) DO NOTHING;
`;

export const insertRequested = `
INSERT INTO requested(fk_id_instance, kid, session_started_at, requested_at)
VALUES(
	(SELECT pk_id_instance FROM instance WHERE instance_id = $1),
	$2,
	$3,
	$4
)
ON CONFLICT (fk_id_instance, kid, session_started_at, requested_at) DO NOTHING;
`;

export const getPlayedStats = `
SELECT ak.title AS title,
	ak.songorder AS songorder,
	ak.serie AS serie,
	ak.serie_i18n AS serie_i18n,
	ak.singer AS singer,
    ak.songtype AS songtype,
    ak.language AS language,
	(SELECT COUNT(pk_id_played) FROM played WHERE kid = ak.kid) AS played
FROM all_karas AS ak
WHERE played > 0
ORDER BY played DESC
`;

export const getRequestedStats = `
SELECT ak.title AS title,
	ak.songorder AS songorder,
	ak.serie AS serie,
	ak.serie_i18n AS serie_i18n,
	ak.singer AS singer,
    ak.songtype AS songtype,
    ak.language AS language,
	(SELECT COUNT(pk_id_requested) FROM requested WHERE kid = ak.kid) AS requested
FROM all_karas AS ak
WHERE requested > 0
ORDER BY requested DESC
`;

export const getFavoritesStats = `
SELECT ak.title AS title,
	ak.songorder AS songorder,
	ak.serie AS serie,
	ak.serie_i18n AS serie_i18n,
	ak.singer AS singer,
    ak.songtype AS songtype,
    ak.language AS language,
	(SELECT COUNT(pk_id_favorite) FROM favorite WHERE kid = ak.kid) AS favorites
FROM all_karas AS ak
WHERE favorites > 0
ORDER BY favorites DESC
`;