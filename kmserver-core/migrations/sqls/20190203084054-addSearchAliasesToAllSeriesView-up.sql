/* Replace with your SQL commands */DROP MATERIALIZED VIEW all_series;

CREATE MATERIALIZED VIEW public.all_series
AS
 SELECT
    s.name,
    s.aliases,
    s.pk_sid AS sid,
    array_to_json(array_agg(json_build_object('lang', sl.lang, 'name', sl.name))) AS i18n,
    string_agg(sl.name::text, ' '::text) AS search,
	a.list AS search_aliases,
    s.seriefile,
    ( SELECT count(ks.fk_kid) AS count
           FROM kara_serie ks
          WHERE ks.fk_sid = s.pk_sid) AS karacount
   FROM serie s
   	CROSS JOIN LATERAL (
        SELECT string_agg(a.elem::text, ' ') AS list
        FROM jsonb_array_elements_text(s.aliases) AS a(elem)
    ) a
     LEFT JOIN serie_lang sl ON sl.fk_sid = s.pk_sid
  GROUP BY s.pk_sid, a.list
  ORDER BY s.name
WITH DATA;

CREATE INDEX idx_as_search ON all_series(search);
CREATE INDEX idx_as_search_aliases ON all_series(search_aliases);
CREATE INDEX idx_as_name
    ON public.all_series USING btree
    (name COLLATE pg_catalog."default");
CREATE INDEX idx_as_sid
    ON public.all_series USING btree
    (sid);
