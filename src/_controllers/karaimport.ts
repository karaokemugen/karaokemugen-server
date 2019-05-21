import {createKara} from '../_services/kara_import';
import multer from 'multer';
import {getConfig} from '../_utils/config';
import {resolve} from 'path';

export default function KIController(router) {
	const conf = getConfig();
	let upload = multer({ dest: resolve(conf.appPath,conf.Path.Temp)});

	router.post('/karas', async (req, res) => {
		try {
			const url = await createKara(req.body);
			res.status(200).send(url || '');
		} catch(err) {
			res.status(500).send(`Error while generating kara : ${err}`);
		}
	});
	router.post('/karas/importfile', upload.single('file'), (req, res) => {
		res.status(200).send(JSON.stringify(req.file));
	});
}