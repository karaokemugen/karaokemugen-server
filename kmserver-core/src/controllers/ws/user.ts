import { SocketIOApp } from '../../lib/utils/ws';
import logger from '../../lib/utils/logger';
import { APIData } from '../../lib/types/api';
import { subUser, unsubUser } from '../../services/user_pubsub';

export default function userSubSocketController(app: SocketIOApp) {
	app.route('subscribe user', async (socket, req: APIData<string>): Promise<boolean> => {
		try {
			return subUser(socket, req.body);
		} catch (err) {
			logger.warn('Cannot subscribe to user', {service: 'UserSub', obj: req});
			return false;
		}
	});
	app.route('unsubscribe user', async (socket, req: APIData<string>): Promise<boolean> => {
		try {
			unsubUser(socket, req.body);
			return true;
		} catch (err) {
			logger.warn('Cannot unsubscribe to user', {service: 'UserSub', obj: req});
			return false;
		}
	});
}
