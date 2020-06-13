import { selectAllFavorites, deleteFavorite, selectFavorites, insertFavorite } from '../dao/favorites';
import { getConfig } from '../lib/utils/config';
import { replaceFavorites } from '../dao/stats';
import { Token } from '../lib/types/user';
import sentry from '../utils/sentry';

export async function getFavorites(token: Token) {
	try {
		return await selectFavorites(token.username);
	} catch(err) {
		sentry.error(err);
		throw err;
	}
}

export async function addFavorite(token: Token, kid: string) {
	try {
		return await insertFavorite(token.username, kid);
	} catch(err) {
		sentry.error(err);
		throw err;
	}
}

export async function removeFavorite(token: Token, kid: string) {
	try {
		return await deleteFavorite(token.username, kid);
	} catch(err) {
		sentry.error(err);
		throw err;
	}
}

export async function initFavorites() {
	// Every hour, update this instance's favorites stats
	setInterval(updateFavoritesStats, 60 * 60 * 1000);
	updateFavoritesStats();
}

async function updateFavoritesStats() {
	try {
		const favorites = await selectAllFavorites();
		if (favorites.length > 0) await replaceFavorites(getConfig().App.InstanceID, favorites);
	} catch(err) {
		sentry.error(err);
		throw err;
	}
}