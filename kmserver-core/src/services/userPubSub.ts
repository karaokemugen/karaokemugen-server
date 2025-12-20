import { Socket } from 'socket.io';

import logger from '../lib/utils/logger.js';
import { getWS } from '../lib/utils/ws.js';
import {getFavorites} from './favorites.js';
import { findUserByName } from './user.js';

const service = 'UserPubSub';

export async function subUser(socket: Socket, username: string) {
	if (await findUserByName(username)) {
		socket.join(username);
		return true;
	} 
		return false;
}

export function unsubUser(socket: Socket, username: string) {
	socket.leave(username);
	return true;
}

export async function pubUser(username: string) {
	const [user, favorites] = await Promise.all([
		findUserByName(username, { public: true, password: false }),
		getFavorites(username)
	]);
	if (!user) {
		// wtf?
		logger.warn('A unknown user was pubbed, not normal', { service, obj: username });
		return;
	}
	getWS().ws.to(username).emit('user updated', { user, favorites });
}

export function delPubUser(username: string) {
	getWS().ws.to(username).emit('user deleted', username);
}
