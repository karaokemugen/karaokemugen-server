import { getConfig } from '../../lib/utils/config';
import { decode } from 'jwt-simple';
import passport from 'passport';
import { findUserByName } from '../../services/user';


export const requireAuth = passport.authenticate('jwt', { session: false });

export const optionalAuth = (req, res, next) => {
	if (req.get('authorization')) {
		const token = decode(req.get('authorization'), getConfig().App.JwtSecret);
		req.authToken = token;
		findUserByName(token.username)
			.then((user) => {
				if (!user) {
					res.status(403).send('User logged in unknown');
				} else {
					if (token.passwordLastModifiedAt !== user.password_last_modified_at.toISOString()) {
						res.status(403).send('Token has expired');
					} else {
						next();
					}
				}
			})
			.catch(() => {
				res.status(403).send('User logged in unknown');
			});
	} else {
		// No Auth, continue.
		next();
	}
};

export const requireValidUser = (req, res, next) => {
	const token = decode(req.get('authorization'), getConfig().App.JwtSecret);
	req.authToken = token;
	findUserByName(token.username)
		.then((user) => {
			if (!user) {
				res.status(403).send('User logged in unknown');
			} else {
				const tokenDate = new Date(token.passwordLastModifiedAt);
				if (tokenDate.toJSON() !== user.password_last_modified_at.toJSON()) {
					res.status(403).send('Token has expired');
				} else {
					next();
				}
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
		res.status(403).send('Only admins can use this function');
	}

};
