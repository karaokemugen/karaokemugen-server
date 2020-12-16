import { Socket } from 'socket.io';
import { getWS } from '../lib/utils/ws';
import { findUserByName } from './user';

export async function subUser(socket: Socket, username: string) {
	if (await findUserByName(username)) {
		socket.join(username);
		return true;
	} else {
		return false;
	}
}

export function unsubUser(socket: Socket, username: string) {
	socket.leave(username);
	return true;
}

export function pubUser(username: string) {
	getWS().ws.to(username).emit('user updated', username);
}

export function delPubUser(username: string) {
	getWS().ws.to(username).emit('user deleted', username);
}
