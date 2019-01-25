// Tags SQL


export const getTags = `
SELECT pk_id_tag AS tag_id,
	name,
	tagtype AS type
FROM tag
WHERE tagtype = $1
ORDER BY name
`;