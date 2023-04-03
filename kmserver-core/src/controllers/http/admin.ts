import { Router } from 'express';

import { generate, updateRepo } from '../../services/kara.js';
import { getPublicConfig } from '../../utils/config.js';
import {requireAdmin, requireAuth, requireValidUser} from '../middlewares/auth.js';

export default async function adminController(router: Router) {
	router.post('/generate', requireAuth, requireValidUser, requireAdmin, async (_, res) => {
		generate();
		res.status(200).send('Generation triggered');
	});
	router.post('/update', requireAuth, requireValidUser, requireAdmin, async (_, res) => {
		updateRepo();
		res.status(200).send('Generation triggered');
	});
	router.get('/config', async (_, res) => {
		res.status(200).json(getPublicConfig());
	});
}
