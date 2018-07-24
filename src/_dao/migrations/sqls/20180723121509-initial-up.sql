/* Replace with your SQL commands */

CREATE TABLE settings
(
    option character varying COLLATE pg_catalog."default" NOT NULL,
    value text COLLATE pg_catalog."default"
);

CREATE TABLE serie
(
    pk_id_serie smallserial NOT NULL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    aliases jsonb,
    CONSTRAINT serie_pkey PRIMARY KEY (pk_id_serie)
);

CREATE TABLE tag
(
	pk_id_tag serial NOT NULL,
	tagtype integer NOT NULL,
	name character varying COLLATE pg_catalog."default" NOT NULL,
	CONSTRAINT tag_pkey PRIMARY KEY (pk_id_tag)
);

CREATE TABLE serie_lang
(
	pk_id_serie_lang serial NOT NULL,
	fk_id_serie integer NOT NULL,
	lang character(3) NOT NULL,
	name character varying NOT NULL,
	CONSTRAINT serielang_pkey PRIMARY KEY (pk_id_serie_lang)
);

CREATE TABLE kara_serie
(
	fk_id_serie integer NOT NULL,
	fk_id_kara integer NOT NULL
);

CREATE TABLE kara_tag
(
	fk_id_tag integer NOT NULL,
	fk_id_kara integer NOT NULL
);

CREATE TABLE kara
(
	pk_id_kara serial NOT NULL,
	kid uuid NOT NULL,
	title character varying NOT NULL,
	year smallint,
	songorder smallint NULL,
	mediafile character varying NOT NULL,
	subfile character varying NOT NULL,
	karafile character varying NOT NULL,
	duration smallint DEFAULT(0),
	mediasize integer DEFAULT(0),
	gain real DEFAULT(0),
	created_at timestamp NOT NULL,
	modified_at timestamp NOT NULL,
	CONSTRAINT kara_pkey PRIMARY KEY (pk_id_kara)
);

CREATE INDEX index_serie_lang_fk_id_serie ON serie_lang (fk_id_serie);
CREATE INDEX index_kara_serie_fk_id_serie ON kara_serie (fk_id_serie);
CREATE INDEX index_kara_serie_fk_id_kara ON kara_serie (fk_id_kara);
CREATE INDEX index_kara_tag_fk_id_tag ON kara_tag (fk_id_tag);
CREATE INDEX index_kara_tag_fk_id_kara ON kara_tag (fk_id_kara);
