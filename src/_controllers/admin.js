import {requireAuth, requireValidUser, requireAdmin} from '../_utils/passport_manager.js';
import { run as generate } from '../_dao/generation';

export default async function adminController(router) {
	/*
	router.get('/config', requireAuth, requireValidUser, requireAdmin, (req, res) => {
		res.json(getConfig());
	});
	*/
	router.post('/generate', requireAuth, requireValidUser, requireAdmin, async (req, res) => {
		generate();
		res.status(200).send('Generation triggered');
	});

}
