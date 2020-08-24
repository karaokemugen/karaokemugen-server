/* Replace with your SQL commands */

DROP INDEX idx_ak_created;
DROP INDEX idx_ak_name;
DROP INDEX idx_ak_songtype;
DROP INDEX idx_ak_songorder;
DROP INDEX idx_ak_title;
DROP INDEX idx_ak_singer;

DROP MATERIALIZED VIEW all_karas;
CREATE VIEW all_karas AS
WITH series_i18n(serie_id, serie_langs) AS (
     SELECT sl.fk_id_serie, array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name)))
     FROM serie_lang sl
     GROUP BY sl.fk_id_serie
), t_singer(singers) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_songtype(songtypes) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_creator(creators) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_language(languages) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_misc(misc) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_author(authors) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_group(groups) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
), t_songwriter(songwriters) AS (
     SELECT array_to_json(array_agg(json_build_object('id', t.tag_id, 'name', t.name, 'slug', t.slug, 'karacount', t.karacount )))
     FROM all_tags t
     GROUP BY t.tag_id
)

SELECT
 k.pk_id_kara AS kara_id,
  k.kid,
  k.title,
  k.duration,
  k.gain,
  k.year,
  k.mediafile,
  k.subfile,
  k.created_at,
  k.modified_at,
  k.songorder,
  k.karafile,
  k.mediasize,
  jsonb_agg(DISTINCT(s.seriefile)) AS seriefiles,
  jsonb_agg(DISTINCT(s.sid)) AS sid,
  jsonb_agg(DISTINCT(s18.serie_langs)::jsonb) as serie_i18n,
  string_agg(DISTINCT(s.name),',') AS serie,
  jsonb_agg(DISTINCT(s.aliases)) AS serie_altname,
  array_agg(DISTINCT(s.pk_id_serie)) AS serie_id,
  jsonb_agg(DISTINCT(t_singer.singers)::jsonb) AS singer,
  jsonb_agg(DISTINCT(t_songtype.songtypes)::jsonb) AS songtype,
  jsonb_agg(DISTINCT(t_singer.singers)::jsonb) AS singer,jsonb_agg(DISTINCT(t_language.languages)::jsonb) AS language,
  jsonb_agg(DISTINCT(t_author.authors)::jsonb) AS author,
  jsonb_agg(DISTINCT(t_misc.misc)::jsonb) AS misc,
  jsonb_agg(DISTINCT(t_songwriter.songwriters)::jsonb) AS songwriter,
  jsonb_agg(DISTINCT(t_group.groups)::jsonb) AS group,
  array_agg(DISTINCT(kt.fk_id_tag)) AS all_tags_id
FROM kara k
LEFT JOIN kara_serie ks ON k.pk_id_kara = ks.fk_id_kara
LEFT JOIN serie s ON ks.fk_id_serie = s.pk_id_serie
LEFT JOIN series_i18n s18 ON s18.serie_id = ks.fk_id_serie
LEFT JOIN kara_tag kt ON k.pk_id_kara = kt.fk_id_kara
LEFT JOIN t_singer ON kt.fk_id_tag = t_singer.pk_id_tag AND t_singer.tagtype = 2
LEFT JOIN t_songtype ON kt.fk_id_tag = t_songtype.pk_id_tag AND t_songtype.tagtype = 3
LEFT JOIN t_creator ON kt.fk_id_tag = t_creator.pk_id_tag AND t_creator.tagtype = 4
LEFT JOIN t_language ON kt.fk_id_tag = t_language.pk_id_tag AND t_language.tagtype = 5
LEFT JOIN t_author ON kt.fk_id_tag = t_author.pk_id_tag AND t_author.tagtype = 6
LEFT JOIN t_misc ON kt.fk_id_tag = t_misc.pk_id_tag AND t_misc.tagtype = 7
LEFT JOIN t_group ON kt.fk_id_tag = t_group.pk_id_tag AND t_group.tagtype = 9
LEFT JOIN t_songwriter ON kt.fk_id_tag = t_songwriter.pk_id_tag AND t_songwriter.tagtype = 8
GROUP BY k.pk_id_kara
ORDER BY language, serie, singer, songtype DESC, songorder;
