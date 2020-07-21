CREATE VIEW stats AS
SELECT
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=2) AS singers,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=8) AS songwriters,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=4) AS creators,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=6) AS authors,
(SELECT COUNT(pk_id_kara) FROM kara) AS karas,
(SELECT COUNT(pk_id_tag) FROM tag WHERE tagtype=5) AS languages,
(SELECT COUNT(pk_id_serie) FROM serie) AS series,
(SELECT SUM(duration) FROM kara) AS duration;