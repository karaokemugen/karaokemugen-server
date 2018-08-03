import {publishInstance, getInstance} from '../_services/shortener';

export default function ShortenerController(router) {
	router.route('/shortener')
		.get(async (req, res) => {
			try {
				const ret = await getInstance(req.ip);
				if (ret) {
					res.redirect(`http://${ret.local_ip}:${ret.local_port}`);
				} else {
					res.status(404).send('No Karaoke Mugen instance runs on your local network.');
				}
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		})
		.post(async (req, res) => {
			try {
				await publishInstance(req.ip, req.body);
				res.status(200).send('Update OK');
			} catch(err) {
				res.statusCode = 500;
				res.send(err);
			}
		});
}
