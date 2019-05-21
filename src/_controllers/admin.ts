import {requireAuth, requireValidUser, requireAdmin} from '../_utils/passport_manager';
import { run as generate } from '../_dao/generation';

export default async function adminController(router) {
	router.post('/generate', requireAuth, requireValidUser, requireAdmin, async (_, res) => {
		generate();
		res.status(200).send('Generation triggered');
	});

}