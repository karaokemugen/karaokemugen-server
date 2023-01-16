import { Router } from 'express';
import {sign} from 'jsonwebtoken';

import { Roles, TokenResponseWithRoles } from '../../lib/types/user';
import {getConfig} from '../../lib/utils/config';
import logger from '../../lib/utils/logger';
import { refreshAnimeList } from '../../services/animeList';
import {checkPassword, decodeJwtToken, findUserByName, updateUserLastLogin} from '../../services/user';
import sentry from '../../utils/sentry';
import { requireAuth, requireValidUser } from '../middlewares/auth';

const loginErr = {
	code: 'LOG_ERROR',
	message: 'Incorrect credentials',
	data: undefined
};

const loginNoUser = {
	code: 'LOG_ERROR',
	message: 'No user provided',
	data: undefined
};

async function checkLogin(username: string, password: string): Promise<TokenResponseWithRoles> {
	const user = await findUserByName(username, {password: true});
	if (!user) throw false;
	if (!await checkPassword(user, password)) throw false;
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
			if (err === 'No user provided') {
				res.status(400).send(loginNoUser);
			} else if (err !== false) {
				logger.error(`Failed to login ${req.body.username}`, {service: 'User', obj: err});
				res.status(500);
				sentry.error(err);
			} else {
				res.status(401).send(loginErr);
			}
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
