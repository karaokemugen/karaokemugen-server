import { Router } from 'express';
import {sign} from 'jsonwebtoken';

import { APIMessage } from '../../lib/services/frontend.js';
import { Roles, TokenResponseWithRoles } from '../../lib/types/user.js';
import {getConfig} from '../../lib/utils/config.js';
import { ErrorKM } from '../../lib/utils/error.js';
import { refreshAnimeList } from '../../services/animeList.js';
import {checkPassword, decodeJwtToken, findUserByName, updateUserLastLogin} from '../../services/user.js';
import { requireAuth, requireValidUser } from '../middlewares/auth.js';

async function checkLogin(username: string, password: string): Promise<TokenResponseWithRoles> {
	const user = await findUserByName(username, {password: true});
	if (!user) throw new ErrorKM('LOG_ERROR', 401);
	if (!await checkPassword(user, password)) throw new ErrorKM('LOG_ERROR', 401);
	return {
		token: createJwtToken(username, user.roles, user.password_last_modified_at),
		username,
		roles: user.roles
	};
}

export default function authController(router: Router) {
	router.post('/auth/login', async (req, res) => {
		try {
			const token = await checkLogin(req.body.username, req.body.password);
			updateUserLastLogin(req.body.username.toLowerCase());
			refreshAnimeList(req.body.username.toLowerCase()).catch();
			res.send(token);
		} catch (err) {
			res.status(err.code || 500).json(APIMessage(err?.message));
		}
	});

	router.get('/auth/check', requireAuth, requireValidUser, (req, res) => {
		res.send(decodeJwtToken(req.get('authorization')));
	});
}

export function createJwtToken(username: string, roles: Roles, passwordLastModifiedAt: Date) {
	const conf = getConfig();
	const timestamp = new Date().getTime();
	return sign(
		{ username, iat: timestamp, roles, passwordLastModifiedAt },
		conf.App.JwtSecret
	);
}
