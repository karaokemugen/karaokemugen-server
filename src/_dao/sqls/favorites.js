export const selectFavorites = `
SELECT uf.kid AS kid
FROM  users_favorites uf, users u
WHERE uf.fk_id_user = u.pk_id_user
  AND u.login = $1
`;

export const selectAllFavorites = `
SELECT uf.kid AS kid
FROM  users_favorites uf
`;

export const insertFavorite = `
INSERT INTO users_favorites (fk_id_user, kid)
VALUES((SELECT pk_id_user FROM users WHERE login = $1), $2)
ON CONFLICT (fk_id_user, kid) DO NOTHING;
`;

export const deleteFavorite = `
DELETE FROM users_favorites
USING users
WHERE users.login = $1
AND users_favorites.kid = $2
AND users_favorites.fk_id_user = users.pk_id_user
`;