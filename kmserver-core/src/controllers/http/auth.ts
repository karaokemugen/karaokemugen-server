import passport from 'passport';
import {encode, decode} from 'jwt-simple';
import { Router } from 'express';

import {getConfig} from '../../lib/utils/config';
import {findUserByName, checkPassword, updateUserLastLogin} from '../../services/user';
import { Token, Role, User } from '../../lib/types/user';
import sentry from '../../utils/sentry';
import logger from '../../lib/utils/logger';

const loginErr = {
	code: 'LOG_ERROR',
	message: 'Incorrect credentials',
	data: undefined
};

async function checkLogin(username: string, password: string): Promise<Token> {
	const user = await findUserByName(username, {password: true});
	if (!user) throw false;
	if (!await checkPassword(user, password)) throw false;
	const role = getRole(user);
	return {
		token: createJwtToken(username, role, user.password_last_modified_at),
		username: username,
		role: role
	};
}


export default function authController(router: Router) {

	const requireAuth = passport.authenticate('jwt', { session: false });

	router.post('/auth/login', async (req, res) => {
		try {
			const token = await checkLogin(req.body.username, req.body.password);
			updateUserLastLogin(req.body.username);
			res.send(token);
		} catch(err) {
			if (err !== false) {
				logger.error(`Failed to login ${req.body.username}`, {service: 'User', obj: err});
				res.status(500);
				sentry.error(err);
			} else res.status(401).send(loginErr);
		}
	});

	router.get('/auth/check', requireAuth, (req, res) => {
		res.send(decodeJwtToken(req.get('authorization')));
	});
}

export function createJwtToken(username: string, role: Role, passwordLastModifiedAt: Date) {
	const conf = getConfig();
	const timestamp = new Date().getTime();
	return encode(
		{ username, iat: timestamp, role, passwordLastModifiedAt },
		conf.App.JwtSecret
	);
}

function decodeJwtToken(token: string) {
	const conf = getConfig();
	return decode(token, conf.App.JwtSecret);
}

export function getRole(user: User) {
	if (user.type === 2) return 'admin';
	return 'user';
}
