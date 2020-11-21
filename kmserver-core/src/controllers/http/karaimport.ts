import {createKara, editKara} from '../../services/kara_import';
import { Router } from 'express';
import { APIMessage, errMessage } from '../../lib/services/frontend';
import {basename} from 'path';

export default function KIController(router: Router) {

	router.post('/karas', async (req, res) => {
		try {
			const url = await createKara(req.body);
			res.status(200).json(APIMessage('GENERATED_KARA', url || ''));
		} catch(err) {
			const code = 'CANNOT_GENERATE_KARA';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
	router.put('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',  async (req: any, res: any) => {
		try {
			const url = await editKara(req.body);
			res.status(200).json(APIMessage('EDITED_KARA', url || ''));
		} catch(err) {
			const code = 'CANNOT_EDIT_KARA';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
	router.post('/karas/importfile', (req: any, res) => {
		const files = {
			filename: basename(req.files.file.tempFilePath),
			originalname: req.files.file.name
		};
		res.status(200).json(APIMessage('FILE_UPLOADED', files));
	});
}
