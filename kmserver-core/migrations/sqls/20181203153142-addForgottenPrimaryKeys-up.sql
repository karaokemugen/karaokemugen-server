/* Replace with your SQL commands */

ALTER TABLE settings ADD PRIMARY KEY (option);
ALTER TABLE played ADD PRIMARY KEY (pk_id_played);
ALTER TABLE requested ADD PRIMARY KEY (pk_id_requested);
ALTER TABLE favorite ADD PRIMARY KEY (pk_id_favorite);
ALTER TABLE instance ADD PRIMARY KEY (pk_id_instance), ALTER COLUMN pk_id_instance TYPE integer;
ALTER TABLE short_url ADD PRIMARY KEY (pk_id_shorturl), ALTER COLUMN pk_id_shorturl TYPE integer;

DROP INDEX idx_kara_kid;
DROP INDEX idx_serie_sid;

CREATE UNIQUE INDEX index_kara_kid ON kara (kid);
CREATE UNIQUE INDEX index_serie_sid ON serie (sid);