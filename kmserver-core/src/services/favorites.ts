import { deleteFavorite, selectFavorites, insertFavorite } from '../dao/favorites';
import { Token } from '../lib/types/user';
import sentry from '../utils/sentry';
import { pubUser } from './user_pubsub';

export async function getFavorites(token: Token) {
	try {
		token.username = token.username.toLowerCase();
		return await selectFavorites(token.username);
	} catch(err) {
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
		sentry.error(err);
		throw err;
	}
}
