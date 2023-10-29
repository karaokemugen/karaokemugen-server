CREATE TABLE bans (
	type CHARACTER VARYING,
	value CHARACTER VARYING,
	banned_at TIMESTAMPTZ,
	reason CHARACTER VARYING
);

CREATE UNIQUE INDEX idx_bans_type_value ON bans(type, value);