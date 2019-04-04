// Tags SQL


export const getAllTags = (filterClauses, typeClauses, limitClause, offsetClause) => `
SELECT tag_id,
	tagtype AS type,
	name,
	slug,
	i18n,
	karacount
FROM all_tags
WHERE 1 = 1
  ${filterClauses.map(clause => 'AND (' + clause + ')').reduce((a, b) => (a + ' ' + b), '')}
  ${typeClauses}
ORDER BY tagtype, name
${limitClause}
${offsetClause}
`;