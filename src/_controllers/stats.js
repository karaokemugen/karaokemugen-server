import {processStatsPayload} from '../_services/stats';

export default function statsController(router) {
	router.post('/stats', async (req, res) => {
		try {
			await processStatsPayload(req.body);
			res.status(200).json('Stats payload accepted');
		} catch(err) {
			res.status(500).json(`Error while processing stats payload : ${err}`);
		}
	});
}