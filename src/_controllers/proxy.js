import multer from 'multer';
import {resolve} from 'path';
import {getConfig} from '../_utils/config';
import {spawnInstance} from '../_services/proxy';
import {uuidRegexp} from '../_services/constants';

export default function ProxyController(router) {
	const conf = getConfig();
	let upload = multer({ dest: resolve(conf.appPath,conf.Path.Temp)});
	router.route('/proxy/connect')
		.post(upload.fields([
			{name: 'karaDB', maxCount: 1},
			{name: 'userDB', maxCount: 1}
		]), async (req, res) => {
			try {
				const info = await spawnInstance(req.body, req.files);
				res.status(200).json(info);
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
	router.route(`/proxy/fetchDB/:instance(${uuidRegexp})`)
		.get(async (req, res) => {
			try {
				const conf = getConfig();
				res.status(200).download(resolve(resolve(conf.appPath, conf.Path.KaraokeMugenApp,'app/db/', `${req.params.instance}-userDB.sqlite3`)));
			} catch(err) {
				res.status(500).json(err);
			}
		});
}

