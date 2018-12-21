// Tags SQL


export const getTags = (limitClause, offsetClause) => `
SELECT tag_id,
	name,
	tagtype AS type,
	slug,
	karacount::integer
FROM all_tags
WHERE tagtype = $1
${limitClause}
${offsetClause}
`;