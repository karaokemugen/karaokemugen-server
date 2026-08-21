import { Router } from 'express';
import z from 'zod';

import { APIMessage } from '../../lib/services/frontend.js';
import { check } from '../../lib/utils/validators.js';
import { getTokens, promoteToken, removeToken } from '../../services/remote.js';
import {requireAdmin, requireAuth, requireValidUser, updateLoginTime} from '../middlewares/auth.js';

export default function remoteController(router: Router) {
	router.route('/remote')
		.get(requireAuth, requireValidUser, requireAdmin, updateLoginTime, async (_req: any, res) => {
			try {
				const ret = await getTokens();
				res.status(200).json(ret);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/remote/promote')
		.put(requireAuth, requireValidUser, requireAdmin, updateLoginTime, async (req: any, res) => {
			try {
				check(req.body, z.object({
					token: z.uuidv4(),
					code: z.string(),
				}));
				await promoteToken(req.body.token, req.body.code);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/remote/:token')
		.delete(requireAuth, requireValidUser, requireAdmin, updateLoginTime, async (req: any, res) => {
			try {
				check(req.params, z.object({
					token: z.uuidv4()
				}));
				await removeToken(req.params.token);
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
