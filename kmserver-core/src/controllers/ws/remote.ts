import { APIData } from '../../lib/types/api.js';
import { RemoteResponse, RemoteSettings } from '../../lib/types/remote.js';
import logger from '../../lib/utils/logger.js';
import { SocketIOApp } from '../../lib/utils/ws.js';
import { proxyBroadcast, startRemote, stopRemote } from '../../services/remote.js';
import { WS_CMD } from '../../utils/ws.js';

const service = 'WSRemote';

export default function remoteSocketController(app: SocketIOApp) {
	app.route(WS_CMD.REMOTE_START, async (socket, req: APIData<RemoteSettings>): Promise<RemoteResponse> => {
		logger.info(`Start remote for ${req.body.InstanceID}`, {service});
		return startRemote(socket, req.body);
	});
	app.route(WS_CMD.REMOTE_STOP, async (socket) => {
		return stopRemote(socket);
	});
	app.route(WS_CMD.REMOTE_BROADCAST, async (socket, req: APIData) => {
		setImmediate(proxyBroadcast, socket, req.body);
		return true;
	});
	app.route(WS_CMD.PING, async (socket, _req: APIData) => {
		socket.emit('pong');
		return true;
	});
	app.on('disconnect', stopRemote);
}
