/* Replace with your SQL commands */

ALTER TABLE settings DROP CONSTRAINT settings_pkey;
ALTER TABLE played DROP CONSTRAINT played_pkey;
ALTER TABLE requested DROP CONSTRAINT requested_pkey;
ALTER TABLE favorite DROP CONSTRAINT favorite_pkey;
ALTER TABLE instance DROP CONSTRAINT instance_pkey, ALTER COLUMN pk_id_instance TYPE smallint;
ALTER TABLE short_url DROP CONSTRAINT short_url_pkey, ALTER COLUMN pk_id_shorturl TYPE smallint;

DROP INDEX index_kara_kid;
DROP INDEX index_serie_sid;

CREATE UNIQUE INDEX idx_kara_kid ON kara (kid);
CREATE UNIQUE INDEX idx_serie_sid ON serie (sid);