export const upsertInstance = `
INSERT INTO instance(
	modified_at,
	pk_iid,
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
	ON CONFLICT (pk_iid) DO UPDATE SET
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
WHERE fk_iid = $1;
`;

export const insertFavorite = `
INSERT INTO favorite(fk_iid, fk_kid)
VALUES(
	$1,
	$2
) ON CONFLICT DO NOTHING;
`;

export const insertViewcount = `
INSERT INTO played(fk_iid, fk_kid, session_started_at, played_at)
VALUES(
	$1,
	$2,
	$3,
	$4
)
ON CONFLICT (fk_iid, fk_kid, session_started_at, played_at) DO NOTHING;
`;

export const insertRequested = `
INSERT INTO requested(fk_iid, fk_kid, session_started_at, requested_at)
VALUES(
	$1,
	$2,
	$3,
	$4
)
ON CONFLICT (fk_iid, fk_kid, session_started_at, requested_at) DO NOTHING;
`;

export const getPlayedStats = (filterClauses, lang, limitClause, offsetClause) => `
WITH p AS (SELECT fk_kid, COUNT(*) AS nb FROM played GROUP BY fk_kid)
SELECT
  ak.kid AS kid,
  ak.title AS title,
  ak.songorder AS songorder,
  COALESCE(
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_sid = ks.fk_sid AND ks.fk_kid = kid AND sl.lang = ${lang.main}),
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_sid = ks.fk_sid AND ks.fk_kid = kid AND sl.lang = ${lang.fallback}),
	  ak.serie) AS serie,
  ak.serie_altname AS serie_altname,
  ak.serie_i18n AS serie_i18n,
  ak.sid AS sid,
  ak.seriefiles AS seriefiles,
  ak.subfile AS subfile,
  ak.singers AS singers,
  ak.songtypes AS songtype,
  ak.creators AS creators,
  ak.songwriters AS songwriters,
  ak.year AS year,
  ak.languages AS languages,
  ak.authors AS authors,
  ak.misc_tags AS misc_tags,
  ak.mediafile AS mediafile,
  ak.karafile AS karafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize,
  p.nb AS played
FROM all_karas AS ak
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
HAVING played > 1
ORDER BY played DESC
${limitClause}
${offsetClause}
`;

export const getRequestedStats = (filterClauses, lang, limitClause, offsetClause) => `
WITH rq AS (SELECT fk_kid, COUNT(*) AS nb FROM requested GROUP BY fk_kid)
SELECT
  ak.kid AS kid,
  ak.title AS title,
  ak.songorder AS songorder,
  COALESCE(
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_sid = ks.fk_sid AND ks.fk_kid = kid AND sl.lang = ${lang.main}),
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_sid = ks.fk_sid AND ks.fk_kid = kid AND sl.lang = ${lang.fallback}),
	  ak.serie) AS serie,
  ak.serie_altname AS serie_altname,
  ak.serie_i18n AS serie_i18n,
  ak.sid AS sid,
  ak.seriefiles AS seriefiles,
  ak.subfile AS subfile,
  ak.singers AS singers,
  ak.songtypes AS songtype,
  ak.creators AS creators,
  ak.songwriters AS songwriters,
  ak.year AS year,
  ak.languages AS languages,
  ak.authors AS authors,
  ak.misc_tags AS misc_tags,
  ak.mediafile AS mediafile,
  ak.karafile AS karafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize,
  rq.nb AS requested
FROM all_karas AS ak
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
HAVING requested > 1
ORDER BY requested DESC
${limitClause}
${offsetClause}
`;

export const getFavoritesStats = (filterClauses, lang, limitClause, offsetClause) => `
WITH fav AS (SELECT fk_kid, COUNT(*) AS nb FROM favorite GROUP BY fk_kid)
SELECT
  ak.kid AS kid,
  ak.title AS title,
  ak.songorder AS songorder,
  COALESCE(
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_sid = ks.fk_sid AND ks.fk_kid = kid AND sl.lang = ${lang.main}),
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_sid = ks.fk_sid AND ks.fk_kid = kid AND sl.lang = ${lang.fallback}),
	  ak.serie) AS serie,
  ak.serie_altname AS serie_altname,
  ak.serie_i18n AS serie_i18n,
  ak.sid AS sid,
  ak.seriefiles AS seriefiles,
  ak.subfile AS subfile,
  ak.singers AS singers,
  ak.songtypes AS songtype,
  ak.creators AS creators,
  ak.songwriters AS songwriters,
  ak.year AS year,
  ak.languages AS languages,
  ak.authors AS authors,
  ak.misc_tags AS misc_tags,
  ak.mediafile AS mediafile,
  ak.karafile AS karafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize,
  fav.nb AS favorited
FROM all_karas AS ak
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
HAVING favorites > 1
ORDER BY favorites DESC
${limitClause}
${offsetClause}
`;