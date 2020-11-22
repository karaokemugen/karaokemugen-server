import { SocketIOApp } from '../../lib/utils/ws';
import logger from '../../lib/utils/logger';
import { APIData } from '../../lib/types/api';
import { RemoteResponse, RemoteSettings } from '../../types/remote';
import {proxyBroadcast, startRemote, stopRemote} from '../../services/remote';

export default function remoteSocketController(app: SocketIOApp) {
	app.route('remote start', async (socket, req: APIData<RemoteSettings>): Promise<{body: RemoteResponse}> => {
		logger.info(`Start remote for ${req.body.InstanceID}`, {service: 'Remote'});
		return {body: startRemote(socket, req.body.InstanceID)};
	});
	app.route('remote broadcast', async (socket, req: APIData) => {
		proxyBroadcast(socket, req.body);
	});
	app.on('disconnect', stopRemote);
}

