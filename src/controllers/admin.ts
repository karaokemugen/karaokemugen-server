import {requireAuth, requireValidUser, requireAdmin} from './middlewares/auth';
import { generateDatabase } from '../lib/services/generation';
import { Router } from 'express';
import { createImagePreviews } from '../lib/utils/previews';
import { getAllKaras } from '../services/kara';

export default async function adminController(router: Router) {
	router.post('/generate', requireAuth, requireValidUser, requireAdmin, async (_, res) => {
		generateDatabase()
			.then(() => {
				getAllKaras()
			.then(karas => {
				createImagePreviews(karas);
			})
		});
		res.status(200).send('Generation triggered');
	});

}
