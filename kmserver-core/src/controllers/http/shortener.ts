import { publishInstance, getInstance } from '../../services/shortener';
import { Router } from 'express';
import { isIPv6 } from 'net';

export default function ShortenerController(router: Router) {
	router.route('/shortener')
		.get(async (req, res) => {
			try {
				const ip = (req.headers['x-forwarded-for'] as string).split(', ')[0];
				const ret = await getInstance(ip);
				if (ret) {
					if (isIPv6(ip) && ret.ip6) {
						res.redirect(`http://[${ret.ip6}]:${ret.local_port}`);
					} else {
						res.redirect(`http://${ret.local_ip4}:${ret.local_port}`);
					}
				} else {
					res.redirect('/base');
				}
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.post(async (req, res) => {
			try {
				await publishInstance((req.headers['x-forwarded-for'] as string).split(', ')[0], req.body);
				res.status(200).send('Update OK');
			} catch(err) {
				res.status(500).send(err);
			}
		});
}
