ALTER TABLE serie ADD COLUMN repository CHARACTER VARYING;
UPDATE serie SET repository = 'kara.moe';
ALTER TABLE serie ALTER COLUMN repository SET NOT NULL;
ALTER TABLE tag ADD COLUMN repository CHARACTER VARYING;
UPDATE tag SET repository = 'kara.moe';
ALTER TABLE tag ALTER COLUMN repository SET NOT NULL;

DROP MATERIALIZED VIEW all_tags;

CREATE MATERIALIZED VIEW all_tags AS
WITH t_count as (
    select a.fk_tid, json_agg(json_build_object('type', a.type, 'count', a.c))::text AS count_per_type
    FROM (
        SELECT fk_tid, count(fk_kid) as c, type
        FROM kara_tag
        GROUP BY fk_tid, type) as a
    GROUP BY a.fk_tid
)
SELECT
    t.name AS name,
    t.types AS types,
    t.aliases AS aliases,
    t.i18n AS i18n,
    t.pk_tid AS tid,
    tag_aliases.list AS search_aliases,
    t.tagfile AS tagfile,
    t.short as short,
	t.repository AS repository,
    count_per_type::jsonb AS karacount
    FROM tag t
    CROSS JOIN LATERAL (
        SELECT string_agg(tag_aliases.elem::text, ' ') AS list
        FROM jsonb_array_elements_text(t.aliases) AS tag_aliases(elem)
    ) tag_aliases
    LEFT JOIN t_count on t.pk_tid = t_count.fk_tid
	GROUP BY t.pk_tid, tag_aliases.list, count_per_type
    ORDER BY name;

CREATE INDEX idx_at_name ON all_tags(name);
CREATE INDEX idx_at_tid ON all_tags(tid);
CREATE INDEX idx_at_search_aliases ON all_tags(search_aliases);

DROP MATERIALIZED VIEW all_series;
CREATE MATERIALIZED VIEW all_series AS
SELECT
	s.name AS name,
	s.aliases AS aliases,
	s.pk_sid AS sid,
	array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) as i18n,
	string_agg(sl.name, ' ') as search,
	series_aliases.list AS search_aliases,
	s.seriefile AS seriefile,
	(SELECT COUNT(ks.fk_kid) FROM kara_serie ks WHERE ks.fk_sid = s.pk_sid) AS karacount,
	s.repository AS repository
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

DROP MATERIALIZED VIEW all_karas;

ALTER TABLE kara RENAME COLUMN fk_repo_name TO repository;

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
  aks.serie_i18n AS serie_i18n,
  aks.serie AS serie,
  aks.sid AS sid,
  akt.tid AS tid,
  akt.tags AS tags,
  akt.aliases AS tag_aliases,
  akt.tagfiles AS tagfiles,
  COALESCE(lower(unaccent(aks.serie)), lower(unaccent(singers.singers_sortable))) AS serie_singer_sortable,
  singers.singers AS singers,
  aks.serie_names AS serie_names,
  akt.tags_searchable AS tag_names,
  singers.singers_sortable AS singers_sortable,
  songtypes.songtypes AS songtypes,
  songtypes.songtypes_sortable AS songtypes_sortable,
  creators.creators AS creators,
  languages.languages AS languages,
  languages.languages_sortable AS languages_sortable,
  authors.authors AS authors,
  misc.misc AS misc,
  songwriters.songwriters AS songwriters,
  groups.groups AS groups,
  families.families AS families,
  genres.genres AS genres,
  platforms.platforms AS platforms,
  origins.origins AS origins,
  k.repository AS repository
FROM kara k
LEFT JOIN all_kara_series aks ON k.pk_kid = aks.kid
LEFT JOIN all_kara_tag akt ON k.pk_kid = akt.kid
LEFT JOIN kara_tag kt ON k.pk_kid = kt.fk_kid
LEFT JOIN tag t ON kt.fk_tid = t.pk_tid
LEFT OUTER JOIN singers on k.pk_kid = singers.fk_kid
LEFT OUTER JOIN songtypes on k.pk_kid = songtypes.fk_kid
LEFT OUTER JOIN creators on k.pk_kid = creators.fk_kid
LEFT OUTER JOIN languages on k.pk_kid = languages.fk_kid
LEFT OUTER JOIN authors on k.pk_kid = authors.fk_kid
LEFT OUTER JOIN misc on k.pk_kid = misc.fk_kid
LEFT OUTER JOIN songwriters on k.pk_kid = songwriters.fk_kid
LEFT OUTER JOIN groups on k.pk_kid = groups.fk_kid
LEFT OUTER JOIN families on k.pk_kid = families.fk_kid
LEFT OUTER JOIN origins on k.pk_kid = origins.fk_kid
LEFT OUTER JOIN genres on k.pk_kid = genres.fk_kid
LEFT OUTER JOIN platforms on k.pk_kid = platforms.fk_kid
GROUP BY k.pk_kid, languages_sortable, songtypes_sortable, singers_sortable, singers, songtypes, groups, songwriters, misc, authors, languages, creators, platforms, genres, origins, families, aks.seriefiles, aks.serie_orig, aks.serie_i18n, aks.serie_altname, aks.serie, aks.serie_names, aks.sid, akt.tid, akt.tags, akt.aliases, akt.tags_searchable, akt.tagfiles
ORDER BY languages_sortable, serie_singer_sortable, songtypes_sortable DESC, songorder;
