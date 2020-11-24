// SQL requests for remote tokens

export const sqlGetRemoteByToken = `
select code, token, last_use, last_ip
from remote_tokens
 where token = $1
 limit 1;`;

export const sqlDeleteOldRemoteTokens = `
delete from remote_tokens
 where last_use < now() - interval '10 days'
 and permanent = false;`;

export const sqlInsertNewToken = `
insert into remote_tokens(code, token, last_use, last_ip)
values ($1, $2, now(), $3)`;

export const sqlUpdateRemoteToken = `
update remote_tokens
set last_use = now(),
last_ip = $1
where code = $2;`;

export const sqlTestCodeExistence = `
select code from remote_tokens
where code = $1
limit 1;`;

export const sqlPromoteToken = `
update remote_tokens
set code = $1,
    permanent = true
where token = $2
`;
