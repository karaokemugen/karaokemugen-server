import { selectAllFavorites, deleteFavorite, selectFavorites, insertFavorite, selectFavoritesFull } from '../dao/favorites';
import { getConfig } from '../lib/utils/config';
import { replaceFavorites } from '../dao/stats';
import { Token } from '../lib/types/user';
import sentry from '../utils/sentry';
import { FavParams } from '../lib/types/favorites';
import { KaraList } from '../lib/types/kara';
import { formatKaraList } from './kara';

export async function getFavoritesFull(params: FavParams): Promise<KaraList> {
	try {
		const favs = await selectFavoritesFull(params);
		const count = favs.length > 0 ? favs[0].count : 0;
		return formatKaraList(favs, params.from, count);
	} catch(err) {
		const error = new Error(err);
		sentry.error(error);
		throw error;
	}
}

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