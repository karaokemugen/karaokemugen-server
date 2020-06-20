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
	password_last_modified_at
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, NOW())
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
	series_lang_mode,
	main_series_lang,
	fallback_series_lang,
	password_last_modified_at
FROM users
`;

export const deleteUser = `
DELETE FROM users
WHERE pk_login = $1
`;

export const updateUserPassword = `
UPDATE users SET password = $2, password_last_modified_at = NOW() WHERE pk_login = $1
`;

export const updateUser = `
UPDATE users SET
	nickname = $1,
	bio = $2,
	url = $3,
	email = $4,
	avatar_file = $5,
	type = $6,
	series_lang_mode = $7,
	main_series_lang = $8,
	fallback_series_lang = $9
WhERE pk_login = $10
`;