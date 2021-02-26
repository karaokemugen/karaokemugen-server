// Tags SQL


export const getAllTags = (filterClauses: string[], typeClauses: string, limitClause: string, offsetClause: string, joinClauses: string, orderClauses: string, stripClause: string, additionalFrom: string[]) => `
SELECT pk_tid AS tid,
	types,
	name,
	short,
	aliases,
	i18n,
	karacount,
	tagfile,
	count(pk_tid) OVER()::integer AS count,
	problematic,
	noLiveDownload,
	repository,
	modified_at
FROM all_tags
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
SELECT pk_tid AS tid,
	types,
	name,
	short,
	aliases,
	i18n,
	karacount,
	tagfile,
	repository,
	problematic,
	noLiveDownload,
	modified_at
FROM all_tags
WHERE pk_tid = $1
`;
