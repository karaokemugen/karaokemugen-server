import { InstanceData } from '../../types/shortener';
import { publishInstance, removeInstance } from '../../services/shortener';
import { SocketIOApp } from '../../lib/utils/ws';
import logger from '../../lib/utils/logger';

export default function shortenerSocketController(app: SocketIOApp) {
	app.route('shortener publish', async (socket, instanceData: InstanceData) => {
		try {
			return await publishInstance(socket.handshake.headers['x-forwarded-for']?.split(', ')[0] || socket.conn.remoteAddress, instanceData);
		} catch (e) {
			return false;
		}
	});
	app.onDisconnect(async (socket) => {
		try {
			await removeInstance(socket.handshake.headers['x-forwarded-for']?.split(', ')[0] || this.conn.remoteAddress);
		} catch(e) {
			logger.error('Cannot delete instance after socket disconnect', {service: 'Shortener', obj: this});
		}
	});
}
