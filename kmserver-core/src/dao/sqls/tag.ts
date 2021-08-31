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
	t.modified_at,
	t.repository,
	t.problematic,
	t.nolivedownload AS "noLiveDownload",
	t.priority,
	t.karafile_tag,
	count(t.pk_tid) OVER()::integer AS count
FROM tag t
LEFT JOIN all_tags at ON at.pk_tid = t.pk_tid
${joinClauses}
${additionalFrom.join('')}
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
  ${stripClause}
ORDER BY ${orderClauses}
${limitClause}
${offsetClause}
`;

export const getTagByNameAndType = `
SELECT
	name,
	pk_tid AS tid
FROM tag
WHERE name = $1
  AND types @> $2
;
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
	t.modified_at,
	t.repository,
	t.problematic,
	t.nolivedownload AS "noLiveDownload",
	t.priority,
	t.karafile_tag,
	count(t.pk_tid) OVER()::integer AS count
FROM tag t
LEFT JOIN all_tags at ON at.pk_tid = t.pk_tid
WHERE t.pk_tid = $1
`;
