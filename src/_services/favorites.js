import { deleteFavorite, selectFavorites, insertFavorite } from '../_dao/favorites';

export async function getFavorites(token) {
	return await selectFavorites(token.username);
}

export async function addFavorite(token, kid) {
	return await insertFavorite(token.username, kid);
}

export async function removeFavorite(token, kid) {
	return await deleteFavorite(token.username, kid);
}