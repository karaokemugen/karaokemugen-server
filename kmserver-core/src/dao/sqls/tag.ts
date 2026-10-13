// Tags SQL

const tagScopeCTEs = (o: {
	filterClauses: string[];
	withCollections: boolean;
	singleType: boolean;
	stripEmpty: boolean;
	collectionType: number;
}) => {
	const parts: string[] = [];

	if (o.withCollections) {
		parts.push(`kara_available AS (
	SELECT DISTINCT akt.fk_kid
	FROM all_kara_tag akt
	WHERE akt.type = ${o.collectionType}
	  AND akt.fk_tid = ANY(:collections::uuid[])
)`);
	}

	parts.push(`tags_filtered AS (
	SELECT at.pk_tid
	FROM all_tags at
	WHERE TRUE
	  ${o.filterClauses.map(c => `AND (${c})`).join('\n\t  ')}
)`);

	const needsExists = o.withCollections || o.stripEmpty;
	parts.push(`tags_scoped AS (
	SELECT tf.pk_tid
	FROM tags_filtered tf${needsExists ? `
	WHERE EXISTS (
		SELECT 1
		FROM all_kara_tag akt
		WHERE akt.fk_tid = tf.pk_tid
		  ${o.singleType ? 'AND akt.type = :type' : ''}
		  ${o.withCollections ? 'AND akt.fk_kid IN (SELECT fk_kid FROM kara_available)' : ''}
	)` : ''}
)`);

	return parts.join(',\n');
};

export const selectTags = (o: {
	filterClauses: string[];
	withCollections: boolean;
	singleType: boolean;
	stripEmpty: boolean;
	collectionType: number;
	orderClause: string;
	limitClause: string;
	offsetClause: string;
}) => `
WITH ${tagScopeCTEs(o)},
t_count AS (
${o.singleType ? `
	SELECT akt.fk_tid,
		   count(*)::int AS karacounttype
	FROM all_kara_tag akt
	WHERE akt.type = :type
	  AND akt.fk_tid IN (SELECT pk_tid FROM tags_scoped)
	  ${o.withCollections ? 'AND akt.fk_kid IN (SELECT fk_kid FROM kara_available)' : ''}
	GROUP BY akt.fk_tid
` : `
	SELECT akt.fk_tid,
		   jsonb_agg(jsonb_build_object('type', akt.type, 'count', akt.c)) AS karacount
	FROM (
		SELECT fk_tid, type, count(*)::int AS c
		FROM all_kara_tag
		WHERE fk_tid IN (SELECT pk_tid FROM tags_scoped)
		  ${o.withCollections ? 'AND fk_kid IN (SELECT fk_kid FROM kara_available)' : ''}
		GROUP BY fk_tid, type
	) akt
	GROUP BY akt.fk_tid
`}
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
	${o.singleType
		? 'coalesce(t_count.karacounttype, 0) AS karacounttype'
		: 't_count.karacount'}
FROM all_tags at
LEFT JOIN t_count ON t_count.fk_tid = at.pk_tid
WHERE at.pk_tid IN (SELECT pk_tid FROM tags_scoped)
ORDER BY ${o.orderClause}
${o.limitClause}
${o.offsetClause}
`;

export const selectTagsCount = (o: {
	filterClauses: string[];
	withCollections: boolean;
	singleType: boolean;
	stripEmpty: boolean;
	collectionType: number;
}) => `
WITH ${tagScopeCTEs(o)}
SELECT count(*)::int AS count
FROM tags_scoped
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

export const refreshAllKaraTag = ` 
REFRESH MATERIALIZED VIEW all_kara_tag;
`;
