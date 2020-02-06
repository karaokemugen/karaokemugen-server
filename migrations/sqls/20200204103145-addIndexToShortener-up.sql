TRUNCATE short_url;
CREATE UNIQUE INDEX idx_shortener_remoteIP ON short_url(remote_ip);
ALTER TABLE short_url DROP COLUMN pk_id_shorturl;
