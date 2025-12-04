import { Router } from 'express';

import { updateBanSession } from '../../dao/stats.js';
import { APIMessage } from '../../lib/services/frontend.js';
import { addPlayed, processStatsPayload} from '../../services/stats.js';
import { optionalAuth } from '../middlewares/auth.js';

export default function statsController(router: Router) {
	router.post('/stats', async (req, res) => {
		try {
			await processStatsPayload(req.body);
			res.status(200).json('Stats payload accepted');
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.route('/stats/kara/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/played')
	.post(optionalAuth, async (req: any, res) => {
		try {
			await addPlayed(req.params.kid, req.ip, req.authToken);
			res.status(200).json();
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.route('/stats/session/:seid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
	.post(optionalAuth, async (req: any, res) => {
		try {
			await updateBanSession(req.params.seid, req.body.action);
			res.status(200).json();
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
}
