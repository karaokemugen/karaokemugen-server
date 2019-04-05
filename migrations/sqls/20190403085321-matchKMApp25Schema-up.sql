
ALTER TABLE tag ADD COLUMN i18n JSONB;

CREATE UNIQUE INDEX idx_tag ON tag (name, tagtype);

CREATE INDEX idx_kara_tag_fk_id_tag ON kara_tag(fk_id_tag);

CREATE UNIQUE INDEX idx_kara_serie ON kara_serie (fk_kid, fk_sid);
CREATE UNIQUE INDEX idx_kara_tag ON kara_tag (fk_kid, fk_id_tag);

DROP MATERIALIZED VIEW all_kara_serie_langs;
DROP MATERIALIZED VIEW all_karas;
DROP MATERIALIZED VIEW all_series;
DROP MATERIALIZED VIEW all_tags;
DROP MATERIALIZED VIEW all_years;

DROP TABLE serie;

CREATE TABLE serie
(
    pk_sid uuid NOT NULL,
    name character varying NOT NULL,
    aliases jsonb,
    seriefile character varying,
    CONSTRAINT serie_pkey PRIMARY KEY (pk_sid),
    CONSTRAINT serie_name_key UNIQUE (name)
);

CREATE INDEX idx_serie_name ON serie(name);

DROP TABLE serie_lang;

CREATE TABLE serie_lang
(
    pk_id_serie_lang serial,
	fk_sid uuid,
    lang character(3) NOT NULL,
    name character varying NOT NULL,
    CONSTRAINT serielang_pkey PRIMARY KEY (pk_id_serie_lang)
);

CREATE INDEX idx_serie_lang_fk_sid ON serie_lang(fk_sid);
CREATE INDEX idx_sl_lang ON serie_lang(lang);

CREATE MATERIALIZED VIEW series_i18n AS
SELECT sl.fk_sid AS fk_sid, array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) AS serie_langs
FROM serie_lang sl
GROUP BY sl.fk_sid;

CREATE MATERIALIZED VIEW singer AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_singer)) AS singers, string_agg(t_singer.name, ', ' ORDER BY name) AS singers_sortable
    FROM kara_tag kt
    INNER JOIN tag t_singer ON kt.fk_id_tag = t_singer.pk_id_tag AND t_singer.tagtype = 2
   GROUP BY  kt.fk_kid;

CREATE MATERIALIZED VIEW songtype AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_songtype)) AS songtypes, string_agg(t_songtype.name, ', ' ORDER BY name) AS songtypes_sortable
    FROM kara_tag kt
    INNER JOIN tag t_songtype ON kt.fk_id_tag = t_songtype.pk_id_tag AND t_songtype.tagtype = 3
GROUP BY  kt.fk_kid;

CREATE MATERIALIZED VIEW creator AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_creator)) AS creators
    FROM kara_tag kt
    INNER JOIN tag t_creator ON kt.fk_id_tag = t_creator.pk_id_tag AND t_creator.tagtype = 4
GROUP BY  kt.fk_kid;

CREATE MATERIALIZED VIEW language AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_language)) AS languages, string_agg(t_language.name, ', ' ORDER BY name) AS languages_sortable
    FROM kara_tag kt
    INNER JOIN tag t_language ON kt.fk_id_tag = t_language.pk_id_tag AND t_language.tagtype = 5
GROUP BY  kt.fk_kid;

CREATE MATERIALIZED VIEW author AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_author)) AS authors
    FROM kara_tag kt
    INNER JOIN tag t_author ON kt.fk_id_tag = t_author.pk_id_tag AND t_author.tagtype = 6
GROUP BY kt.fk_kid;

CREATE MATERIALIZED VIEW misc AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_misc)) AS misc_tags
    FROM kara_tag kt
    INNER JOIN tag t_misc ON kt.fk_id_tag = t_misc.pk_id_tag AND t_misc.tagtype = 7
GROUP BY kt.fk_kid;

CREATE MATERIALIZED VIEW songwriter AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_songwriter)) AS songwriters
    FROM kara_tag kt
    INNER JOIN tag t_songwriter ON kt.fk_id_tag = t_songwriter.pk_id_tag AND t_songwriter.tagtype = 8
GROUP BY kt.fk_kid;

CREATE MATERIALIZED VIEW group_tags AS
SELECT kt.fk_kid, jsonb_agg(to_jsonb(t_group)) AS groups
    FROM kara_tag kt
    INNER JOIN tag t_group ON kt.fk_id_tag = t_group.pk_id_tag AND t_group.tagtype = 9
GROUP BY kt.fk_kid;

CREATE INDEX idx_author_kid ON author(fk_kid);
CREATE INDEX idx_creator_kid ON creator(fk_kid);
CREATE INDEX idx_gt_kid ON group_tags(fk_kid);
CREATE INDEX idx_language_kid ON language(fk_kid);
CREATE INDEX idx_misc_kid ON misc(fk_kid);
CREATE INDEX idx_series_i18n_sid ON series_i18n(fk_sid);
CREATE INDEX idx_singer_kid ON singer(fk_kid);
CREATE INDEX idx_songwriter_kid ON songwriter(fk_kid);
CREATE INDEX idx_songtype_kid ON songtype(fk_kid);

CREATE MATERIALIZED VIEW all_kara_series AS
SELECT
  k.pk_kid AS kid,
  jsonb_agg(DISTINCT(s.seriefile)) AS seriefiles,
  jsonb_agg(DISTINCT(s.name)) AS serie_orig,
  jsonb_agg(DISTINCT(s.pk_sid)) AS sid,
  string_agg(DISTINCT(s.name),',') AS serie,
  jsonb_agg(DISTINCT(s.aliases)) AS serie_altname,
  jsonb_agg(DISTINCT(s18.serie_langs)::jsonb) as serie_i18n,
  string_agg(DISTINCT(sl.name),' ') AS serie_names
FROM kara k
LEFT JOIN kara_serie ks ON k.pk_kid = ks.fk_kid
LEFT JOIN serie s ON ks.fk_sid = s.pk_sid
LEFT JOIN serie_lang sl ON sl.fk_sid = s.pk_sid
LEFT JOIN series_i18n s18 ON s18.fk_sid = ks.fk_sid
GROUP BY k.pk_kid;

CREATE UNIQUE INDEX idx_all_ks_kid ON all_kara_series(kid);

CREATE MATERIALIZED VIEW all_karas AS
SELECT
  k.pk_kid AS kid,
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
  aks.seriefiles AS seriefiles,
  aks.serie_altname AS serie_altname,
  aks.serie AS serie,
  aks.sid AS sid,
  singer.singers AS singers,
  aks.serie_names AS serie_names,
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
LEFT JOIN all_kara_series aks ON k.pk_kid = aks.kid
LEFT JOIN kara_tag kt ON k.pk_kid = kt.fk_kid
LEFT JOIN tag t ON kt.fk_id_tag = t.pk_id_tag
LEFT OUTER JOIN singer on k.pk_kid = singer.fk_kid
LEFT OUTER JOIN songtype on k.pk_kid = songtype.fk_kid
LEFT OUTER JOIN creator on k.pk_kid = creator.fk_kid
LEFT OUTER JOIN language on k.pk_kid = language.fk_kid
LEFT OUTER JOIN author on k.pk_kid = author.fk_kid
LEFT OUTER JOIN misc on k.pk_kid = misc.fk_kid
LEFT OUTER JOIN songwriter on k.pk_kid = songwriter.fk_kid
LEFT OUTER JOIN group_tags on k.pk_kid = group_tags.fk_kid
GROUP BY k.pk_kid, languages_sortable, songtypes_sortable, singers_sortable, singers, songtypes, groups, songwriters, misc_tags, authors, languages, creators, aks.seriefiles, aks.serie_orig, aks.serie_altname, aks.serie, aks.serie_names, aks.sid
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


CREATE MATERIALIZED VIEW all_tags AS
SELECT
	pk_id_tag AS tag_id,
	tagtype,
	name,
	slug,
	i18n,
	COUNT(kt.*) AS karacount
FROM tag
LEFT JOIN kara_tag kt ON fk_id_tag = pk_id_tag
GROUP BY pk_id_tag
ORDER BY tagtype, name;

CREATE INDEX idx_at_tagid ON all_tags(tag_id);
CREATE INDEX idx_at_tagtype ON all_tags(tagtype);
CREATE INDEX idx_at_name ON all_tags(name);

CREATE MATERIALIZED VIEW all_years AS
SELECT DISTINCT
	k.year,
	COUNT(karas.pk_kid) AS karacount
FROM kara AS k
LEFT JOIN kara karas ON karas.pk_kid = k.pk_kid
GROUP BY k.year
ORDER BY year;

CREATE INDEX idx_ay_year ON all_years(year);


CREATE MATERIALIZED VIEW all_series AS
SELECT
	s.name AS name,
	s.aliases AS aliases,
	s.pk_sid AS sid,
	array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) as i18n,
	string_agg(sl.name, ' ') as search,
	series_aliases.list AS search_aliases,
	s.seriefile AS seriefile,
	(SELECT COUNT(ks.fk_kid) FROM kara_serie ks WHERE ks.fk_sid = s.pk_sid) AS karacount
	FROM serie s
	CROSS JOIN LATERAL (
		SELECT string_agg(series_aliases.elem::text, ' ') AS list
		FROM jsonb_array_elements_text(s.aliases) AS series_aliases(elem)
	) series_aliases
	LEFT JOIN serie_lang sl ON sl.fk_sid = s.pk_sid
	GROUP BY s.pk_sid, series_aliases.list
    ORDER BY name;

CREATE INDEX idx_as_name ON all_series(name);
CREATE INDEX idx_as_sid ON all_series(sid);
CREATE INDEX idx_as_search ON all_series(search);
CREATE INDEX idx_as_search_aliases ON all_series(search_aliases);

CREATE MATERIALIZED VIEW all_kara_serie_langs AS
	SELECT sl.name, sl.lang, ks.fk_kid AS kid
	FROM serie_lang sl
	INNER JOIN kara_serie ks ON sl.fk_sid = ks.fk_sid;

CREATE INDEX idx_akls_kid_lang ON all_kara_serie_langs(kid, lang);

