import { deleteFavorite, selectFavorites, insertFavorite } from '../dao/favorites';
import { Token } from '../lib/types/user';
import logger from '../lib/utils/logger';
import sentry from '../utils/sentry';
import { pubUser } from './user_pubsub';

export async function getFavorites(token: Token) {
	try {
		token.username = token.username.toLowerCase();
		return await selectFavorites(token.username);
	} catch(err) {
		logger.error(`Unable to fetch favorites for ${token?.username}`, {service: 'Favorites', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function addFavorite(token: Token, kid: string) {
	try {
		token.username = token.username.toLowerCase();
		await insertFavorite(token.username, kid);
		pubUser(token.username);
		return true;
	} catch(err) {
		logger.error(`Unable to add favorites for ${token?.username}`, {service: 'Favorites', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function removeFavorite(token: Token, kid: string) {
	try {
		token.username = token.username.toLowerCase();
		await deleteFavorite(token.username, kid);
		pubUser(token.username);
		return true;
	} catch(err) {
		logger.error(`Unable to remove favorites for ${token?.username}`, {service: 'Favorites', obj: err});
		sentry.error(err);
		throw err;
	}
}
