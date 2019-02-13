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
	email
) VALUES($1, $2, $3, $4, $5, $6, $7, $8)
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
	email
FROM users
`;

export const deleteUser = `
DELETE FROM user
WHERE login = $1;
`;

export const updateUserPassword = `
UPDATE users SET password = $2 WHERE pk_login = $1
`;

export const updateUser = `
UPDATE users SET
	nickname = $1,
	bio = $2,
	url = $3,
	email = $4,
	avatar_file = $5,
	type = $6
WhERE pk_login = $7
`;