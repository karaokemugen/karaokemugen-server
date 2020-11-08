import { deleteFavorite, selectFavorites, insertFavorite } from '../dao/favorites';
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
