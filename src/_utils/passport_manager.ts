import { decode } from 'jwt-simple';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import LocalStrategy from 'passport-local';
import { findUserByName, hashPassword } from '../_services/user';
import { getConfig } from './config';

export const requireAuth = passport.authenticate('jwt', { session: false });

export const requireValidUser = (req, res, next) => {
	const token = decode(req.get('authorization'), getConfig().JwtSecret);
	req.authToken = token;
	findUserByName(token.username)
		.then((user) => {
			if (!user) {
				res.status(403).send('User logged in unknown');
			} else {
				next();
			}
		})
		.catch(() => {
			res.status(403).send('User logged in unknown');
		});
};


export const requireAdmin = (req, res, next) => {
	const token = decode(req.get('authorization'), getConfig().JwtSecret);
	if (token.role === 'admin') {
		next();
	} else {
		res.status(403).send('Only admin can use this function');
	}

};

export function configurePassport(conf?: any) {

	const resolvedConf = conf || getConfig();

	const localLogin = localPassportStrategy();
	const jwtLogin = jwtPassportStrategy(resolvedConf);

	passport.use(jwtLogin);
	passport.use(localLogin);
}

function localPassportStrategy() {
	const localOptions = {usernameField: 'username', passwordField: 'password'};
	const strategy = new LocalStrategy(localOptions, (username: string, password: string, done: any) => {
		const hash = hashPassword(password);
		findUserByName(username)
			.then((userdata) => {
				//User not found
				if (!userdata) return done(null, false);
				//User is a guest, no password check needed
				if (userdata.type === 2) return done(null, username);
				//User is not a guest, and password mismatches
				if (hash !== userdata.password) return done(null, false);
				//Everything's daijoubu
				done(null, username);
			})
			.catch(() => done(null, false));
	});
	return strategy;
}


function jwtPassportStrategy(config) {

	const jwtOptions = {
		jwtFromRequest: ExtractJwt.fromHeader('authorization'),
		secretOrKey: config.JwtSecret
	};

	return new Strategy(jwtOptions, function (payload, done) {
		return done(null, payload.username);
	});
}
