import { Server, Socket } from 'socket.io';
import { InstanceData } from '../../types/shortener';
import { publishInstance, removeInstance } from '../../services/shortener';
import logger from '../../lib/utils/logger';

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

async function deleteShortener(this: Socket) {
	try {
		await removeInstance(this.handshake.headers['x-forwarded-for']?.split(', ')[0] || this.conn.remoteAddress);
	} catch(e) {
		logger.error('Cannot delete instance after socket disconnect', {service: 'Shortener', obj: this});
	}
}

export default function shortenerSocketController(io: Server) {
	io.on('connection', (socket) => {
		socket.on('shortener publish', publishShortener);
		socket.on('disconnect', deleteShortener);
	});
}
