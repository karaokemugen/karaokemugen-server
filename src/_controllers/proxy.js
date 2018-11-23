import multer from 'multer';
import {resolve} from 'path';
import {getConfig} from '../_utils/config';
import {spawnInstance} from '../_services/proxy';

export default function ProxyController(router) {
	const conf = getConfig();
	let upload = multer({ dest: resolve(conf.appPath,conf.Path.Temp)});
	router.route('/proxy/connect')
		.post(upload.fields([
			{name: 'karaDB', maxCount: 1},
			{name: 'userDB', maxCount: 1}
		]), async (req, res) => {
			try {
				const ret = await spawnInstance(req.body, req.files);
				res.status(200).send('Instance spawning up...');
			} catch(err) {
				res.statusCode = 500;
				res.json(err);
			}
		});
}