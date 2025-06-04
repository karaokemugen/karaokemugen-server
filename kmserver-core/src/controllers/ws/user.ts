import { APIData } from '../../lib/types/api.js';
import logger from '../../lib/utils/logger.js';
import { SocketIOApp } from '../../lib/utils/ws.js';
import { subUser, unsubUser } from '../../services/userPubSub.js';
import { WS_CMD } from '../../utils/ws.js';

const service = 'WSUser';

export default function userSubSocketController(app: SocketIOApp) {
	app.route(WS_CMD.SUBSCRIBE_USER, async (socket, req: APIData<string>): Promise<boolean> => {
		try {
			return await subUser(socket, req.body);
		} catch (err) {
			logger.warn('Cannot subscribe to user', {service, obj: req});
			return false;
		}
	});
	app.route(WS_CMD.UNSUBSCRIBE_USER, async (socket, req: APIData<string>): Promise<boolean> => {
		try {
			unsubUser(socket, req.body);
			return true;
		} catch (err) {
			logger.warn('Cannot unsubscribe to user', {service, obj: req});
			return false;
		}
	});
}
