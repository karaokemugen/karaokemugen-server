import { deleteFavorite, insertFavorite, selectFavorites } from '../dao/favorites.js';
import { JWTTokenWithRoles } from '../lib/types/user.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import { adminToken } from '../utils/constants.js';
import sentry from '../utils/sentry.js';
import { getAllKaras } from './kara.js';
import { findUserByName } from './user.js';
import { pubUser } from './userPubSub.js';

const service = 'Favorites';

export async function compareFavorites(username1: string, username2: string) {
	const [user1, user2] = await Promise.all([
		findUserByName(username1),
		findUserByName(username2)
	]);
	if (!user1 || !user2) {
		throw new ErrorKM('UNKNOWN_USER', 404, false);
	}
	if (!user1.flag_displayfavorites || !user2.flag_displayfavorites || !user1.flag_public || !user2.flag_public) {
		throw new ErrorKM('FORBIDDEN_USER_PROFILE', 403, false);
	}
	const [favorites1, favorites2] = await Promise.all([
		getFavorites(username1),
		getFavorites(username2)
	]);
	const kids = favorites1.filter(f => favorites2.find(f2 => f2.kid === f.kid)).map(f => f.kid);
	return getAllKaras({ q: `k:${kids.join(',')}`}, adminToken, false);
}

export async function getFavorites(username: string) {
	try {
		return await selectFavorites(username);
	} catch (err) {
		logger.error(`Unable to fetch favorites for ${username}`, {service, obj: err});
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
