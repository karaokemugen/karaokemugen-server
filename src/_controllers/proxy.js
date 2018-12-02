import {resolve} from 'path';
import {getConfig} from '../_utils/config';
import {spawnInstance} from '../_services/proxy';
import {uuidRegexp} from '../_services/constants';

export default function ProxyController(router) {
	router.route('/proxy/connect')
		.post(async (req, res) => {
			try {
				const info = await spawnInstance(req.body);
				res.status(200).json(info);
			} catch(err) {
				res.statusCode = 500;
				console.log(err);
				res.json(err);
			}
		});
	router.route(`/proxy/fetchDB/:instance(${uuidRegexp})`)
		.get(async (req, res) => {
			try {
				const conf = getConfig();
				res.status(200).download(resolve(resolve(conf.appPath, conf.Path.KaraokeMugenApp,'app/db/', `${req.params.instance}-userDB.sqlite3`)));
			} catch(err) {
				console.log(err);
				res.status(500).json(err);
			}
		});
}

