import { Router } from 'express';

import {addPlayed, processStatsPayload} from '../../services/stats';

export default function statsController(router: Router) {
	router.post('/stats', async (req, res) => {
		try {
			await processStatsPayload(req.body);
			res.status(200).json('Stats payload accepted');
		} catch (err) {
			res.status(500).json(`Error while processing stats payload : ${err}`);
		}
	});
	// Played songs are usually sent via instance data in POST /stats but this route is usable to add a single played song, for Live for example
	router.post('/stats/played', async (req: any, res) => {
		try {
			await addPlayed(req.body.seid, req.body.kid, req.body.played_at);
			res.status(200).json();
		} catch (err) {
			res.status(500).json(`Error while retrieving played stats : ${err}`);
		}
	});
}
