CREATE TABLE suggestions
(
	pk_id_suggest serial NOT NULL,
	song character varying NOT NULL,
    language character varying,
    source character varying NOT NULL,
	likes bigint DEFAULT(0),
	created_at TIMESTAMPTZ NOT NULL,
	search_vector TSVECTOR,
	CONSTRAINT suggest_pkey PRIMARY KEY (pk_id_suggest)
);

CREATE INDEX idx_suggest_search_vector
    on suggestions using gin (search_vector);

CREATE UNIQUE INDEX idx_suggest_song ON suggestions(song, language);

UPDATE suggestions SET search_vector = to_tsvector('public.unaccent_conf', song) ||
	to_tsvector('public.unaccent_conf', language);
