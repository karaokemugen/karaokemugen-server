import { logger } from '@sentry/node';
import { Router } from 'express';
import multer from 'multer';
import {resolve} from 'path';
import z from 'zod';

import { karaConstraintsV4 } from '../../lib/dao/karafile.js';
import { tagConstraintsV1 } from '../../lib/dao/tagfile.js';
import { APIMessage } from '../../lib/services/frontend.js';
import { processUploadedMedia } from '../../lib/services/karaCreation.js';
import {getConfig} from '../../lib/utils/config.js';
import { check, zFilename } from '../../lib/utils/validators.js';
import {createKara, editKara} from '../../services/karaImport.js';
import { addTag } from '../../services/tag.js';
import { getState } from '../../utils/state.js';
import { optionalAuth } from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';

const service = 'KIController';

export default function KIController(router: Router) {
	const conf = getConfig();
	const upload = multer({ 
		dest: resolve(getState().dataPath, conf.System.Path.Temp),
		limits: { fileSize: 1024 * 1024 * 1024 * 2, files: 1  } // 2 GB
	});
	
	const requireImportLogin = (req: any, res: any, next: any) => {
		if (!req.authToken?.username && getConfig().Frontend.Import.LoginNeeded) {
			res.status(401).json(APIMessage('LOGIN_NEEDED'));
			return;
		}
		next();
	};

	router.route('/karas')
		.post(optionalAuth, async (req: any, res: any) => {
		try {
			check(req.body, z.object({
				kara: karaConstraintsV4,
				contact: z.string(),
			}));
			const url = await createKara(req.body.kara, req.body.contact, req.authToken?.username.toLowerCase());
			res.status(200).json(APIMessage('GENERATED_KARA', url || ''));
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	
	router.post('/karas/importMedia', optionalAuth, requireImportLogin, upload.single('file'), async (req, res) => {
		try {
			if (req.file) {
				check(req.file, z.object({
					filename: z.string(),
					originalname: z.union([zFilename('video'), zFilename('audio')]),
				}).loose());
				const mediaInfo = await processUploadedMedia(req.file.filename, req.file.originalname);
				res.json(mediaInfo);
			} else {
				res.status(400).json(APIMessage('MISSING_FILE'));
			}
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.post('/karas/importSub', optionalAuth, requireImportLogin, upload.single('file'), async (req, res) => {
		try {
			if (req.file) {
				check(req.file, z.object({
					filename: z.string(),
					originalname: z.union([zFilename('lyrics')]),
				}).loose());
				res.json(req.file.filename);
			} else {
				res.status(400).json(APIMessage('MISSING_FILE'));
			}
		} catch (err) {
			logger.error(`Error when uploading file: ${err}`, { service });
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.post('/tags/createStaging', optionalAuth, requireImportLogin, async (req, res) => {
		try {
			check(req.body, tagConstraintsV1);
			await addTag(req.body, {forceRepo: 'Staging'});
			res.status(200).json();
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.route('/karas/:kid')
		.put(validateUUID('kid'), optionalAuth, async (req: any, res: any) => {
		try {
			check(req.body, z.object({
				kara: karaConstraintsV4,
				modifiedLyrics: z.coerce.boolean(),
				modifiedMedia: z.coerce.boolean(),
				contact: z.string(),
				inid: z.uuidv4().optional(),
			}));
			const url = await editKara(req.body, req.body.contact, req.authToken?.username.toLowerCase(), req.body.inid);
			res.status(200).json(APIMessage('EDITED_KARA', url || ''));
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
}
