import {requireAuth, requireValidUser, requireAdmin} from './middlewares/auth';
import { Router } from 'express';
import { generate } from '../services/kara';

export default async function adminController(router: Router) {
	router.post('/generate', requireAuth, requireValidUser, requireAdmin, async (_, res) => {
		generate();
		res.status(200).send('Generation triggered');
	});
}
