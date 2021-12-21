import {createKara, editKara} from '../../services/kara_import';
import multer from 'multer';
import {getConfig} from '../../lib/utils/config';
import {resolve} from 'path';
import { Router } from 'express';
import { getState } from '../../utils/state';
import { APIMessage, errMessage } from '../../lib/services/frontend';

export default function KIController(router: Router) {
	const conf = getConfig();
	let upload = multer({ dest: resolve(getState().dataPath,conf.System.Path.Temp)});

	router.post('/karas', async (req, res) => {
		try {
			const url = await createKara(req.body, req.body.contact);
			res.status(200).json(APIMessage('GENERATED_KARA', url || ''));
		} catch(err) {
			const code = 'CANNOT_GENERATE_KARA';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
	router.put('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',  async (req: any, res: any) => {
		try {
			const url = await editKara(req.body, req.body.contact);
			res.status(200).json(APIMessage('EDITED_KARA', url || ''));
		} catch(err) {
			const code = 'CANNOT_EDIT_KARA'; 
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
	router.post('/karas/importfile', upload.single('file'), (req, res) => {
		res.status(200).json(APIMessage('FILE_UPLOADED', req.file));
	});
}
