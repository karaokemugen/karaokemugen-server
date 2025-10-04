import { Router } from 'express';
import multer from 'multer';
import {resolve} from 'path';

import { APIMessage } from '../../lib/services/frontend.js';
import { processUploadedMedia } from '../../lib/services/karaCreation.js';
import {getConfig} from '../../lib/utils/config.js';
import {createKara, editKara} from '../../services/karaImport.js';
import { addTag } from '../../services/tag.js';
import { canSubmitInbox } from '../../services/user.js';
import { getState } from '../../utils/state.js';
import { optionalAuth } from '../middlewares/auth.js';

export default function KIController(router: Router) {
	const conf = getConfig();
	const upload = multer({ dest: resolve(getState().dataPath, conf.System.Path.Temp)});

	router.route('/karas')
		.post(optionalAuth, async (req: any, res) => {
			if (getConfig().Frontend.Import.LoginNeeded) {
				// Check if logged in
				if (!req.authToken) {
					res.status(401).json();
					return;
				}
				// Check if user has reached limit
				if (!canSubmitInbox(req.authToken.username.toLowerCase())) {
					res.status(403).json();
					return;
				}
			}
			// If login needed check check if kara limit has been reached
			try {
				const url = await createKara(req.body.kara, req.body.contact, req.authToken?.username.toLowerCase());
				res.status(200).json(APIMessage('GENERATED_KARA', url || ''));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.put(optionalAuth, async (req: any, res: any) => {
			// If login needed, raise error if not logged in
			if (!req.authToken && getConfig().Frontend.Import.LoginNeeded) {
				res.status(401).json();
				return;
			}
			try {
				const url = await editKara(req.body, req.body.contact, req.authToken?.username.toLowerCase());
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
