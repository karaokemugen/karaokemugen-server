// SQL for kara management

export const countKaras = (filterClauses, typeClauses) => `
SELECT COUNT(kid) AS count
FROM all_karas AS ak
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
`;

export const getAllKaras = (filterClauses, lang, typeClauses, orderClauses, limitClause, offsetClause) => `SELECT
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
  ak.mediasize AS mediasize
FROM all_karas AS ak
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
ORDER BY ${orderClauses} ak.languages_sortable, ak.serie IS NULL, lower(unaccent(serie)), ak.songtypes_sortable DESC, ak.songorder, lower(unaccent(singers_sortable)), lower(unaccent(ak.title))
${limitClause}
${offsetClause}
`;

export const getYears = 'SELECT year, karacount FROM all_years';

export const selectBaseStats = `
SELECT
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=2) AS singers,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=8) AS songwriters,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=4) AS creators,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=6) AS authors,
(SELECT COUNT(pk_kid) FROM kara) AS karas,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=5) AS languages,
(SELECT COUNT(pk_sid) FROM serie) AS series,
(SELECT SUM(duration) FROM kara) AS duration;
`;