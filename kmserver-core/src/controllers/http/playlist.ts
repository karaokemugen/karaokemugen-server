import { Router } from 'express';
import z from 'zod';

import { APIMessage } from '../../lib/services/frontend.js';
import { plOrderParam } from '../../lib/utils/constants.js';
import { check } from '../../lib/utils/validators.js';
import { addContributorToPlaylist, addKaraToPlaylist, addPlaylistToFavorites, createPlaylist, editPlaylist, editPLC, emptyPlaylist, exportPlaylist, getPlaylistContents, getPlaylists, importPlaylist, removeContributorToPlaylist, removeKaraFromPlaylist, removePlaylist, removePlaylistFromFavorites, shufflePlaylist } from '../../services/playlist.js';
import { optionalAuth, requireAuth, requireValidUser } from '../middlewares/auth.js';
import { getLang } from '../middlewares/lang.js';
import { validateUUID } from '../middlewares/validation.js';

export default function PLController(router: Router) {
	router.route('/playlist')
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				check(req.body, z.object({
					plaid: z.uuidv4().optional(),
					created_at: z.iso.datetime({ offset: true }).optional(),
					modified_at: z.iso.datetime({ offset: true }).optional(),
					name: z.string(),
					description: z.string().nullish(),
					flag_visible: z.coerce.boolean().optional(),
					flag_visible_online: z.coerce.boolean().optional(),
				}));
				const pl = await createPlaylist(req.body, req.authToken);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.get(optionalAuth, async (req: any, res) => {
			try {
				check(req.query, z.object({
					plaid: z.uuidv4().optional(),
					slug: z.string().optional(),
					containsKID: z.uuidv4().optional(),
					byUsername: z.string().optional(),
					includeUserAsContributor: z.coerce.boolean().optional(),
					filter: z.string().optional(),
					order: z.enum(plOrderParam).optional(),
					reverseOrder: z.coerce.boolean().optional(),
					favorites: z.string().optional(),
				}));
				const pls = await getPlaylists(
					{
						...req.query,
						byUsername: req.query.byUsername?.toLowerCase(),
						includeUserAsContributor: Boolean(req.query.includeUserAsContributor),
						reverseOrder: Boolean(req.query.reverseOrder),
					},
					req.authToken
				);
				res.json(pls);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/content/delete')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				check(req.body, z.object({
					plcids: z.array(z.number().int().min(1))
				}));
				await removeKaraFromPlaylist(req.body.plcids, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/content/edit')
		.put(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				check(req.body, z.object({
					plcids: z.array(z.number().int().min(1)),
					plcParams: z.object({
						flag_free: z.coerce.boolean().optional(),
						flag_visible: z.coerce.boolean().optional(),
						flag_accepted: z.coerce.boolean().optional(),
						flag_refused: z.coerce.boolean().optional(),
						flag_playing: z.coerce.boolean().optional(),
						flat_online: z.coerce.boolean().optional(),
						flag_visible_online: z.coerce.boolean().optional(),
						type_smart: z.coerce.boolean().optional(),
						pos: z.coerce.number().int().optional(),
						criterias: z.array(z.object({
							type: z.coerce.number().int(),
							value: z.any(),
							plaid: z.uuidv4().optional(),
							value_i18n: z.string().optional(),
						})).optional()
					})
				}));
				await editPLC(req.body.plcids, req.body.plcParams, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/import')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				// Playlist constraints are checked downstream
				const ret = await importPlaylist(req.body.pl, req.authToken);
				res.json(ret);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid/export')
		.get(validateUUID('plaid'), optionalAuth, getLang, async (req: any, res) => {
			try {
				const pl = await exportPlaylist(req.params.plaid, req.authToken);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid/shuffle')
		.get(validateUUID('plaid'), requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await shufflePlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid/empty')
		.post(validateUUID('plaid'), requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await emptyPlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid/favorite')
		.post(validateUUID('plaid'), requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await addPlaylistToFavorites(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(validateUUID('plaid'), requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await removePlaylistFromFavorites(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid')
		.get(validateUUID('plaid'), optionalAuth, getLang, async (req: any, res) => {
			try {
				check(req.query, z.object({
					filter: z.string().optional(),
					from: z.coerce.number().int().min(0).optional(),
					size: z.coerce.number().int().min(1).optional(),
				}));
				const pl = await getPlaylistContents(req.params.plaid, req.authToken, req.query.filter, req.lang, +req.query.from, +req.query.size);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(validateUUID('plaid'), requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removePlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.put(validateUUID('plaid'), requireAuth, requireValidUser, async (req: any, res) => {
			try {
				check(req.body, z.object({
					name: z.string().optional(),
					description: z.string().nullish(),
					flag_visible: z.coerce.boolean().optional(),
					flag_visible_online: z.coerce.boolean().optional(),
				}));
				const pl = await editPlaylist(req.params.plaid, req.body, req.authToken);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.post(validateUUID('plaid'), requireAuth, requireValidUser, async (req: any, res) => {
			try {
				check(req.body, z.object({
					kids: z.array(z.uuidv4()),
					pos: z.coerce.number().int().optional(),
					description: z.string().optional(),
					flag_visible: z.coerce.boolean().optional(),
					flag_visible_online: z.coerce.boolean().optional(),
				}));
				await addKaraToPlaylist(req.body.kids, req.params.plaid, req.authToken, req.body.pos);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid/contributor/:username')
		.delete(validateUUID('plaid'), requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removeContributorToPlaylist(req.params.plaid, req.params.username, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.post(validateUUID('plaid'), requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addContributorToPlaylist(req.params.plaid, req.params.username, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
