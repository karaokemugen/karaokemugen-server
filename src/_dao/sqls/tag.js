// Tags SQL


export const getTags = `
SELECT pk_id_tag AS tag_id,
	name
FROM karasdb.tag
ORDER BY name
WHERE tagtype = $1
`;