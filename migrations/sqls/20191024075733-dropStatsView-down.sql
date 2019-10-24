CREATE VIEW stats AS
SELECT
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[2]) AS singers,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[8]) AS songwriters,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[4]) AS creators,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[6]) AS authors,
(SELECT COUNT(pk_kid) FROM kara) AS karas,
(SELECT COUNT(tid) FROM all_tags WHERE types @> ARRAY[5] AND karacount > 0) AS languages,
(SELECT COUNT(pk_sid) FROM serie) AS series,
(SELECT SUM(mediasize) FROM kara) AS mediasize,
(SELECT SUM(duration) FROM kara) AS duration;