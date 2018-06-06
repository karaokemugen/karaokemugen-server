import passport from 'passport';
import {decode} from 'jwt-simple';
import {getConfig} from './config';
import {hashPassword, findUserByName} from '../user';
import {ExtractJwt, Strategy} from 'passport-jwt';
import LocalStrategy from 'passport-local';

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

export function configurePassport(conf) {

	const resolvedConf = conf || getConfig();

	const localLogin = localPassportStrategy(resolvedConf);
	const jwtLogin = jwtPassportStrategy(resolvedConf);

	passport.use(jwtLogin);
	passport.use(localLogin);
}

function localPassportStrategy() {
	const localOptions = {usernameField: 'username', passwordField: 'password'};

	return new LocalStrategy(localOptions, function (username, password, done) {
		const hash = hashPassword(password);
		findUserByName(username)
			.then((userdata) => {
				//User not found
				if (!userdata) return done(null, false);
				//User is not a guest, and password mismatches
				if (hash !== userdata.password) return done(null, false);
				//Everything's daijoubu
				done(null, username); 
			}) 
			.catch(() => done(null, false)); 
	}); 
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

