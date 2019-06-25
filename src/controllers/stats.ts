import {getRequestedStats, getFavoritesStats, getPlayedStats, processStatsPayload} from '../services/stats';
import { Router } from 'express';

export default function statsController(router: Router) {
	router.post('/stats', async (req, res) => {
		try {
			await processStatsPayload(req.body);
			res.status(200).json('Stats payload accepted');
		} catch(err) {
			res.status(500).json(`Error while processing stats payload : ${err}`);
		}
	});
	/*
	router.get('/stats/instances', async (_, res) => {
		try {
			res.status(200).json(await getInstanceStats());
		} catch(err) {
			res.status(500).json(`Error while retrieving instance Stats : ${err}`);
		}
	});
	*/
	router.get('/stats/played', async (_, res) => {
		try {
			res.status(200).json(await getPlayedStats());
		} catch(err) {
			res.status(500).json(`Error while retrieving played stats : ${err}`);
		}
	});
	router.get('/stats/favorites', async (_, res) => {
		try {
			res.status(200).json(await getFavoritesStats());
		} catch(err) {
			res.status(500).json(`Error while retrieving favorites : ${err}`);
		}
	});
	router.get('/stats/requested', async (_, res) => {
		try {
			res.status(200).json(await getRequestedStats());
		} catch(err) {
			res.status(500).json(`Error while retrieving requested stats : ${err}`);
		}
	});
}
