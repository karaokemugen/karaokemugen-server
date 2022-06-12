import { Router } from 'express';

import { getTokens, promoteToken, removeToken } from '../../services/remote';
import {requireAdmin, requireAuth, requireValidUser, updateLoginTime} from '../middlewares/auth';

export default function remoteController(router: Router) {
	router.route('/remote')
		.get(requireAuth, requireValidUser, requireAdmin, updateLoginTime, async (_req: any, res) => {
			try {
				const ret = await getTokens();
				res.status(200).json(ret);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/remote/:token')
		.delete(requireAuth, requireValidUser, requireAdmin, updateLoginTime, async (req: any, res) => {
			try {
				await removeToken(req.params.token);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/remote/promote')
		.put(requireAuth, requireValidUser, requireAdmin, updateLoginTime, async (req: any, res) => {
			try {
				await promoteToken(req.body.token, req.body.code);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		});
}
