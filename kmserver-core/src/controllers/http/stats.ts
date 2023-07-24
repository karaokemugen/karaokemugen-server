import { Router } from 'express';

import { APIMessage } from '../../lib/services/frontend.js';
import { processStatsPayload} from '../../services/stats.js';

export default function statsController(router: Router) {
	router.post('/stats', async (req, res) => {
		try {
			await processStatsPayload(req.body);
			res.status(200).json('Stats payload accepted');
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	// Played songs are usually sent via instance data in POST /stats but this route is usable to add a single played song, for Live for example
	router.post('/stats/played', async (_req: any, res) => {
		try {
			// Removing this for now since it can be used to tamper with stats 
			// await addPlayed(req.body.seid, req.body.kid, req.body.played_at);
			res.status(200).json();
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
}
