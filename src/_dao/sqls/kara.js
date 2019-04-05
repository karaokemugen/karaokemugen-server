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
	  (SELECT name FROM all_kara_serie_langs WHERE kid = ak.kid AND lang = ${lang.main}),
	  (SELECT name FROM all_kara_serie_langs WHERE kid = ak.kid AND lang = ${lang.fallback}),
	  ak.serie) AS serie,
  ak.serie AS serie_orig,
  ak.serie_altname AS serie_altname,
  ak.seriefiles AS seriefiles,
  ak.sid AS sid,
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
  ak.groups AS groups
FROM all_karas AS ak
LEFT OUTER JOIN kara_serie AS ks_main ON ks_main.fk_kid = ak.kid
LEFT OUTER JOIN serie_lang AS sl_main ON sl_main.fk_sid = ks_main.fk_sid AND sl_main.lang = ${lang.main}
LEFT OUTER JOIN kara_serie AS ks_fall ON ks_fall.fk_sid = ak.kid
LEFT OUTER JOIN serie_lang AS sl_fall ON sl_fall.fk_sid = ks_fall.fk_sid AND sl_fall.lang = ${lang.fallback}
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
GROUP BY ak.kid, ak.title, ak.songorder, ak.serie, ak.sid, ak.serie_altname,  ak.seriefiles, ak.subfile, ak.singers, ak.songtypes, ak.creators, ak.songwriters, ak.year, ak.languages, ak.authors, ak.misc_tags, ak.mediafile, ak.karafile, ak.duration, ak.gain, ak.created_at, ak.modified_at, ak.mediasize, ak.groups, ak.languages_sortable, ak.songtypes_sortable, ak.singers_sortable
ORDER BY ${orderClauses} ak.languages_sortable, ak.serie IS NULL, lower(unaccent(serie)), ak.songtypes_sortable DESC, ak.songorder, lower(unaccent(singers_sortable)), lower(unaccent(ak.title))
${limitClause}
${offsetClause}
`;

export const getYears = 'SELECT year, karacount::integer FROM all_years ORDER BY year';

export const selectBaseStats = `
SELECT
(SELECT COUNT(pk_id_tag)::integer FROM tag WHERE tagtype=2) AS singers,
(SELECT COUNT(pk_id_tag)::integer FROM tag WHERE tagtype=8) AS songwriters,
(SELECT COUNT(pk_id_tag)::integer FROM tag WHERE tagtype=4) AS creators,
(SELECT COUNT(pk_id_tag)::integer FROM tag WHERE tagtype=6) AS authors,
(SELECT COUNT(pk_kid) FROM kara)::integer AS karas,
(SELECT COUNT(pk_id_tag)::integer FROM tag WHERE tagtype=5) AS languages,
(SELECT COUNT(pk_sid)::integer FROM serie) AS series,
(SELECT SUM(mediasize)::bigint FROM kara) AS mediasize,
(SELECT SUM(duration)::integer FROM kara) AS duration;
`;