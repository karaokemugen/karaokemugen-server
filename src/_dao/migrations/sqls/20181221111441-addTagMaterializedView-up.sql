
CREATE MATERIALIZED VIEW all_tags AS
SELECT pk_id_tag AS tag_id, tagtype, name, slug,
 (SELECT COUNT(fk_id_kara) FROM kara_tag WHERE fk_id_tag = pk_id_tag) AS karacount
FROM tag
ORDER BY tagtype, name;

CREATE INDEX idx_at_tagid ON all_tags(tag_id);
CREATE INDEX idx_at_tagtype ON all_tags(tagtype);
CREATE INDEX idx_at_name ON all_tags(name);
