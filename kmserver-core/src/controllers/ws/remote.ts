import { APIData } from '../../lib/types/api.js';
import { RemoteResponse, RemoteSettings } from '../../lib/types/remote.js';
import logger from '../../lib/utils/logger.js';
import { SocketIOApp } from '../../lib/utils/ws.js';
import { proxyBroadcast, startRemote, stopRemote } from '../../services/remote.js';
import { getVersion } from '../../utils/remote.js';

const service = 'WSRemote';

export default function remoteSocketController(app: SocketIOApp) {
	app.route('remote start', async (socket, req: APIData<RemoteSettings>): Promise<RemoteResponse> => {
		logger.info(`Start remote for ${req.body.InstanceID}`, {service});
		if (getVersion(req.body.version) !== false) {
			return startRemote(socket, req.body);
		} 
			throw { code: 400, message: { code: 'OUTDATED_CLIENT' } };
	});
	app.route('remote stop', async (socket) => {
		return stopRemote(socket);
	});
	app.route('remote broadcast', async (socket, req: APIData) => {
		setImmediate(proxyBroadcast, socket, req.body);
		return true;
	});
	app.route('ping', async (socket, _req: APIData) => {
		socket.emit('pong');
		return true;
	});
	app.on('disconnect', stopRemote);
}
