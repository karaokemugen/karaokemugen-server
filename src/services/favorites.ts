import { selectAllFavorites, deleteFavorite, selectFavorites, insertFavorite } from '../dao/favorites';
import { getConfig } from '../utils/config';
import { replaceFavorites } from '../dao/stats';

export async function getFavorites(token) {
	return await selectFavorites(token.username);
}

export async function addFavorite(token, kid) {
	return await insertFavorite(token.username, kid);
}

export async function removeFavorite(token, kid) {
	return await deleteFavorite(token.username, kid);
}

export async function initFavorites() {
	// Every hour, update this instance's favorites stats
	setInterval(updateFavoritesStats, 60 * 60 * 1000);
	updateFavoritesStats();
}

async function updateFavoritesStats() {
	const favorites = await selectAllFavorites();
	if (favorites.length > 0) await replaceFavorites(getConfig().ServerID, favorites);
}