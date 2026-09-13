// SQL requests for remote tokens

export const selectServers = (publicView = false) => `
SELECT
    domain,
    ${publicView ? '' : 'sid, flag_banned, '}
    last_seen,
    stats,
    manifest
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
  false,
  $3,
  $4
)
ON CONFLICT(domain, sid) DO UPDATE SET
  last_seen = now(),
  stats = $3,
  manifest = $4
`;

export const updateBanServer = `
UPDATE server
SET flag_banned = $2
WHERE domain = $1
`;