import { Server, Socket } from 'socket.io';
import { InstanceData } from '../../types/shortener';
import { publishInstance } from '../../services/shortener';

async function publishShortener(this: Socket, instanceData: InstanceData, cb: Function) {
	try {
		if (await publishInstance(this.handshake.headers['x-forwarded-for']?.split(', ')[0] || this.conn.remoteAddress, instanceData)) {
			cb(true);
		} else {
			cb(false);
		}
	} catch (e) {
		cb(false);
	}
}

export default function shortenerSocketController(io: Server) {
	io.on('connection', (socket) => {
		socket.on('shortener publish', publishShortener);
	});
}
