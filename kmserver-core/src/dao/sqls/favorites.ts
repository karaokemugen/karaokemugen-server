export const selectFavorites = `
SELECT uf.fk_kid AS kid,
	   uf.favorited_at AS favorited_at
FROM  users_favorites uf
WHERE uf.fk_login = $1
`;

export const insertFavorite = `
INSERT INTO users_favorites (fk_login, fk_kid, favorited_at)
VALUES($1, $2, $3)
ON CONFLICT (fk_login, fk_kid) DO NOTHING;
`;

export const deleteFavorite = `
DELETE FROM users_favorites
WHERE fk_login = $1
AND fk_kid = $2
`;
