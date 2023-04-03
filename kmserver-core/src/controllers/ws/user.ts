import { APIData } from '../../lib/types/api.js';
import logger from '../../lib/utils/logger.js';
import { SocketIOApp } from '../../lib/utils/ws.js';
import { subUser, unsubUser } from '../../services/userPubSub.js';

const service = 'WSUser';

export default function userSubSocketController(app: SocketIOApp) {
	app.route('subscribe user', async (socket, req: APIData<string>): Promise<boolean> => {
		try {
			return await subUser(socket, req.body);
		} catch (err) {
			logger.warn('Cannot subscribe to user', {service, obj: req});
			return false;
		}
	});
	app.route('unsubscribe user', async (socket, req: APIData<string>): Promise<boolean> => {
		try {
			unsubUser(socket, req.body);
			return true;
		} catch (err) {
			logger.warn('Cannot unsubscribe to user', {service, obj: req});
			return false;
		}
	});
}
