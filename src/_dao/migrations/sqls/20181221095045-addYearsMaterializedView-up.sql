CREATE MATERIALIZED VIEW all_years AS
SELECT DISTINCT k.year,
	(SELECT COUNT(pk_id_kara) FROM kara WHERE year = k.year)::integer AS karacount
FROM kara AS k
ORDER BY year;

CREATE INDEX idx_ay_year ON all_years(year);