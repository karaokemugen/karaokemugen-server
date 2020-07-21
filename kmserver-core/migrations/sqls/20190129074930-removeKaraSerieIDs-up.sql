DROP VIEW stats;
DROP MATERIALIZED VIEW all_karas;
DROP MATERIALIZED VIEW all_tags;
DROP MATERIALIZED VIEW all_series;
DROP MATERIALIZED VIEW all_years;

DROP INDEX idx_favorite_instanceid_kid;

ALTER TABLE favorite RENAME TO favorites;
ALTER TABLE favorites DROP CONSTRAINT favorite_pkey;
ALTER TABLE favorites DROP COLUMN pk_id_favorite;
ALTER TABLE favorites ADD COLUMN fk_iid UUID;
UPDATE favorites
	SET fk_iid = (SELECT i.instance_id FROM instance i WHERE i.pk_id_instance = fk_id_instance);
ALTER TABLE favorites ALTER COLUMN fk_iid SET NOT NULL;
ALTER TABLE favorites RENAME kid TO fk_kid;
ALTER TABLE favorites ADD CONSTRAINT favorites_instance_id FOREIGN KEY (fk_iid) REFERENCES instance(instance_id) ON DELETE CASCADE;
CREATE UNIQUE INDEX idx_favorite_iid_kid
    ON public.favorites USING btree
    (fk_iid, fk_kid);

ALTER TABLE played ADD COLUMN fk_iid UUID;
UPDATE played
	SET fk_iid = (SELECT i.instance_id FROM instance i WHERE i.pk_id_instance = fk_id_instance);
ALTER TABLE played ALTER COLUMN fk_iid SET NOT NULL;
ALTER TABLE played DROP CONSTRAINT played_pkey;
ALTER TABLE played DROP COLUMN fk_id_instance;
ALTER TABLE played ADD CONSTRAINT played_instance_id FOREIGN KEY (fk_iid) REFERENCES instance(instance_id) ON DELETE CASCADE;
ALTER TABLE played RENAME kid TO fk_kid;
CREATE UNIQUE INDEX idx_played_iid_startedat_kid_playedat
    ON played
    (fk_iid, session_started_at, fk_kid, played_at);

ALTER TABLE requested ADD COLUMN fk_iid UUID;
UPDATE requested
	SET fk_iid = (SELECT i.instance_id FROM instance i WHERE i.pk_id_instance = fk_id_instance);
ALTER TABLE requested ALTER COLUMN fk_iid SET NOT NULL;
ALTER TABLE requested DROP CONSTRAINT requested_pkey;
ALTER TABLE requested DROP COLUMN fk_id_instance;
ALTER TABLE requested ADD CONSTRAINT requested_instance_id FOREIGN KEY (fk_iid) REFERENCES instance(instance_id) ON DELETE CASCADE;
ALTER TABLE requested RENAME kid TO fk_kid;
CREATE UNIQUE INDEX idx_requested_iid_startedat_kid_playedat
    ON requested
    (fk_iid, session_started_at, fk_kid, requested_at);

ALTER TABLE instance DROP CONSTRAINT instance_pkey;
ALTER TABLE instance DROP COLUMN pk_id_instance;
ALTER TABLE instance ADD PRIMARY KEY (instance_id);
ALTER TABLE instance RENAME COLUMN instance_id TO pk_iid;

ALTER TABLE kara_serie ADD COLUMN fk_sid UUID;
ALTER TABLE kara_serie ADD COLUMN fk_kid UUID;
UPDATE kara_serie
	SET fk_sid = (SELECT s.sid FROM serie s WHERE s.pk_id_serie = fk_id_serie);
UPDATE kara_serie
	SET fk_kid = (SELECT k.kid FROM kara k WHERE k.pk_id_kara = fk_id_kara);
ALTER TABLE kara_serie ALTER COLUMN fk_sid SET NOT NULL;
ALTER TABLE kara_serie ALTER COLUMN fk_kid SET NOT NULL;
ALTER TABLE kara_serie DROP COLUMN fk_id_serie;
ALTER TABLE kara_serie DROP COLUMN fk_id_kara;

DROP INDEX index_kara_tag_fk_id_kara;
ALTER TABLE kara_tag ADD COLUMN fk_kid UUID;
UPDATE kara_tag
	SET fk_kid = (SELECT k.kid FROM kara k WHERE k.pk_id_kara = fk_id_kara);
ALTER TABLE kara_tag ALTER COLUMN fk_kid SET NOT NULL;
ALTER TABLE kara_tag DROP COLUMN fk_id_kara;

DROP INDEX index_serie_lang_fk_id_serie;
ALTER TABLE serie_lang ADD COLUMN fk_sid UUID;
UPDATE serie_lang
	SET fk_sid = (SELECT s.sid FROM serie s WHERE s.pk_id_serie = fk_id_serie);
ALTER TABLE serie_lang DROP COLUMN fk_id_serie;
CREATE INDEX idx_serie_lang_fk_sid
    ON serie_lang
    (fk_sid);

DROP INDEX index_usersfavorites_userid_kid;
ALTER TABLE users_favorites ADD COLUMN fk_login CHARACTER VARYING;
ALTER TABLE users_favorites RENAME kid TO fk_kid;
UPDATE users_favorites
	SET fk_login = (SELECT u.login FROM users u WHERE u.pk_id_user = fk_id_user);
ALTER TABLE users_favorites DROP COLUMN fk_id_user;
ALTER TABLE users_favorites ALTER COLUMN fk_login SET NOT NULL;
ALTER TABLE users_favorites ADD CONSTRAINT usersfavorites_login FOREIGN KEY (fk_login) REFERENCES users(login) ON DELETE CASCADE;
CREATE UNIQUE INDEX index_usersfavorites_login_kid
    ON users_favorites
    (fk_login, fk_kid);

ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users DROP COLUMN pk_id_user;
ALTER TABLE users RENAME login TO pk_login;
ALTER TABLE users ADD PRIMARY KEY (pk_login);

ALTER TABLE kara DROP CONSTRAINT kara_pkey;
ALTER TABLE kara DROP COLUMN pk_id_kara;
ALTER TABLE kara RENAME kid TO pk_kid;
ALTER TABLE kara ADD PRIMARY KEY (pk_kid);

DROP INDEX index_serie_sid;
ALTER TABLE serie DROP CONSTRAINT serie_pkey;
ALTER TABLE serie DROP COLUMN pk_id_serie;
ALTER TABLE serie ALTER COLUMN sid SET NOT NULL;
ALTER TABLE serie RENAME sid TO pk_sid;
ALTER TABLE serie ADD PRIMARY KEY (pk_sid);

CREATE MATERIALIZED VIEW public.all_years
AS
 SELECT DISTINCT k.year,
    (( SELECT count(kara.pk_kid) AS count
           FROM kara
          WHERE kara.year = k.year))::integer AS karacount
   FROM kara k
  ORDER BY k.year
WITH DATA;

CREATE INDEX idx_ay_year
    ON public.all_years USING btree
    (year);

CREATE MATERIALIZED VIEW public.all_tags
TABLESPACE pg_default
AS
 SELECT tag.pk_id_tag AS tag_id,
    tag.tagtype,
    tag.name,
    tag.slug,
    ( SELECT count(kara_tag.fk_kid) AS count
           FROM kara_tag
          WHERE kara_tag.fk_id_tag = tag.pk_id_tag) AS karacount
   FROM tag
  ORDER BY tag.tagtype, tag.name
WITH DATA;

CREATE INDEX idx_at_name
    ON public.all_tags USING btree
    (name COLLATE pg_catalog."default");
CREATE INDEX idx_at_tagid
    ON public.all_tags USING btree
    (tag_id);
CREATE INDEX idx_at_tagtype
    ON public.all_tags USING btree
    (tagtype);


CREATE MATERIALIZED VIEW public.all_series
AS
 SELECT
    s.name,
    s.aliases,
    s.pk_sid AS sid,
    array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) AS i18n,
    string_agg(sl.name::text, ' '::text) AS search,
    s.seriefile,
    ( SELECT count(ks.fk_kid) AS count
           FROM kara_serie ks
          WHERE ks.fk_sid = s.pk_sid) AS karacount
   FROM serie s
     LEFT JOIN serie_lang sl ON sl.fk_sid = s.pk_sid
  GROUP BY s.pk_sid
  ORDER BY s.name
WITH DATA;


CREATE INDEX idx_as_name
    ON public.all_series USING btree
    (name COLLATE pg_catalog."default");
CREATE INDEX idx_as_sid
    ON public.all_series USING btree
    (sid);

CREATE MATERIALIZED VIEW public.all_karas
TABLESPACE pg_default
AS
 WITH series_i18n(sid, serie_langs) AS (
         SELECT sl.fk_sid,
            array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) AS array_to_json
           FROM serie_lang sl
          GROUP BY sl.fk_sid
        ), singer AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_singer.*)) AS singers,
            string_agg(t_singer.name::text, ', '::text ORDER BY t_singer.name) AS singers_sortable
           FROM kara_tag kt_1
             JOIN tag t_singer ON kt_1.fk_id_tag = t_singer.pk_id_tag AND t_singer.tagtype = 2
          GROUP BY kt_1.fk_kid
        ), songtype AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_songtype.*)) AS songtypes,
            string_agg(t_songtype.name::text, ', '::text ORDER BY t_songtype.name) AS songtypes_sortable
           FROM kara_tag kt_1
             JOIN tag t_songtype ON kt_1.fk_id_tag = t_songtype.pk_id_tag AND t_songtype.tagtype = 3
          GROUP BY kt_1.fk_kid
        ), creator AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_creator.*)) AS creators
           FROM kara_tag kt_1
             JOIN tag t_creator ON kt_1.fk_id_tag = t_creator.pk_id_tag AND t_creator.tagtype = 4
          GROUP BY kt_1.fk_kid
        ), language AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_language.*)) AS languages,
            string_agg(t_language.name::text, ', '::text ORDER BY t_language.name) AS languages_sortable
           FROM kara_tag kt_1
             JOIN tag t_language ON kt_1.fk_id_tag = t_language.pk_id_tag AND t_language.tagtype = 5
          GROUP BY kt_1.fk_kid
        ), author AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_author.*)) AS authors
           FROM kara_tag kt_1
             JOIN tag t_author ON kt_1.fk_id_tag = t_author.pk_id_tag AND t_author.tagtype = 6
          GROUP BY kt_1.fk_kid
        ), misc AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_misc.*)) AS misc_tags
           FROM kara_tag kt_1
             JOIN tag t_misc ON kt_1.fk_id_tag = t_misc.pk_id_tag AND t_misc.tagtype = 7
          GROUP BY kt_1.fk_kid
        ), songwriter AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_songwriter.*)) AS songwriters
           FROM kara_tag kt_1
             JOIN tag t_songwriter ON kt_1.fk_id_tag = t_songwriter.pk_id_tag AND t_songwriter.tagtype = 8
          GROUP BY kt_1.fk_kid
        ), group_tags AS (
         SELECT kt_1.fk_kid,
            jsonb_agg(to_jsonb(t_group.*)) AS groups
           FROM kara_tag kt_1
             JOIN tag t_group ON kt_1.fk_id_tag = t_group.pk_id_tag AND t_group.tagtype = 9
          GROUP BY kt_1.fk_kid
        )
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
    jsonb_agg(DISTINCT s.seriefile) AS seriefiles,
    jsonb_agg(DISTINCT s.pk_sid) AS sid,
    jsonb_agg(DISTINCT s18.serie_langs::jsonb) AS serie_i18n,
    string_agg(DISTINCT s.name::text, ','::text) AS serie,
    jsonb_agg(DISTINCT s.aliases) AS serie_altname,
    singer.singers,
    singer.singers_sortable,
    songtype.songtypes,
    songtype.songtypes_sortable,
    creator.creators,
    language.languages,
    language.languages_sortable,
    author.authors,
    misc.misc_tags,
    songwriter.songwriters,
    group_tags.groups,
    array_agg(DISTINCT kt.fk_id_tag) AS all_tags_id,
    string_agg(DISTINCT t.name::text, ' '::text) AS tags
   FROM kara k
     LEFT JOIN kara_serie ks ON k.pk_kid = ks.fk_kid
     LEFT JOIN serie s ON ks.fk_sid = s.pk_sid
     LEFT JOIN series_i18n s18 ON s18.sid = ks.fk_sid
     LEFT JOIN kara_tag kt ON k.pk_kid = kt.fk_kid
     LEFT JOIN tag t ON kt.fk_id_tag = t.pk_id_tag
     LEFT JOIN singer ON k.pk_kid = singer.fk_kid
     LEFT JOIN songtype ON k.pk_kid = songtype.fk_kid
     LEFT JOIN creator ON k.pk_kid = creator.fk_kid
     LEFT JOIN language ON k.pk_kid = language.fk_kid
     LEFT JOIN author ON k.pk_kid = author.fk_kid
     LEFT JOIN misc ON k.pk_kid = misc.fk_kid
     LEFT JOIN songwriter ON k.pk_kid = songwriter.fk_kid
     LEFT JOIN group_tags ON k.pk_kid = group_tags.fk_kid
  GROUP BY k.pk_kid, language.languages_sortable, songtype.songtypes_sortable, singer.singers_sortable, singer.singers, songtype.songtypes, group_tags.groups, songwriter.songwriters, misc.misc_tags, author.authors, language.languages, creator.creators
  ORDER BY language.languages_sortable, (string_agg(DISTINCT s.name::text, ','::text)), singer.singers_sortable, songtype.songtypes_sortable DESC, k.songorder
WITH DATA;

CREATE INDEX idx_ak_created
    ON public.all_karas USING btree
    (created_at DESC);
CREATE INDEX idx_ak_kid
    ON public.all_karas USING btree
    (kid);
CREATE INDEX idx_ak_language
    ON public.all_karas USING btree
    (languages_sortable COLLATE pg_catalog."default");
CREATE INDEX idx_ak_serie
    ON public.all_karas USING btree
    (serie COLLATE pg_catalog."default");
CREATE INDEX idx_ak_singer
    ON public.all_karas USING btree
    (singers_sortable COLLATE pg_catalog."default");
CREATE INDEX idx_ak_songorder
    ON public.all_karas USING btree
    (songorder);
CREATE INDEX idx_ak_songtypes
    ON public.all_karas USING btree
    (songtypes_sortable COLLATE pg_catalog."default" DESC);
CREATE INDEX idx_ak_tags
    ON public.all_karas USING btree
    (tags COLLATE pg_catalog."default");
CREATE INDEX idx_ak_title
    ON public.all_karas USING btree
    (title COLLATE pg_catalog."default");
CREATE INDEX idx_ak_year
    ON public.all_karas USING btree
    (year);

