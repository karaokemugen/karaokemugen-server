import {resolve} from 'path';
import {getConfig} from '../_utils/config';
import {spawnInstance} from '../_services/proxy';

export default function ProxyController(router) {
	router.route('/proxy/connect')
		.post(async (req, res) => {
			try {
				const info = await spawnInstance(req.body);
				res.status(200).json(info);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/proxy/fetchDB/:instance([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(async (req, res) => {
			try {
				const conf = getConfig();
				res.status(200).download(resolve(resolve(conf.appPath, conf.Path.KaraokeMugenApp,'app/db/', `userdata-${req.params.instance}.sqlite3`)));
			} catch(err) {
				res.status(500).json(err);
			}
		});
}

