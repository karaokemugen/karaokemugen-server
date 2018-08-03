// Shortener SQL


export const getInstance = `
SELECT pk_id_shorturl AS shorturl_id,
	modified_at,
	remote_ip,
	local_ip,
	local_port,
	instance_id
FROM short_url
WHERE remote_ip = $1
`;

export const updateInstance = `
UPDATE short_url
SET modified_at = $1,
	remote_ip = $2,
	local_ip = $3,
	local_port = $4
WHERE instance_id = $5
`;

export const insertInstance = `
INSERT INTO short_url
(modified_at, remote_ip, local_ip, local_port, instance_id)
VALUES($1, $2, $3, $4, $5);
`;