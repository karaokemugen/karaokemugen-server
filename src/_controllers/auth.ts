import passport from 'passport';
import {encode, decode} from 'jwt-simple';
import {getConfig} from '../_utils/config';
import {findUserByName, checkPassword} from '../_services/user';

const loginErr = {
	code: 'LOG_ERROR',
	message: 'Incorrect credentials',
	data: {}
};

async function checkLogin(username, password) {
	const config = getConfig();
	const user = await findUserByName(username);
	if (!user) throw false;
	if (!checkPassword(user, password)) throw false;
	const role = getRole(user);
	return {
		token: createJwtToken(username, role, config),
		username: username,
		role: role
	};
}


export default function authController(router) {

	const requireAuth = passport.authenticate('jwt', { session: false });

	router.post('/auth/login', async (req, res) => {
		try {
			const token = await checkLogin(req.body.username, req.body.password);
			res.send(token);
		} catch(err) {
			res.status(401).send(loginErr);
		}
	});

	router.get('/auth/check', requireAuth, (req, res) => {
		res.send(decodeJwtToken(req.get('authorization')));
	});
}

function createJwtToken(username, role, config) {
	const conf = config || getConfig();
	const timestamp = new Date().getTime();
	return encode(
		{ username, iat: timestamp, role },
		conf.JwtSecret
	);
}

function decodeJwtToken(token, config?) {
	const conf = config || getConfig();
	return decode(token, conf.JwtSecret);
}

function getRole(user) {
	if (user.type === 2) return 'admin';
	return 'user';
}
