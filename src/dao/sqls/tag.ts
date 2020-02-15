// Tags SQL


export const getAllTags = (filterClauses: string[], typeClauses: string, limitClause: string, offsetClause: string) => `
SELECT tid,
	types,
	name,
	short,
	aliases,
	i18n,
	karacount,
	tagfile,
	count(tid) OVER()::integer AS count
FROM all_tags
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
ORDER BY name
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
SELECT tid,
	types,
	name,
	short,
	aliases,
	i18n,
	karacount,
	tagfile
FROM all_tags
WHERE tid = $1
`;