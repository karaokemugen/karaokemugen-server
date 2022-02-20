// Tags SQL

export const getAllTags = (filterClauses: string[], typeClauses: string, limitClause: string, offsetClause: string, joinClauses: string, orderClauses: string, stripClause: string, additionalFrom: string[]) => `
SELECT t.pk_tid AS tid,
	t.types,
	t.name,
	t.short,
	t.aliases,
	t.i18n,
	at.karacount AS karacount,
	t.tagfile,
	t.repository,
	t.nolivedownload AS "noLiveDownload",
	t.priority,
	t.karafile_tag,
	count(t.pk_tid) OVER()::integer AS count
FROM tag t
LEFT JOIN all_tags at ON at.pk_tid = t.pk_tid
${joinClauses}
${additionalFrom.join('')}
WHERE 1 = 1
  ${filterClauses.map(clause => `AND (${clause})`).reduce((a, b) => (`${a} ${b}`), '')}
  ${typeClauses}
  ${stripClause}
ORDER BY ${orderClauses}
${limitClause}
${offsetClause}
`;

export const selectTag = `
SELECT t.pk_tid AS tid,
	t.types,
	t.name,
	t.short,
	t.aliases,
	t.i18n,
	at.karacount AS karacount,
	t.tagfile,
	t.repository,
	t.nolivedownload AS "noLiveDownload",
	t.priority,
	t.karafile_tag,
	count(t.pk_tid) OVER()::integer AS count
FROM tag t
LEFT JOIN all_tags at ON at.pk_tid = t.pk_tid
WHERE t.pk_tid = $1
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
	karafile_tag
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
	$11
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
	karafile_tag = $11
`;

export const clearStagingTags = `
	DELETE FROM tag
	WHERE pk_tid =
	      ANY (SELECT pk_tid FROM all_tags WHERE repository = 'Staging' AND karacount IS NULL)
	RETURNING tag.tagfile;
`;
