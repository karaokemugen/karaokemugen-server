import { Router } from 'express';
import multer from 'multer';
import {resolve} from 'path';

import { APIMessage, errMessage } from '../../lib/services/frontend';
import { processUploadedMedia } from '../../lib/services/karaCreation';
import {getConfig} from '../../lib/utils/config';
import {createKara, editKara} from '../../services/kara_import';
import { addTag } from '../../services/tag';
import { getState } from '../../utils/state';

export default function KIController(router: Router) {
	const conf = getConfig();
	const upload = multer({ dest: resolve(getState().dataPath, conf.System.Path.Temp)});

	router.post('/karas', async (req, res) => {
		try {
			const url = await createKara(req.body.kara, req.body.contact);
			res.status(200).json(APIMessage('GENERATED_KARA', url || ''));
		} catch (err) {
			const code = 'CANNOT_GENERATE_KARA';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
	router.put('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', async (req: any, res: any) => {
		try {
			const url = await editKara(req.body, req.body.contact);
			res.status(200).json(APIMessage('EDITED_KARA', url || ''));
		} catch (err) {
			const code = 'CANNOT_EDIT_KARA';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
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
			const code = 'CANNOT_UPLOAD_MEDIA';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
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
			const code = 'CANNOT_UPLOAD_SUBTITLES';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
	router.post('/tags/createStaging', async (req, res) => {
		try {
			const tag = await addTag(req.body, {forceRepo: 'Staging'});
			res.json({ code: 'TAG_CREATED', tag });
		} catch (err) {
			const code = 'CANNOT_CREATE_TAG';
			errMessage(code, err);
			res.status(err?.code || 500).json(APIMessage(err?.msg || code));
		}
	});
}
