ALTER TABLE kara_stats DROP CONSTRAINT IF EXISTS fk_kid;

ALTER TABLE kara_stats ADD CONSTRAINT kara_stats_fk_kid_fkey
 FOREIGN KEY (fk_kid) REFERENCES kara(pk_kid) ON UPDATE CASCADE ON DELETE CASCADE;
