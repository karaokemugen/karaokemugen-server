DROP TABLE IF EXISTS all_karas;
CREATE TABLE all_karas AS
SELECT k.*,
	array_remove(array_agg(DISTINCT tserie.external_database_ids->>'anilist'), NULL) AS anilist_ids,
	array_remove(array_agg(DISTINCT tserie.external_database_ids->>'myanimelist'), NULL) AS myanimelist_ids,
	array_remove(array_agg(DISTINCT tserie.external_database_ids->>'kitsu'), NULL) AS kitsu_ids,
	CASE WHEN MIN(kt.pk_tid::text) IS NULL 
		THEN null 
		ELSE jsonb_agg(DISTINCT json_build_object(
			'tid', kt.pk_tid,
			'short', kt.short,
			'name', kt.name,
			'aliases', kt.aliases,
			'i18n', kt.i18n,
			'priority', kt.priority,
			'type_in_kara', ka.type,
			'karafile_tag', kt.karafile_tag,
			'repository', kt.repository,
			'description', kt.description,
			'external_database_ids', kt.external_database_ids,
			'noLiveDownload', kt.nolivedownload
		)::jsonb) 
	END as tags,
	tsvector_agg(
		kt.tag_search_vector
		) || 
		k.title_search_vector ||
		to_tsvector(CASE WHEN k.songorder IS NOT NULL 
			THEN k.songorder::text 
			ELSE ''
		END) ||
		to_tsvector(CASE WHEN k.songorder IS NOT NULL 
			THEN string_agg(DISTINCT tsongtype.name || k.songorder, ' ') 
			ELSE ' '
		END)
	AS search_vector,
    to_tsvector('') AS search_vector_parents,
	CASE WHEN MIN(kt.pk_tid::text) IS NULL 
	 	THEN ARRAY[]::text[] 
		ELSE array_agg(DISTINCT kt.pk_tid::text || '~' || ka.type::text) 
	END AS tid,
	CASE WHEN MIN(kt.external_database_ids::text) IS NULL 
		THEN NULL 
		ELSE jsonb_agg(DISTINCT kt.external_database_ids) 
	END AS external_database_ids
FROM kara k

LEFT JOIN kara_tag ka on k.pk_kid = ka.fk_kid
LEFT JOIN tag kt on ka.fk_tid = kt.pk_tid

LEFT JOIN kara_tag ks on k.pk_kid = ks.fk_kid and ks.type = 1
LEFT JOIN tag tserie on ks.fk_tid = tserie.pk_tid

LEFT JOIN kara_tag ks2 on k.pk_kid = ks2.fk_kid and ks2.type = 3
LEFT JOIN tag tsongtype on ks2.fk_tid = tsongtype.pk_tid

GROUP BY k.pk_kid