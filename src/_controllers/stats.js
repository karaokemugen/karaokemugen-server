import {processStatsPayload} from '../_services/stats';

export default function statsController(router) {
	router.post('/stats', async (req, res) => {
		try {
			await processStatsPayload(req.body);
			res.status(200).send('Stats payload accepted');
		} catch(err) {
			console.log(err);
			res.status(500).send(`Error while processing stats payload : ${err}`);
		}
	});
}