DROP VIEW stats;
DROP MATERIALIZED VIEW all_tags;

CREATE MATERIALIZED VIEW all_tags AS
SELECT
	t.name AS name,
	t.types AS types,
	t.aliases AS aliases,
	t.i18n AS i18n,
	t.pk_tid AS tid,
	tag_aliases.list AS search_aliases,
	t.tagfile AS tagfile,
    t.short as short,
	COUNT(kt.fk_kid) AS karacount
	FROM tag t
	CROSS JOIN LATERAL (
		SELECT string_agg(tag_aliases.elem::text, ' ') AS list
		FROM jsonb_array_elements_text(t.aliases) AS tag_aliases(elem)
	) tag_aliases
	LEFT JOIN kara_tag kt ON kt.fk_tid = t.pk_tid
	GROUP BY t.pk_tid, tag_aliases.list
    ORDER BY name;

CREATE INDEX idx_at_name ON all_tags(name);
CREATE INDEX idx_at_tid ON all_tags(tid);
CREATE INDEX idx_at_search_aliases ON all_tags(search_aliases);

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
