// Tags SQL


export const getTags = (limitClause, offsetClause, whereClause) => `
SELECT tag_id,
	name,
	tagtype AS type,
	slug,
	karacount::integer
FROM all_tags
${whereClause}
${limitClause}
${offsetClause}
`;