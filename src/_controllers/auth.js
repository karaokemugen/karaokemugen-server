import passport from 'passport';
import {encode, decode} from 'jwt-simple';
import {getConfig} from '../_utils/config';
import {findUserByName, checkPassword} from '../user';

const loginErr = {
	code: 'LOG_ERROR',
	message: 'Incorrect credentials',
	data: {
	}
};

async function checkLogin(username, password) {
	const config = getConfig();	
	if (!await findUserByName(username)) throw false;
	if (!await checkPassword(username, password)) throw false;
	const role = await getRole(username);
	return {
		token: createJwtToken(username, role, config),
		username: username,
		role: role
	};
}


module.exports = function authController(router) {

	const requireAuth = passport.authenticate('jwt', { session: false });

	router.post('/login', async (req, res) => {		
		if (!req.body.password) req.body.password = '';		
		try {
			const token = await checkLogin(req.body.username, req.body.password);
			res.send(token);
		} catch(err) {
			res.status(401).send(loginErr);
		}
	});

	router.get('/checkauth', requireAuth, (req, res) => {
		res.send(decodeJwtToken(req.get('authorization')));
	});
};

function createJwtToken(username, role, config) {
	const conf = config || getConfig();
	const timestamp = new Date().getTime();
	return encode(
		{ username, iat: timestamp, role },
		conf.JwtSecret
	);
}

function decodeJwtToken(token, config) {
	const conf = config || getConfig();
	return decode(token, conf.JwtSecret);
}

async function getRole(username) {
	const user = await findUserByName(username);
	if (+user.flag_admin === 1) return 'admin';
	return 'user';
}
