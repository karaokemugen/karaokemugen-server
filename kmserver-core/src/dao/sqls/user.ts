// User SQL

export const insertUser = `
INSERT INTO users(
	pk_login,
	nickname,
	password,
	type,
	avatar_file,
	bio,
	url,
	email,
	location,
	flag_sendstats,
	password_last_modified_at,
	last_login_at,
	language
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
`;

export const selectUser = `
SELECT
	pk_login AS login,
	nickname,
	password,
	type,
	avatar_file,
	bio,
	url,
	email,
	location,
	flag_sendstats,
	main_series_lang,
	fallback_series_lang,
	password_last_modified_at,
	last_login_at,
	language
FROM users
`;

export const deleteUser = `
DELETE FROM users
WHERE pk_login = $1
`;

export const updateUserPassword = `
UPDATE users SET password = $2, password_last_modified_at = NOW() WHERE pk_login = $1 RETURNING password_last_modified_at;
`;

export const updateLastLogin = `
UPDATE users SET last_login_at = NOW() WHERE pk_login = $1 RETURNING last_login_at;
`;

export const updateUser = `
UPDATE users SET
	nickname = $1,
	bio = $2,
	url = $3,
	email = $4,
	avatar_file = $5,
	type = $6,
	main_series_lang = $7,
	fallback_series_lang = $8,
	location = $9,
	flag_sendstats = $10,
	language = $11
WHERE pk_login = $12
`;