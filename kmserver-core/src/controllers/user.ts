import {removeUser, editUser, createUser, findUserByName, getAllUsers, resetPasswordRequest, resetPassword} from '../services/user';
import {check, unescape} from '../lib/utils/validators';
import multer from 'multer';
import {getConfig} from '../lib/utils/config';
import {resolve} from 'path';
import { Router } from 'express';
import { getState } from '../utils/state';
import {requireAuth, requireValidUser, updateLoginTime} from './middlewares/auth';

export default function userController(router: Router) {
	const conf = getConfig();
	// Middleware for playlist and files import
	let upload = multer({ dest: resolve(getState().dataPath,conf.System.Path.Temp)});

	router.route('/users')
		.get(async (_, res) => {
			try {
				const info = await getAllUsers({public: true});
				res.status(200).json(info);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await removeUser(req.authToken.username);
				res.send('User deleted');
			} catch(err) {
				res.status(500).send(err);
			}
		})
		.post(async (req, res) => {
			req.body.login = unescape(req.body.login.trim());
			try {
				await createUser(req.body);
				res.json({code: 'USER_CREATED'});
			} catch(err) {
				res.status(500).json(err.code);
			}
		});
	router.route('/users/:user')
		.get(async (req, res) => {
			try {
				const info = await findUserByName(req.params.user, {public: true});
				res.status(200).json(info);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.put(upload.single('avatarfile'), requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			const validationErrors = check(req.body, {
				nickname: {presence: true}
			});
			if (!validationErrors) {
				// No errors detected
				if (req.body.bio) req.body.bio = unescape(req.body.bio.trim());
				if (req.body.email) req.body.email = unescape(req.body.email.trim());
				if (req.body.url) req.body.url = unescape(req.body.url.trim());
				if (req.body.nickname) req.body.nickname = unescape(req.body.nickname.trim());
				if (req.body.type) req.body.type = +req.body.type;
				//Now we add user
				let avatar: any;
				if (req.file) avatar = req.file;
				try {
					const response = await editUser(req.params.user,req.body,avatar,req.authToken);
					res.json(response);
				} catch(err) {
					res.status(500).json(err);
				}
			} else {
				// Errors detected
				// Sending BAD REQUEST HTTP code and error object.
				res.status(400).json(validationErrors);
			}
		});
	router.route('/users/:user/resetpassword')
		.post(async (req, res) => {
			try {
				const info = await resetPasswordRequest(req.params.user);
				res.status(200).json(info);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/users/:user/resetpassword/:requestCode')
		.get(async (req, res) => {
			try {
				const info = await resetPassword(req.params.user, req.params.requestCode);
				res.status(200).json(info);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/myaccount')
	/**
 * @api {get} /myaccount View own user details
 * @apiName GetMyAccount
 * @apiVersion 3.1.0
 * @apiGroup Users
 * @apiPermission own
 * @apiHeader authorization Auth token received from logging in
 * @apiSuccess {String} data/login User's login
 * @apiSuccess {String} data/nickname User's nickname
 * @apiSuccess {String} [data/avatar_file] Directory and name of avatar image file. Can be empty if no avatar has been selected.
 * @apiSuccess {Number} data/flag_online Is the user an online account ?
 * @apiSuccess {Number} data/type Type of account (`0` = admin, `1` = user, `2` = guest)
 * @apiSuccess {Number} data/last_login_at Last login time in UNIX timestamp.
 * @apiSuccess {Number} data/user_id User's ID in the database
 * @apiSuccess {String} data/url User's URL in its profile
 * @apiSuccess {String} data/fingerprint User's fingerprint
 * @apiSuccess {String} data/bio User's bio
 * @apiSuccess {String} data/email User's email
 * @apiSuccess {Number} data/series_lang_mode Mode (0-4) for series' names display : -1 = Let KM settings decide, 0 = Original/internal name, 1 = Depending on song's language, 2 = Depending on KM's language, 3 = Depending on user browser's language (default), 4 = Force languages with `main_series_lang` and `fallback_series_lang`
 * @apiSuccess {String} data/main_series_lang ISO639-2B code for language to use as main language for series names (in case of mode 4).
 * @apiSuccess {String} data/fallback_series_lang ISO639-2B code for language to use as fallback language for series names (in case of mode 4).
 *
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {
 *   "data": [
 *       {
 *           "avatar_file": "",
 *           "flag_online": false,
 *           "type": 0,
 *           "last_login_at": null,
 *           "login": "admin",
 *           "nickname": "Administrator",
 * 			 "url": null,
 * 			 "email": null,
 * 			 "bio": null,
 * 			 "fingerprint": null,
 * 			 "series_lang_mode": 4,
 * 			 "main_series_lang": "fre",
 * 			 "fallback_series_lang": "eng"
 *       },
 *   ]
 * }
 * @apiError USER_VIEW_ERROR Unable to view user details
 * @apiErrorExample Error-Response:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "code": "USER_VIEW_ERROR",
 * }
 * @apiErrorExample Error-Response:
 * HTTP/1.1 403 Forbidden
 */
		.get(requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			try {
				const userData = await findUserByName(req.authToken.username, {public:false});
				res.json(userData);
			} catch(err) {
				res.status(500).json(err);
			}
		})
	/**
	 * @api {delete} /myaccount Delete your local account
	 * @apiName deleteLocal
	 * @apiVersion 3.1.0
	 * @apiGroup Users
	 * @apiPermission own
	 * @apiHeader authorization Auth token received from logging in
	 * @apiSuccess {String} code Message to display
	 *
	 * @apiSuccessExample Success-Response:
	 * HTTP/1.1 200 OK
	 * {
	 *   "code": "USER_DELETED"
	 * }
	 * @apiError USER_DELETE_ERROR Unable to delete your user
	 * @apiErrorExample Error-Response:
	 * HTTP/1.1 500 Internal Server Error
	 * @apiErrorExample Error-Response:
	 * HTTP/1.1 403 Forbidden
	 */
		.delete(requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			try {
				await removeUser(req.authToken.username);
				res.status(200).json('USER_DELETED');
			} catch(err) {
				res.status(500).json(err);
			}
		})

	/**
 * @api {put} /myaccount Edit your own account
 * @apiName EditMyAccount
 * @apiVersion 3.1.0
 * @apiGroup Users
 * @apiPermission own
 * @apiHeader authorization Auth token received from logging in
 * @apiParam {String} nickname New nickname for user
 * @apiParam {String} [password] New password. Can be empty (password won't be changed then)
 * @apiParam {String} [bio] User's bio info. Can be empty.
 * @apiParam {String} [email] User's mail. Can be empty.
 * @apiParam {String} [url] User's URL. Can be empty.
 * @apiParam {ImageFile} [avatarfile] New avatar
 * @apiParam {Number} [series_lang_mode] Mode (0-4) for series' names display : -1 = Let KM settings decide, 0 = Original/internal name, 1 = Depending on song's language, 2 = Depending on KM's language, 3 = Depending on user browser's language (default), 4 = Force languages with `main_series_lang` and `fallback_series_lang`
 * @apiParam {String} [main_series_lang] ISO639-2B code for language to use as main language for series names (in case of mode 4).
 * @apiParam {String} [fallback_series_lang] ISO639-2B code for language to use as fallback language for series names (in case of mode 4).
 * @apiSuccessExample Success-Response:
 * HTTP/1.1 200 OK
 * {code: "USER_EDITED"}
 * @apiError USER_UPDATE_ERROR Unable to edit user
 * @apiErrorExample Error-Response:
 * HTTP/1.1 500 Internal Server Error
 * @apiErrorExample Error-Response:
 * HTTP/1.1 403 Forbidden
 */
		.put(upload.single('avatarfile'), requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			const validationErrors = check(req.body, {
				nickname: {presence: true}
			});
			if (!validationErrors) {
				// No errors detected
				if (req.body.bio) req.body.bio = unescape(req.body.bio.trim());
				if (req.body.email) req.body.email = unescape(req.body.email.trim());
				if (req.body.url) req.body.url = unescape(req.body.url.trim());
				if (req.body.nickname) req.body.nickname = unescape(req.body.nickname.trim());
				//Now we edit user
				const avatar: Express.Multer.File = req.file || null;
				//Get username
				try {
					const response = await editUser(req.authToken.username, req.body, avatar , req.authToken);
					res.status(200).json({code: 'USER_EDITED', data:{ token: response.token }});
				} catch(err) {
					res.status(500).json(err);
				}
			} else {
				// Errors detected
				// Sending BAD REQUEST HTTP code and error object.
				res.status(400).json(validationErrors);
			}
		});
}
