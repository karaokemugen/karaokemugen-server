ALTER TABLE kara_stats DROP CONSTRAINT kara_stats_fk_kid_fkey;

ALTER TABLE kara_stats ADD CONSTRAINT fk_kid
 FOREIGN KEY (fk_kid) REFERENCES kara(pk_kid);