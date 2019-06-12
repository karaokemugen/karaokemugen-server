import {requireAuth, requireValidUser, requireAdmin} from '../utils/passport_manager';
import { generateDatabase } from '../lib/services/generation';
import { Router } from 'express';

export default async function adminController(router: Router) {
	router.post('/generate', requireAuth, requireValidUser, requireAdmin, async (_, res) => {
		generateDatabase();
		res.status(200).send('Generation triggered');
	});

}
