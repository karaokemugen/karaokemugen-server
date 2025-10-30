import { deleteFavorite, insertFavorite, selectFavorites } from '../dao/favorites.js';
import { JWTTokenWithRoles } from '../lib/types/user.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import sentry from '../utils/sentry.js';
import { pubUser } from './userPubSub.js';

const service = 'Favorites';

export async function getFavorites(token: JWTTokenWithRoles) {
	try {
		token.username = token.username.toLowerCase();
		return await selectFavorites(token.username);
	} catch (err) {
		logger.error(`Unable to fetch favorites for ${token?.username}`, {service, obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function addFavorite(token: JWTTokenWithRoles, kid: string, favorited_at: string) {
	try {
		token.username = token.username.toLowerCase();
		await insertFavorite(token.username, kid, favorited_at);
		pubUser(token.username);
	} catch (err) {
		logger.error(`Unable to add favorites for ${token?.username}`, {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('ADD_FAVORITES_ERROR');
	}
}

export async function removeFavorite(token: JWTTokenWithRoles, kid: string) {
	try {
		token.username = token.username.toLowerCase();
		await deleteFavorite(token.username, kid);
		pubUser(token.username);
		return true;
	} catch (err) {
		logger.error(`Unable to remove favorites for ${token?.username}`, {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('REMOVE_FAVORITES_ERROR');
	}
}
