DROP MATERIALIZED VIEW all_tags;
DROP MATERIALIZED VIEW all_karas;
DROP MATERIALIZED VIEW all_kara_tag;

CREATE MATERIALIZED VIEW all_kara_tag AS
SELECT k.pk_kid                                                  AS kid,
       jsonb_agg(DISTINCT t.tagfile)                             AS tagfiles,
       jsonb_agg(DISTINCT (t.pk_tid || '~'::text) || kt.type)    AS tid,
       lower(unaccent(btrim(regexp_replace(jsonb_agg(t.aliases)::character varying::text, '[\]\,\[\"]'::text, ''::text,
                                        'g'::text))))            AS aliases,
       lower(unaccent(regexp_replace(
               regexp_replace(jsonb_agg(DISTINCT t.i18n)::text, '".+?": "(.+?)"'::text, '\1'::text, 'g'::text),
               '[\[\{\}\],]'::text, ''::text, 'g'::text)))           AS i18n,
       lower(unaccent(string_agg(DISTINCT t.name::text, ' '::text))) AS tags
FROM kara k
         LEFT JOIN kara_tag kt on k.pk_kid = kt.fk_kid
         LEFT JOIN tag t on kt.fk_tid = t.pk_tid
GROUP BY k.pk_kid;

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
    t.problematic AS problematic,
    t.noLiveDownload AS noLiveDownload,
    tag_aliases.list AS search_aliases,
    t.tagfile AS tagfile,
    t.short as short,
    t.repository AS repository,
    t.modified_at AS modified_at,
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
    k.subchecksum,
    akt.tid AS tid,
    akt.tagfiles AS tagfiles,
    akt.tags AS tags_searchable,
    akt.i18n AS tags_i18n_searchable,
    akt.aliases AS tags_aliases_searchable,
    singers.singers AS singers,
    series.series AS series,
    COALESCE(lower(unaccent(series.series_sortable)), lower(unaccent(singers.singers_sortable))) AS serie_singer_sortable,
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
         LEFT OUTER JOIN series on k.pk_kid = series.fk_kid
GROUP BY k.pk_kid, languages_sortable, serie_singer_sortable, songtypes_sortable, singers, songtypes, groups, songwriters, misc, authors, languages, creators, platforms, genres, origins, families, series, akt.tid, akt.aliases, akt.tags, akt.i18n, akt.tagfiles
ORDER BY languages_sortable, serie_singer_sortable, songtypes_sortable DESC, songorder;

CREATE INDEX idx_ak_tags ON all_karas(tags_searchable);
CREATE INDEX idx_ak_tags_i18n ON all_karas(tags_i18n_searchable);
CREATE INDEX idx_ak_tags_aliases ON all_karas(tags_aliases_searchable);
CREATE INDEX idx_ak_created ON all_karas(created_at DESC);
CREATE INDEX idx_ak_serie ON all_karas(series NULLS LAST);
CREATE INDEX idx_ak_songtypes ON all_karas(songtypes_sortable DESC);
CREATE INDEX idx_ak_songorder ON all_karas(songorder);
CREATE INDEX idx_ak_title ON all_karas(title);
CREATE INDEX idx_ak_series_singers ON all_karas(serie_singer_sortable);
CREATE INDEX idx_ak_language ON all_karas(languages_sortable);
CREATE INDEX idx_ak_year ON all_karas(year);
CREATE INDEX idx_ak_kid ON all_karas(kid);
