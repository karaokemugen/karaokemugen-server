create table remote_tokens
(
    code varchar not null,
    token varchar not null,
    last_use timestamptz,
    last_ip inet,
    permanent boolean default false
);

create unique index remote_tokens_code_uindex
    on remote_tokens (code);

create unique index remote_tokens_token_uindex
    on remote_tokens (token);

alter table remote_tokens
    add constraint remote_tokens_pk
        primary key (code);
