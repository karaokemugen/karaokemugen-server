import { Router } from 'express';
import { RequestHandler } from 'express-serve-static-core';
import multer from 'multer';
import { resolve } from 'path';

import { APIMessage } from '../../lib/services/frontend';
import { getConfig } from '../../lib/utils/config';
import { unescape } from '../../lib/utils/validators';
import { refreshAnimeList } from '../../services/animeList';
import { createUser, editUser, findUserByName, getAllUsers, removeUser, resetPassword, resetPasswordRequest } from '../../services/user';
import { UserOptions } from '../../types/user';
import { getState } from '../../utils/state';
import { optionalAuth, requireAuth, requireValidUser, updateLoginTime } from '../middlewares/auth';

function editHandler(userFromToken: boolean): RequestHandler {
	return async (req: any, res) => {
		// No errors detected
		if (req.body.bio) req.body.bio = unescape(req.body.bio.trim());
		if (req.body.email) req.body.email = unescape(req.body.email.trim());
		if (req.body.url) req.body.url = unescape(req.body.url.trim());
		if (req.body.nickname) req.body.nickname = unescape(req.body.nickname.trim());
		// if (req.body.flag_sendstats) req.body.flag_sendstats = req.body.flag_sendstats === 'true';
		// Now we add user
		let avatar: Express.Multer.File;
		if (req.files?.avatarfile) avatar = req.files.avatarfile[0];
		let banner: Express.Multer.File;
		if (req.files?.bannerfile) banner = req.files.bannerfile[0];
		try {
			const response = await editUser(
				userFromToken ? req.authToken.username : req.params.user,
				req.body,
				avatar,
				req.authToken,
				banner
			);
			res.status(200).json(userFromToken ? { code: 'USER_EDITED', data: { token: response.token } } : response);
		} catch (err) {
			res.status(500).json(err);
		}
	};
}

export default function userController(router: Router) {
	const conf = getConfig();
	// Middleware for playlist and files import
	const upload = multer({ dest: resolve(getState().dataPath, conf.System.Path.Temp) });
	const uploadMiddleware = upload.fields([{ name: 'avatarfile', maxCount: 1 }, { name: 'bannerfile', maxCount: 1 }]);

	router.route('/users')
		.get(async (req, res) => {
			try {
				const info = await getAllUsers({
					public: true,
					filter: req.query.filter as string,
					from: +req.query.from,
					size: +req.query.size
				});
				res.status(200).json(info);
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await removeUser(req.authToken.username);
				res.send(APIMessage('USER_DELETED'));
			} catch (err) {
				res.status(500).send(err);
			}
		})
		.post(async (req, res) => {
			req.body.login = unescape(req.body.login.trim());
			try {
				await createUser(req.body);
				res.json(APIMessage('USER_CREATED'));
			} catch (err) {
				res.status(500).json(err.code);
			}
		});
	router.route('/users/:user')
		.get(optionalAuth, async (req: any, res) => {
			try {
				const params: UserOptions = { public: true };
				if (req.authToken && req.query.forcePublic
					&& (req.authToken.roles?.admin || req.authToken.roles?.maintainer)) {
					params.contact = true;
					params.public = false;
				}
				const info = await findUserByName(req.params.user, params);
				if (!info) res.status(404).end();
				else res.status(200).json(info);
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.patch(uploadMiddleware, requireAuth, requireValidUser, updateLoginTime, editHandler(false));
	router.route('/users/:user/resetpassword')
		.post(async (req, res) => {
			try {
				const info = await resetPasswordRequest(req.params.user);
				res.status(200).json(info);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/users/:user/resetpasswordaction')
		.post(async (req, res) => {
			try {
				await resetPassword(req.params.user, req.body.requestCode, req.body.newPassword);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/myaccount')
		.get(requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			try {
				const userData = await findUserByName(req.authToken.username, { public: false, contact: true });
				res.json(userData);
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			try {
				await removeUser(req.authToken.username);
				res.status(200).json(APIMessage('USER_DELETED'));
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.patch(uploadMiddleware, requireAuth, requireValidUser, updateLoginTime, editHandler(true));
	router.route('/myaccount/myanime')
		.post(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await refreshAnimeList(req.authToken.username.toLowerCase());
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		});
}
