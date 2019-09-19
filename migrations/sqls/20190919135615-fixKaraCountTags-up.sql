DROP VIEW stats;
DROP MATERIALIZED VIEW all_tags;
CREATE MATERIALIZED VIEW all_tags AS
WITH t_count as (
    select a.fk_tid, json_agg(json_build_object('type', a.type, 'count', a.c)) AS count_per_type
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
    (SELECT count_per_type FROM t_count where t_count.fk_tid = t.pk_tid) AS karacount
    FROM tag t
    CROSS JOIN LATERAL (
        SELECT string_agg(tag_aliases.elem::text, ' ') AS list
        FROM jsonb_array_elements_text(t.aliases) AS tag_aliases(elem)
    ) tag_aliases
    GROUP BY t.pk_tid, tag_aliases.list
    ORDER BY name;

CREATE VIEW stats AS
SELECT
(SELECT COUNT(pk_tid) FROM tag WHERE types @> ARRAY[2]) AS singers,
(SELECT COUNT(pk_tid) FROM tag WHERE types @> ARRAY[8]) AS songwriters,
(SELECT COUNT(pk_tid) FROM tag WHERE types @> ARRAY[4]) AS creators,
(SELECT COUNT(pk_tid) FROM tag WHERE types @> ARRAY[6]) AS authors,
(SELECT COUNT(pk_kid) FROM kara) AS karas,
(SELECT COUNT(pk_tid) FROM tag WHERE types @> ARRAY[5]) AS languages,
(SELECT COUNT(pk_sid) FROM serie) AS series,
(SELECT SUM(mediasize) FROM kara) AS mediasize,
(SELECT SUM(duration) FROM kara) AS duration;
