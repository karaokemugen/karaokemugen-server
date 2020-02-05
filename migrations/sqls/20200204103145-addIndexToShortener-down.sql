TRUNCATE short_url;
DROP INDEX idx_shortener_remoteIP;
ALTER TABLE short_url ADD COLUMN pk_id_shorturl smallserial NOT NULL;
