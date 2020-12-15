import { SocketIOApp } from '../../lib/utils/ws';
import logger from '../../lib/utils/logger';
import { APIData } from '../../lib/types/api';
import { RemoteResponse, RemoteSettings } from '../../lib/types/remote';
import { proxyBroadcast, startRemote, stopRemote } from '../../services/remote';
import { getVersion } from '../../utils/remote';

export default function remoteSocketController(app: SocketIOApp) {
	app.route('remote start', async (socket, req: APIData<RemoteSettings>): Promise<RemoteResponse> => {
		logger.info(`Start remote for ${req.body.InstanceID}`, {service: 'Remote'});
		if (getVersion(req.body.version) !== false) {
			return startRemote(socket, req.body);
		} else {
			throw { code: 400, message: { code: 'OUTDATED_CLIENT' } };
		}
	});
	app.route('remote stop', async (socket) => {
		return stopRemote(socket);
	});
	app.route('remote broadcast', async (socket, req: APIData) => {
		setImmediate(proxyBroadcast, socket, req.body);
		return true;
	});
	app.on('disconnect', stopRemote);
}

