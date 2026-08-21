import { Router } from 'express';
import z from 'zod';

import { updateBanSession } from '../../dao/stats.js';
import { APIMessage } from '../../lib/services/frontend.js';
import { check } from '../../lib/utils/validators.js';
import { addPlayed, processStatsPayload} from '../../services/stats.js';
import { optionalAuth, requireAdmin, requireAuth, requireValidUser } from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';

export default function statsController(router: Router) {
	router.post('/stats', async (req, res) => {
		try {
			// Validated downstream
			await processStatsPayload(req.body);
			res.status(200).json('Stats payload accepted');
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.route('/stats/kara/:kid/played')
	.post(validateUUID('kid'), optionalAuth, async (req: any, res) => {
		try {
			await addPlayed(req.params.kid, req.ip, req.authToken);
			res.status(200).json();
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
	router.route('/stats/session/:seid')
	.post(validateUUID('seid'), requireAuth, requireValidUser, requireAdmin, async (req: any, res) => {
		try {
			check(req.body, z.object({
				action: z.coerce.boolean(),
			}));
			await updateBanSession(req.params.seid, req.body.action);
			res.status(200).json();
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	});
}
