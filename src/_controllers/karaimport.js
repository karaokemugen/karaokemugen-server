import {requireAuth, requireValidUser, updateUserLoginTime, requireAdmin} from '../_controllers/passport_manager';
import {createKara} from '../_services/kara';
import multer from 'multer';
import {getConfig} from '../_utils/config';
import {resolve} from 'path';

export default function KIController(router) {
	const conf = getConfig();
	let upload = multer({ dest: resolve(conf.appPath,conf.Path.Temp)});

	router.post('/karas', async (req, res) => {
		try {
			await createKara(req.body);
			res.status(200).send('Kara successfully generated');
		} catch(err) {
			res.status(500).send(`Error while generating kara : ${err}`);
		}
	});
	router.post('/karas/importfile', upload.single('file'), (req, res) => {
		res.status(200).send(JSON.stringify(req.file));
	});
}