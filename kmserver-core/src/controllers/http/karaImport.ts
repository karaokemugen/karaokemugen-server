import { Router } from 'express';
import multer from 'multer';
import {resolve} from 'path';

import { APIMessage } from '../../lib/services/frontend.js';
import { processUploadedMedia } from '../../lib/services/karaCreation.js';
import {getConfig} from '../../lib/utils/config.js';
import {createKara, editKara} from '../../services/karaImport.js';
import { addTag } from '../../services/tag.js';
import { getState } from '../../utils/state.js';

export default function KIController(router: Router) {
	const conf = getConfig();
	const upload = multer({ dest: resolve(getState().dataPath, conf.System.Path.Temp)});

	router.post('/karas', async (req, res) => {
		try {
			const url = await createKara(req.body.kara, req.body.contact);
			res.status(200).json(APIMessage('GENERATED_KARA', url || ''));
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.put('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', async (req: any, res: any) => {
		try {
			const url = await editKara(req.body, req.body.contact);
			res.status(200).json(APIMessage('EDITED_KARA', url || ''));
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.post('/karas/importMedia', upload.single('file'), async (req, res) => {
		try {
			if (req.file) {
				const mediaInfo = await processUploadedMedia(req.file.filename, req.file.originalname);
				res.json(mediaInfo);
			} else {
				res.status(400).json(APIMessage('MISSING_FILE'));
			}
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.post('/karas/importSub', upload.single('file'), async (req, res) => {
		try {
			if (req.file) {
				res.json(req.file.filename);
			} else {
				res.status(400).json(APIMessage('MISSING_FILE'));
			}
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.post('/tags/createStaging', async (req, res) => {
		try {
			const tag = await addTag(req.body, {forceRepo: 'Staging'});
			res.json({ code: 'TAG_CREATED', tag });
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
}
