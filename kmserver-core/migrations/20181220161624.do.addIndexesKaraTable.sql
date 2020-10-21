/* Replace with your SQL commands */

CREATE INDEX idx_kara_created ON kara(created_at DESC);
CREATE INDEX idx_serie_name ON serie(name);
CREATE INDEX idx_kara_songorder ON kara(songorder);
CREATE INDEX idx_kara_title ON kara(title);