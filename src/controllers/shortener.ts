import {publishInstance, getInstance} from '../services/shortener';

export default function ShortenerController(router) {
	router.route('/shortener')
		.get(async (req, res) => {
			try {
				const ret = await getInstance(req.headers['x-forwarded-for']);
				if (ret) {
					res.redirect(`http://${ret.local_ip}:${ret.local_port}`);
				} else {
					res.status(404).send('No Karaoke Mugen instance runs on your local network.');
				}
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.post(async (req, res) => {
			try {
				await publishInstance(req.headers['x-forwarded-for'], req.body);
				res.status(200).send('Update OK');
			} catch(err) {
				res.status(500).send(err);
			}
		});
}
