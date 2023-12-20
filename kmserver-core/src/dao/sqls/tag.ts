// Tags SQL

export const selectTags = (filterClauses: string[], limitClause: string, offsetClause: string, joinClauses: string, orderClauses: string, stripClause: string, additionalFrom: string[], collectionClauses: string[], whereClause: string) => `
WITH kara_available AS (
	SELECT ak.pk_kid
	FROM all_karas ak
	WHERE TRUE 
	${collectionClauses.length > 0 ? `AND (${collectionClauses.map(clause => `(${clause})`).join(' OR ')})` : ''}
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
	at.karacount,
	count(at.pk_tid) OVER()::integer AS count
FROM all_tags at
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
