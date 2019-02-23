import {removeUser, editUser, createUser, findUserByName, getAllUsers} from '../_services/user';
import {check, unescape} from '../_utils/validators';
import multer from 'multer';
import {getConfig} from '../_utils/config';
import {resolve} from 'path';
import { requireAuth, requireValidUser } from '../_utils/passport_manager';

export default function userController(router) {
	const conf = getConfig();
	// Middleware for playlist and files import
	let upload = multer({ dest: resolve(conf.appPath,conf.Path.Temp)});

	router.route('/users')
		.get(async (req, res) => {
			try {
				const info = await getAllUsers({public: true});
				res.status(200).json(info);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, async (req, res) => {
			try {
				console.log(res.authToken);
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
				res.json('USER_CREATED');
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
		.put(upload.single('avatarfile'), requireAuth, requireValidUser,  async (req, res) => {
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
				let avatar;
				if (req.file) avatar = req.file;
				try {
					await editUser(req.params.user,req.body,avatar,req.authToken);
					res.json('USER_UPDATED');
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