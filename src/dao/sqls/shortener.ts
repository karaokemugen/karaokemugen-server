// Shortener SQL


export const getInstance = `
SELECT modified_at,
	remote_ip,
	local_ip,
	local_port,
	instance_id
FROM short_url
WHERE remote_ip = $1
`;

export const cleanupInstances = `
DELETE FROM short_url
WHERE modified_at <= $1
`;

export const upsertInstance = `
INSERT INTO short_url
(modified_at, remote_ip, local_ip, local_port, instance_id)
VALUES($1, $2, $3, $4, $5)
ON CONFLICT (remote_ip) DO UPDATE SET
   modified_at = $1,
   local_ip = $3,
   local_port = $4,
   instance_id = $5
;`;