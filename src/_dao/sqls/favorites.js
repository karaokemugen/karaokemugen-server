export const selectFavorites = `
SELECT uf.fk_kid AS kid
FROM  users_favorites uf
WHERE uf.fk_login = $1
`;

export const selectAllFavorites = `
SELECT uf.fk_kid AS kid
FROM  users_favorites uf
`;

export const insertFavorite = `
INSERT INTO users_favorites (fk_login, fk_kid)
VALUES($1, $2)
ON CONFLICT (fk_login, fk_kid) DO NOTHING;
`;

export const deleteFavorite = `
DELETE FROM users_favorites
WHERE fk_login = $1
AND fk_kid = $2
`;