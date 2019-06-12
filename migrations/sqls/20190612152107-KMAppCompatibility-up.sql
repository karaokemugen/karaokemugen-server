DROP MATERIALIZED VIEW all_karas;
ALTER TABLE serie_lang ALTER COLUMN fk_sid SET NOT NULL;
ALTER TABLE kara ALTER COLUMN subfile DROP NOT NULL;
ALTER TABLE kara ALTER COLUMN created_at TYPE TIMESTAMPTZ;
ALTER TABLE kara ALTER COLUMN modified_at TYPE TIMESTAMPTZ;
ALTER TABLE kara ADD COLUMN fk_repo_name character varying;
UPDATE kara SET fk_repo_name = 'kara.moe';
ALTER TABLE kara ALTER COLUMN fk_repo_name SET NOT NULL;
ALTER TABLE favorites RENAME TO stats_favorites;
ALTER TABLE played RENAME TO stats_played;
ALTER TABLE requested RENAME TO stats_requested;
CREATE VIEW stats AS
 SELECT ( SELECT count(tag.pk_id_tag) AS count
           FROM tag
          WHERE (tag.tagtype = 2)) AS singers,
    ( SELECT count(tag.pk_id_tag) AS count
           FROM tag
          WHERE (tag.tagtype = 8)) AS songwriters,
    ( SELECT count(tag.pk_id_tag) AS count
           FROM tag
          WHERE (tag.tagtype = 4)) AS creators,
    ( SELECT count(tag.pk_id_tag) AS count
           FROM tag
          WHERE (tag.tagtype = 6)) AS authors,
    ( SELECT count(kara.pk_kid) AS count
           FROM kara) AS karas,
    ( SELECT count(tag.pk_id_tag) AS count
           FROM tag
          WHERE (tag.tagtype = 5)) AS languages,
    ( SELECT count(serie.pk_sid) AS count
           FROM serie) AS series,
    ( SELECT sum(kara.duration) FROM kara) AS sum;
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
  string_agg(DISTINCT(t.name),' ') AS tags,
  k.fk_repo_name AS repo
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