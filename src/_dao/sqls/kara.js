// SQL for kara management

export const getAllKaras = (filterClauses, lang, typeClauses, orderClauses) => `SELECT ak.kara_id AS kara_id,
  ak.kid AS kid,
  ak.title AS title,
  ak.songorder AS songorder,
  COALESCE(
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_id_serie = ks.fk_id_serie AND ks.fk_id_kara = kara_id AND sl.lang = ${lang.main}),
	  (SELECT sl.name FROM serie_lang sl, kara_serie ks WHERE sl.fk_id_serie = ks.fk_id_serie AND ks.fk_id_kara = kara_id AND sl.lang = ${lang.fallback}),
	  ak.serie) AS serie,
  ak.serie_altname AS serie_altname,
  ak.serie_i18n AS serie_i18n,
  ak.serie_id AS serie_id,
  ak.seriefile AS seriefile,
  ak.subfile AS subfile,
  ak.singer AS singer,
  ak.songtype AS songtype,
  ak.creator AS creator,
  ak.songwriter AS songwriter,
  ak.year AS year,
  ak.language AS language,
  ak.author AS author,
  ak.misc AS misc,
  ak.mediafile AS mediafile,
  ak.duration AS duration,
  ak.gain AS gain,
  ak.created_at AS created_at,
  ak.modified_at AS modified_at,
  ak.mediasize AS mediasize
FROM all_karas AS ak
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
ORDER BY ${orderClauses} language, ak.serie IS NULL, lower(unaccent(serie)), ak.songtype DESC, ak.songorder, lower(unaccent(singer)), lower(unaccent(ak.title))
`;

export const getYears = 'SELECT DISTINCT year FROM all_karas ORDER BY year';