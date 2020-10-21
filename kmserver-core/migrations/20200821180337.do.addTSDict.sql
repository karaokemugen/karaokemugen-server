drop materialized view all_karas;
drop materialized view all_kara_tag;
drop materialized view all_tags;

create text search configuration unaccent_conf ( COPY = simple );
alter text search configuration unaccent_conf
    alter mapping for hword, hword_part, word
        with unaccent, simple;

create materialized view all_kara_tag as
SELECT k.pk_kid                                                  AS kid,
       jsonb_agg(DISTINCT t.tagfile)                             AS tagfiles,
       jsonb_agg(DISTINCT (t.pk_tid || '~'::text) || kt.type)    AS tid,
       to_tsvector('public.unaccent_conf', btrim(regexp_replace(jsonb_agg(t.aliases)::character varying::text, '[\]\,\[\"]'::text, ''::text,
                                        'g'::text)))             AS aliases,
       to_tsvector('public.unaccent_conf', regexp_replace(
               regexp_replace(jsonb_agg(DISTINCT t.i18n)::text, '".+?": "(.+?)"'::text, '\1'::text, 'g'::text),
               '[\[\{\}\],]'::text, ''::text, 'g'::text))        AS i18n,
       to_tsvector('public.unaccent_conf', string_agg(DISTINCT t.name::text, ' '::text)) AS tags
FROM kara k
         LEFT JOIN kara_tag kt on k.pk_kid = kt.fk_kid
         LEFT JOIN tag t on kt.fk_tid = t.pk_tid
GROUP BY k.pk_kid;

create materialized view all_tags as
WITH t_count AS (
    SELECT a.fk_tid,
           json_agg(json_build_object('type', a.type, 'count', a.c))::text AS count_per_type
    FROM (SELECT kara_tag.fk_tid,
                 count(kara_tag.fk_kid) AS c,
                 kara_tag.type
          FROM kara_tag
          GROUP BY kara_tag.fk_tid, kara_tag.type) a
    GROUP BY a.fk_tid
)
SELECT t.name,
       t.types,
       t.aliases,
       t.i18n,
       t.pk_tid            AS tid,
       t.problematic       AS problematic,
       t.noLiveDownload    AS noLiveDownload,
       ((case
           when tag_aliases.list is null
               then to_tsvector('public.unaccent_conf', '')
               else to_tsvector('public.unaccent_conf', tag_aliases.list)
           end) || to_tsvector('public.unaccent_conf', t.i18n))
           || to_tsvector('public.unaccent_conf', t.name)
           AS search_vector,
       t.tagfile,
       t.short,
       t.repository,
       t.modified_at,
       t_count.count_per_type::jsonb AS karacount
FROM tag t
         CROSS JOIN LATERAL ( SELECT string_agg(tag_aliases_1.elem, ' '::text) AS list
                              FROM jsonb_array_elements_text(t.aliases) tag_aliases_1(elem)) tag_aliases
         LEFT JOIN t_count on t.pk_tid = t_count.fk_tid
GROUP BY t.pk_tid, tag_aliases.list, t_count.count_per_type, t.name
ORDER BY t.name;

create index idx_at_name
    on all_tags (name);

create index idx_at_tid
    on all_tags (tid);

create index idx_at_search_vector
    on all_tags using gin (search_vector);

create materialized view all_karas as
SELECT k.pk_kid AS kid,
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
       akt.tid,
       akt.tagfiles,
       ((akt.tags || akt.i18n) || akt.aliases) || to_tsvector('public.unaccent_conf', k.title::text) AS search_vector,
       singers.singers,
       series.series,
       COALESCE(lower(unaccent(series.series_sortable)),
                lower(unaccent(singers.singers_sortable)))                   AS serie_singer_sortable,
       songtypes.songtypes,
       songtypes.songtypes_sortable,
       creators.creators,
       languages.languages,
       languages.languages_sortable,
       authors.authors,
       misc.misc,
       songwriters.songwriters,
       groups.groups,
       families.families,
       genres.genres,
       platforms.platforms,
       origins.origins,
       k.repository
FROM kara k
         LEFT JOIN all_kara_tag akt on k.pk_kid = akt.kid
         LEFT JOIN kara_tag kt on k.pk_kid = kt.fk_kid
         LEFT JOIN tag t on kt.fk_tid = t.pk_tid
         LEFT JOIN singers on k.pk_kid = singers.fk_kid
         LEFT JOIN songtypes on k.pk_kid = songtypes.fk_kid
         LEFT JOIN creators on k.pk_kid = creators.fk_kid
         LEFT JOIN languages on k.pk_kid = languages.fk_kid
         LEFT JOIN authors on k.pk_kid = authors.fk_kid
         LEFT JOIN misc on k.pk_kid = misc.fk_kid
         LEFT JOIN songwriters on k.pk_kid = songwriters.fk_kid
         LEFT JOIN groups on k.pk_kid = groups.fk_kid
         LEFT JOIN families on k.pk_kid = families.fk_kid
         LEFT JOIN origins on k.pk_kid = origins.fk_kid
         LEFT JOIN genres on k.pk_kid = genres.fk_kid
         LEFT JOIN platforms on k.pk_kid = platforms.fk_kid
         LEFT JOIN series on k.pk_kid = series.fk_kid
GROUP BY k.pk_kid, languages.languages_sortable,
         (COALESCE(lower(unaccent(series.series_sortable)), lower(unaccent(singers.singers_sortable)))),
         songtypes.songtypes_sortable, singers.singers, songtypes.songtypes, groups.groups, songwriters.songwriters,
         misc.misc, authors.authors, languages.languages, creators.creators, platforms.platforms, genres.genres,
         origins.origins, families.families, series.series, akt.tid, akt.aliases, akt.tags, akt.i18n, akt.tagfiles
ORDER BY languages.languages_sortable,
         (COALESCE(lower(unaccent(series.series_sortable)), lower(unaccent(singers.singers_sortable)))),
         songtypes.songtypes_sortable DESC, k.songorder;

create index idx_ak_search_vector
    on all_karas using gin (search_vector);
create index idx_ak_created 
    on all_karas(created_at DESC);
create index idx_ak_serie
    on all_karas(series NULLS LAST);
create index idx_ak_songtypes
    on all_karas(songtypes_sortable DESC);
create index idx_ak_songorder
    on all_karas(songorder);
create index idx_ak_title
    on all_karas(title);
create index idx_ak_series_singers
    on all_karas(serie_singer_sortable);
create index idx_ak_language
    on all_karas(languages_sortable);
create index idx_ak_year
    on all_karas(year);
create index idx_ak_kid
    on all_karas(kid);
