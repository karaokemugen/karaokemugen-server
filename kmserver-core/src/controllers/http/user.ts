import { RequestHandler, Router } from 'express';
import multer from 'multer';
import { resolve } from 'path';
import z from 'zod';

import { APIMessage } from '../../lib/services/frontend.js';
import { getConfig } from '../../lib/utils/config.js';
import { animeListProviders } from '../../lib/utils/constants.js';
import { check, unescape, zRoles, zRolesString } from '../../lib/utils/validators.js';
import { refreshAnimeList } from '../../services/animeList.js';
import { getInbox } from '../../services/inbox.js';
import { addBan, createUser, editUser, findUserByName, getAllUsers, getBans, removeBan, removeUser, resetPassword, resetPasswordRequest, setUserContributorTrustLevel } from '../../services/user.js';
import { BanType, UserOptions } from '../../types/user.js';
import { banType } from '../../utils/constants.js';
import { getState } from '../../utils/state.js';
import { optionalAuth, requireAdmin, requireAuth, requireMaintainer, requireValidUser, updateLoginTime } from '../middlewares/auth.js';

function editHandler(userFromToken: boolean): RequestHandler {
	return async (req: any, res) => {
		// No errors detected
		if (req.body.bio) req.body.bio = unescape(req.body.bio.trim());
		if (req.body.email) req.body.email = unescape(req.body.email.trim());
		if (req.body.url) req.body.url = unescape(req.body.url.trim());
		if (req.body.nickname) req.body.nickname = unescape(req.body.nickname.trim());
		check(req.body, z.object({
			bio: z.string().nullish(),
			email: z.email().nullish(),
			url: z.url().nullish(),
			nickname: z.string().optional(),
			password: z.string().optional(),
			location: z.string().nullish(),
			flag_sendstats: z.coerce.boolean().optional(),
			flag_public: z.coerce.boolean().optional(),
			flag_displayfavorites: z.coerce.boolean().optional(),
			social_networks: z.object({
				mastodon: z.string().optional(),
				instagram: z.string().optional(),
				bluesky: z.string().optional(),
				discord: z.string().optional(),
				twitch: z.string().optional(),
				anilist: z.string().optional(),
				myanimelist: z.string().optional(),
				kitsu: z.coerce.number().int().min(1).optional(),
				gitlab: z.string().optional(),
			}).loose().nullish(),
			language: z.string().optional(),
			anime_list_to_fetch: z.enum(animeListProviders).nullish(),
			flag_parentsonly: z.coerce.boolean().optional(),
			flag_contributor_emails: z.coerce.boolean().optional(),
			roles: zRoles.optional(),
		}))
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
			res.status(err.code || 500).json(APIMessage(err.message));
		}
	};
}

export default function userController(router: Router) {
	const conf = getConfig();
	// Middleware for playlist and files import
	const upload = multer({ dest: resolve(getState().dataPath, conf.System.Path.Temp) });
	const uploadMiddleware = upload.fields([{ name: 'avatarfile', maxCount: 1 }, { name: 'bannerfile', maxCount: 1 }]);

	router.route('/bans')
		.get(requireAuth, requireValidUser, requireAdmin, async (req, res) => {
			try {
				check(req.query, z.object({
					type: z.enum(banType).optional(),
				}));
				const info = await getBans(req.query.type as BanType);
				res.status(200).json(info);
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, requireAdmin, async (req, res) => {
			try {
				check(req.body, z.object({
					type: z.enum(banType),
					value: z.string(),
				}));
				await removeBan(req.body);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.post(requireAuth, requireValidUser, requireAdmin, async (req, res) => {
			try {
				check(req.body, z.object({
					type: z.enum(banType),
					value: z.string(),
					reason: z.string().optional(),
					banned_at: z.iso.datetime({ offset: true }).optional()
				}));
				await addBan(req.body);
				res.status(200).json();
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/users')
		.get(optionalAuth, async (req: any, res) => {
			try {
				const schema = z.object({
					filter: z.string().optional(),
					from: z.coerce.number().optional(),
					size: z.coerce.number().optional(),
					roles: zRolesString.optional(),
				});
				check(req.query, schema);
				// We need to turn the roles string into an object with true/false.
				// FIXME : change the roles type to string and move this to where it's needed (DAO)
				let roles = {};
				if (req.query.roles) {
					roles = req.query.roles.split(',')
						.map((s: string) => s.trim())
						.filter(Boolean) // cut empty items if any
						.reduce((roles: any, token: string) => {
							const hasMinus = token[0] === '-';
							// In case there is no + at all, we treat it as true
							const key = /[+-]/.test(token[0]) ? token.slice(1) : token;
							roles[key] = !hasMinus;
							return roles;
						}, {});
				}
					
				const info = await getAllUsers({
					publicOnly: !req.authToken?.roles?.admin,
					roles,
					filter: req.query.filter as string,
					from: +req.query.from,
					size: +req.query.size
				});
				res.status(200).json(info);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removeUser(req.authToken.username);
				res.send(APIMessage('USER_DELETED'));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.post(async (req, res) => {
			if(req.body.login) req.body.login = unescape(req.body.login.trim());

			try {
				// Login must not include @
				check(req.body, z.object({
					login: z.string().refine((val) => !val.includes('@')),
				}));
				await createUser(req.body);
				res.json(APIMessage('USER_CREATED'));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
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
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.patch(uploadMiddleware, requireAuth, requireValidUser, updateLoginTime, editHandler(false))
		.delete(requireAuth, requireValidUser, requireAdmin, async (req: any, res) => {
			try {
				await removeUser(req.params.user);
				res.send(APIMessage('USER_DELETED'));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
	router.route('/users/:user/resetpassword')
		.post(async (req, res) => {
			try {
				const info = await resetPasswordRequest(req.params.user.toLowerCase().trim());
				res.status(200).json(info);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/users/:user/resetpasswordaction')
		.post(async (req, res) => {
			try {
				check(req.body, z.object({
					requestCode: z.string(),
					newPassword: z.string(),
				}));
				await resetPassword(req.params.user, req.body.requestCode, req.body.newPassword);
				res.status(200).json(APIMessage('PASSWORD_UPDATED'));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/users/:user/contributortrustlevel')
		.put(requireAuth, requireValidUser, requireMaintainer, async (req, res) => {
			try {
				check(req.body, z.object({
					level: z.coerce.number().int(),
				}));
				await setUserContributorTrustLevel(req.params.user, req.body.level);
				res.status(200).json(APIMessage('CONTRIBUTOR_TRUST_LEVEL_UPDATED'));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});

	router.route('/myaccount')
		.get(requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			try {
				const userData = await findUserByName(req.authToken.username, { public: false, contact: true });
				res.json(userData);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, updateLoginTime, async (req: any, res: any) => {
			try {
				await removeUser(req.authToken.username);
				res.status(200).json(APIMessage('USER_DELETED'));
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.patch(uploadMiddleware, requireAuth, requireValidUser, updateLoginTime, editHandler(true));
	router.route('/myaccount/myanime')
		.post(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				await refreshAnimeList(req.authToken.username.toLowerCase());
				res.status(200).json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/myaccount/inbox/submitted')
		.post(requireAuth, requireValidUser, updateLoginTime, async (req: any, res) => {
			try {
				const submissionInfo = await getInbox(false, req.authToken.username.toLowerCase());
				res.status(200).json(submissionInfo);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
