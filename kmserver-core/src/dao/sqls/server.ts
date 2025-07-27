// SQL requests for remote tokens

export const selectServers = (publicView = false) => `
SELECT
    domain,
    ${publicView ? '' : 'sid, flag_banned, '}
    last_seen
FROM server
${publicView ? 'WhERE flag_banned = false' : ''}
ORDER BY RANDOM()
`;

export const upsertServer = `
INSERT INTO server
VALUES (
	$1,
	$2,
	now(),
	$3
)
ON CONFLICT(domain, sid) DO UPDATE SET
  last_seen = now(),
`;

export const updateBanServer = `
UPDATE server
SET flag_banned = $2
WHERE domain = $1
`;