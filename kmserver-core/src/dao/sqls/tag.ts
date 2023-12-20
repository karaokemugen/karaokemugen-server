// Tags SQL

export const selectTags = (filterClauses: string[], limitClause: string, offsetClause: string, joinClauses: string, orderClauses: string, stripClause: string, additionalFrom: string[], collectionClauses: string[], whereClause: string) => `
WITH kara_available AS (
	SELECT ak.pk_kid
	FROM all_karas ak
	LEFT JOIN all_kara_tag akt ON ak.pk_kid = akt.fk_kid
	WHERE TRUE
	${collectionClauses.length > 0 ? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})` : ''}
),
t_count AS (
	SELECT a.fk_tid,
		json_agg(json_build_object('type', a.type, 'count', a.c))::text AS count_per_type
	FROM (SELECT all_kara_tag.fk_tid,
				count(all_kara_tag.fk_kid) AS c,
				all_kara_tag.type
		FROM all_kara_tag
		WHERE all_kara_tag.fk_kid IN (SELECT * FROM kara_available)
		GROUP BY all_kara_tag.fk_tid, all_kara_tag.type) a
	GROUP BY a.fk_tid
)
SELECT at.pk_tid AS tid,
	at.types,
	at.name,
	at.short,
	at.aliases,
	at.i18n,
	at.tagfile,
	at.repository,
	at.nolivedownload AS "noLiveDownload",
	at.priority,
	at.karafile_tag,
    at.description,
	at.external_database_ids,
	t_count.count_per_type::jsonb AS karacount,
	count(at.pk_tid) OVER()::integer AS count
FROM all_tags at
LEFT JOIN t_count ON at.pk_tid = t_count.fk_tid
${joinClauses}
${additionalFrom.join('')}
WHERE TRUE
  ${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
  ${stripClause}
  ${whereClause}
ORDER BY ${orderClauses}
${limitClause}
${offsetClause}
`;

export const insertTag = `
INSERT INTO tag(
	pk_tid,
	name,
	types,
	short,
	i18n,
	aliases,
	tagfile,
	repository,
	nolivedownload,
	priority,
	karafile_tag,
	description,
	external_database_ids
)
VALUES(
	$1,
	$2,
	$3,
	$4,
	$5,
	$6,
	$7,
	$8,
	$9,
	$10,
	$11,
	$12,
	$13
)
ON CONFLICT (pk_tid) DO UPDATE SET
	types = $3,
	name = $2,
	short = $4,
	i18n = $5,
	aliases = $6,
	tagfile = $7,
	repository = $8,
	nolivedownload = $9,
	priority = $10,
	karafile_tag = $11,
	description = $12,
	external_database_ids = $13
`;

export const clearStagingTags = `
	DELETE FROM tag
	WHERE pk_tid =
	      ANY (SELECT pk_tid FROM all_tags WHERE repository = 'Staging' AND karacount IS NULL)
	RETURNING tag.tagfile;
`;

export const refreshAllKaraTag = ` 
REFRESH MATERIALIZED VIEW all_kara_tag;
`;
