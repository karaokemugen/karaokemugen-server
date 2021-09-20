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
	flag_public,
	flag_displayfavorites,
	language
) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), true, false, $11)
`;

export const selectUser = (filter: boolean = false, where?: string, offset_limit?: string, order = false) => `
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
	social_networks,
	flag_public,
	flag_displayfavorites,
	banner,
	language,
	(select count(fk_kid) from users_favorites where fk_login = pk_login)::integer as favorites_count,
	count(pk_login) OVER()::integer AS count
FROM users
    ${where || ''}
	${filter ? 'WHERE to_tsvector(\'public.unaccent_conf\', concat(pk_login, \' \', nickname)) @@ to_tsquery(\'public.unaccent_conf\', $1)':''}
GROUP BY pk_login, nickname, password, type, avatar_file, bio, url, email, location, flag_sendstats, main_series_lang, fallback_series_lang, password_last_modified_at, last_login_at, social_networks, flag_public, flag_displayfavorites, banner, language
${order ? 'ORDER BY pk_login asc':''}
${offset_limit || ''}
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
	flag_public = $11,
	flag_displayfavorites = $12,
	social_networks = $13,
	banner = $14,
	language = $15
WHERE pk_login = $16 RETURNING pk_login as login, *;
`;
