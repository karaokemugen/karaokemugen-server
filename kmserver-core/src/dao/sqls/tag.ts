// Tags SQL

export const getAllTags = (filterClauses: string[], typeClauses: string, limitClause: string, offsetClause: string, joinClauses: string, orderClauses: string, stripClause: string, additionalFrom: string[], collectionClause: string[], whereClause: string) => `
WITH kara_available AS (
	SELECT k.pk_kid
	FROM kara k
	LEFT JOIN kara_tag kt ON k.pk_kid = kt.fk_kid
	WHERE ${collectionClause.join(' OR ')}
),
t_count AS (
	SELECT a.fk_tid,
		json_agg(json_build_object('type', a.type, 'count', a.c))::text AS count_per_type
	FROM (SELECT kara_tag.fk_tid,
				count(kara_tag.fk_kid) AS c,
				kara_tag.type
		FROM kara_tag
		WHERE kara_tag.fk_kid IN (SELECT * FROM kara_available)
		GROUP BY kara_tag.fk_tid, kara_tag.type) a
	GROUP BY a.fk_tid
)
SELECT t.pk_tid AS tid,
	t.types,
	t.name,
	t.short,
	t.aliases,
	t.i18n,
	t.tagfile,
	t.repository,
	t.nolivedownload AS "noLiveDownload",
	t.priority,
	t.karafile_tag,
    t.description,
	t.external_database_ids,
	t_count.count_per_type::jsonb AS karacount,
	count(t.pk_tid) OVER()::integer AS count
FROM tag t
LEFT JOIN t_count ON t.pk_tid = t_count.fk_tid
${joinClauses}
${additionalFrom.join('')}
WHERE 1 = 1
  ${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
  ${typeClauses}
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
