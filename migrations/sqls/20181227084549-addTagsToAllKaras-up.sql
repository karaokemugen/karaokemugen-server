DROP MATERIALIZED VIEW all_karas;

CREATE MATERIALIZED VIEW all_karas AS
WITH series_i18n(serie_id, serie_langs) AS (
     SELECT sl.fk_id_serie, array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name)))
     FROM serie_lang sl
     GROUP BY sl.fk_id_serie
),
singer AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_singer)) AS singers, string_agg(t_singer.name, ', ' ORDER BY name) AS singers_sortable
    FROM kara_tag kt
    INNER JOIN tag t_singer ON kt.fk_id_tag = t_singer.pk_id_tag AND t_singer.tagtype = 2
   GROUP BY  kt.fk_id_kara
),
songtype AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_songtype)) AS songtypes, string_agg(t_songtype.name, ', ' ORDER BY name) AS songtypes_sortable
    FROM kara_tag kt
    INNER JOIN tag t_songtype ON kt.fk_id_tag = t_songtype.pk_id_tag AND t_songtype.tagtype = 3
   GROUP BY  kt.fk_id_kara
),
creator AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_creator)) AS creators
    FROM kara_tag kt
    INNER JOIN tag t_creator ON kt.fk_id_tag = t_creator.pk_id_tag AND t_creator.tagtype = 4
   GROUP BY  kt.fk_id_kara
),
language AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_language)) AS languages, string_agg(t_language.name, ', ' ORDER BY name) AS languages_sortable
    FROM kara_tag kt
    INNER JOIN tag t_language ON kt.fk_id_tag = t_language.pk_id_tag AND t_language.tagtype = 5
   GROUP BY  kt.fk_id_kara
),
author AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_author)) AS authors
    FROM kara_tag kt
    INNER JOIN tag t_author ON kt.fk_id_tag = t_author.pk_id_tag AND t_author.tagtype = 6
   GROUP BY kt.fk_id_kara
),
misc AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_misc)) AS misc_tags
    FROM kara_tag kt
    INNER JOIN tag t_misc ON kt.fk_id_tag = t_misc.pk_id_tag AND t_misc.tagtype = 7
   GROUP BY kt.fk_id_kara
),
songwriter AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_songwriter)) AS songwriters
    FROM kara_tag kt
    INNER JOIN tag t_songwriter ON kt.fk_id_tag = t_songwriter.pk_id_tag AND t_songwriter.tagtype = 8
   GROUP BY kt.fk_id_kara
),
group_tags AS (SELECT kt.fk_id_kara, jsonb_agg(to_jsonb(t_group)) AS groups
    FROM kara_tag kt
    INNER JOIN tag t_group ON kt.fk_id_tag = t_group.pk_id_tag AND t_group.tagtype = 9
   GROUP BY kt.fk_id_kara
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
  singer.singers AS singers,
  singer.singers_sortable AS singers_sortable,
  songtype.songtypes AS songtypes,
  songtype.songtypes_sortable AS songtypes_sortable,
  creator.creators AS creators,
  language.languages AS languages,
  language.languages_sortable AS languages_sortable,
  author.authors AS authors,
  misc.misc_tags AS misc_tags,
  songwriter.songwriters AS songwriters,
  group_tags.groups AS groups,
  array_agg(DISTINCT(kt.fk_id_tag)) AS all_tags_id,
  string_agg(DISTINCT(t.name),' ') AS tags
FROM kara k
LEFT JOIN kara_serie ks ON k.pk_id_kara = ks.fk_id_kara
LEFT JOIN serie s ON ks.fk_id_serie = s.pk_id_serie
LEFT JOIN series_i18n s18 ON s18.serie_id = ks.fk_id_serie
LEFT JOIN kara_tag kt ON k.pk_id_kara = kt.fk_id_kara
LEFT JOIN tag t ON kt.fk_id_tag = t.pk_id_tag
LEFT OUTER JOIN singer on k.pk_id_kara = singer.fk_id_kara
LEFT OUTER JOIN songtype on k.pk_id_kara = songtype.fk_id_kara
LEFT OUTER JOIN creator on k.pk_id_kara = creator.fk_id_kara
LEFT OUTER JOIN language on k.pk_id_kara = language.fk_id_kara
LEFT OUTER JOIN author on k.pk_id_kara = author.fk_id_kara
LEFT OUTER JOIN misc on k.pk_id_kara = misc.fk_id_kara
LEFT OUTER JOIN songwriter on k.pk_id_kara = songwriter.fk_id_kara
LEFT OUTER JOIN group_tags on k.pk_id_kara = group_tags.fk_id_kara
GROUP BY k.pk_id_kara, languages_sortable, songtypes_sortable, singers_sortable, singers, songtypes, groups, songwriters, misc_tags, authors, languages, creators
ORDER BY languages_sortable, serie, singers_sortable, songtypes_sortable DESC, songorder;

CREATE INDEX idx_ak_created ON all_karas(created_at DESC);
CREATE INDEX idx_ak_serie ON all_karas(serie NULLS LAST);
CREATE INDEX idx_ak_songtypes ON all_karas(songtypes_sortable DESC);
CREATE INDEX idx_ak_songorder ON all_karas(songorder);
CREATE INDEX idx_ak_title ON all_karas(title);
CREATE INDEX idx_ak_singer ON all_karas(singers_sortable);
CREATE INDEX idx_ak_language ON all_karas(languages_sortable);
CREATE INDEX idx_ak_year ON all_karas(year);
CREATE INDEX idx_ak_kid ON all_karas(kid);
CREATE INDEX idx_ak_tags ON all_karas(tags);