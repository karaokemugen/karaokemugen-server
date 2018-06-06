import {getConfig} from '../_utils/config';
import {requireAuth, requireValidUser, requireAdmin} from '../_utils/passport_manager.js';

module.exports = function adminController(router) {

	router.get('/config', requireAuth, requireValidUser, requireAdmin, (req, res) => {
		res.json(getConfig());
	});

};
