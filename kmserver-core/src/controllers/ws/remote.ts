import { SocketIOApp } from '../../lib/utils/ws';
import logger from '../../lib/utils/logger';
import { APIData } from '../../lib/types/api';
import { RemoteResponse, RemoteSettings } from '../../lib/types/remote';
import { proxyBroadcast, startRemote, stopRemote } from '../../services/remote';
import pjson from '../../../../kmapp-remote/package.json';

export default function remoteSocketController(app: SocketIOApp) {
	app.route('remote start', async (socket, req: APIData<RemoteSettings>): Promise<RemoteResponse> => {
		logger.info(`Start remote for ${req.body.InstanceID}`, {service: 'Remote'});
		if (pjson.version === req.body.version) {
			return startRemote(socket, req.body.InstanceID, req.body.token);
		} else {
			throw { code: 400, message: { code: 'OUTDATED_CLIENT' } };
		}
	});
	app.route('remote stop', async (socket) => {
		return stopRemote(socket);
	});
	app.route('remote broadcast', async (socket, req: APIData) => {
		return proxyBroadcast(socket, req.body);
	});
	app.on('disconnect', stopRemote);
}

