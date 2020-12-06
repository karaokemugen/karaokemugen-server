import { publishInstance, removeInstance } from '../../services/shortener';
import { SocketIOApp } from '../../lib/utils/ws';
import logger from '../../lib/utils/logger';
import { APIData } from '../../lib/types/api';
import { InstanceData } from '../../types/shortener';

export default function shortenerSocketController(app: SocketIOApp) {
	app.route('shortener publish', async (socket, req: APIData<InstanceData>) => {
		try {
			const body = req.body || (req as unknown) as InstanceData; // Retro-compat: 4.0.13-4.1.7
			return await publishInstance(socket.handshake.headers['x-forwarded-for']?.split(', ')[0] || socket.conn.remoteAddress, body);
		} catch (e) {
			return false;
		}
	});
	app.route('shortener stop', async (socket) => {
		try {
			await removeInstance(socket.handshake.headers['x-forwarded-for']?.split(', ')[0] || this.conn.remoteAddress);
			return true;
		} catch(e) {
			// Non-fatal
			logger.warn('Cannot delete instance after socket disable', {service: 'Shortener', obj: this});
			return false;
		}
	});
	app.on('disconnect', async (socket) => {
		try {
			await removeInstance(socket.handshake.headers['x-forwarded-for']?.split(', ')[0] || this.conn.remoteAddress);
		} catch(e) {
			// Non-fatal
			logger.warn('Cannot delete instance after socket disconnect', {service: 'Shortener', obj: this});
		}
	});
}
