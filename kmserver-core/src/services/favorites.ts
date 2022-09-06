import { deleteFavorite, insertFavorite, selectFavorites } from '../dao/favorites';
import { JWTTokenWithRoles } from '../lib/types/user';
import logger from '../lib/utils/logger';
import sentry from '../utils/sentry';
import { pubUser } from './userPubSub';

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

export async function addFavorite(token: JWTTokenWithRoles, kid: string) {
	try {
		token.username = token.username.toLowerCase();
		await insertFavorite(token.username, kid);
		pubUser(token.username);
		return true;
	} catch (err) {
		logger.error(`Unable to add favorites for ${token?.username}`, {service, obj: err});
		sentry.error(err);
		throw err;
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
		throw err;
	}
}
