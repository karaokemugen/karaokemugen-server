import {decodeJwtToken, findUserByName, updateUserLastLogin} from '../../services/user';

export const requireAuth = (req: any, res: any, next: any) => {
	if (req.get('authorization')) {
		next();
	} else {
		res.status(401).json();
	}
};

export const requireValidUser = (req, res, next) => {
	const token = decodeJwtToken(req.get('authorization'));
	req.authToken = token;
	if (token) {
		findUserByName(token.username, {password: true})
			.then((user) => {
				if (!user) {
					res.status(403).json('User logged in unknown');
				} else {
					const tokenDate = new Date(token.passwordLastModifiedAt);
					if (tokenDate.toJSON() !== user.password_last_modified_at.toJSON()) {
						res.status(403).json('Token has expired');
					} else {
						next();
					}
				}
			})
			.catch(() => {
				res.status(403).json('User logged in unknown');
			});
	} else {
		res.status(403).json('Malformed token');
	}
};

export const optionalAuth = (req, res, next) => {
	if (req.get('authorization')) {
		requireValidUser(req, res, next);
	} else {
		// No Auth, continue.
		next();
	}
};


export const requireAdmin = (req, res, next) => {
	const token = decodeJwtToken(req.get('authorization'));
	if (token && token.role === 'admin') {
		next();
	} else {
		res.status(403).send('Only admins can use this function');
	}

};

export async function updateLoginTime(req, _res, next) {
	updateUserLastLogin(req.authToken.username.toLowerCase());
	next();
}
