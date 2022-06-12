// SQL requests for remote tokens

export const selectTokens = (singleToken: boolean | string) => `
SELECT
    code,
    token,
    last_use,
    last_ip,
    permanent
FROM remote_tokens
${singleToken ? 'WHERE token = $1' : ''}
`;

export const deleteToken = `
DELETE FROM remote_tokens
WHERE token = $1
`;

export const deleteOldRemoteTokens = `
delete from remote_tokens
 where last_use < now() - interval '10 days'
 and permanent = false;
`;

export const insertNewToken = `
insert into remote_tokens(code, token, last_use, last_ip)
values ($1, $2, now(), $3, $4)`;

export const updateRemoteToken = `
update remote_tokens
set last_use = now(),
last_ip = $1
where code = $2;`;

export const updateRemoteTokenCode = `
update remote_tokens
set code = $1,
    permanent = true
where token = $2
`;
