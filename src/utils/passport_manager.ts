import { decode } from 'jwt-simple';
import passport from 'passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import LocalStrategy from 'passport-local';
import { findUserByName, hashPassword } from '../services/user';
import { getConfig } from '../lib/utils/config';

export const requireAuth = passport.authenticate('jwt', { session: false });

export const requireValidUser = (req, res, next) => {
	const token = decode(req.get('authorization'), getConfig().App.JwtSecret);
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
	const token = decode(req.get('authorization'), getConfig().App.JwtSecret);
	if (token.role === 'admin') {
		next();
	} else {
		res.status(403).send('Only admin can use this function');
	}

};

export function configurePassport() {

	const localLogin = localPassportStrategy();
	const jwtLogin = jwtPassportStrategy();

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


function jwtPassportStrategy() {

	const jwtOptions = {
		jwtFromRequest: ExtractJwt.fromHeader('authorization'),
		secretOrKey: getConfig().App.JwtSecret
	};

	return new Strategy(jwtOptions, function (payload, done) {
		return done(null, payload.username);
	});
}
