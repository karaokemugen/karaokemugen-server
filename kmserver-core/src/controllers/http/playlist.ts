import { Router } from 'express';

import { APIMessage } from '../../lib/services/frontend.js';
import { addContributorToPlaylist, addKaraToPlaylist, addPlaylistToFavorites, createPlaylist, editPlaylist, editPLC, emptyPlaylist, exportPlaylist, getPlaylistContents, getPlaylists, importPlaylist, removeContributorToPlaylist, removeKaraFromPlaylist, removePlaylist, removePlaylistFromFavorites, shufflePlaylist } from '../../services/playlist.js';
import { optionalAuth, requireAuth, requireValidUser } from '../middlewares/auth.js';
import { getLang } from '../middlewares/lang.js';

export default function PLController(router: Router) {
	router.route('/playlist')
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				const pl = await createPlaylist(req.body, req.authToken);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.get(optionalAuth, async (req: any, res) => {
			try {
				const pls = await getPlaylists(
					{
						plaid: req.query.plaid,
						slug: req.query.slug,
						containsKID: req.query.containsKID,
						byUsername: req.query.byUsername,
						includeUserAsContributor: Boolean(req.query.includeUserAsContributor),
						filter: req.query.filter,
						order: req.query.order,
						favorites: req.query.favorites,
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
				await removeKaraFromPlaylist(req.body.plcids, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/content/edit')
		.put(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await editPLC(req.body.plcids, req.body.plcParams, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/export')
		.get(optionalAuth, getLang, async (req: any, res) => {
			try {
				const pl = await exportPlaylist(req.params.plaid, req.authToken);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/shuffle')
		.get(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await shufflePlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/empty')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await emptyPlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/favorite')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await addPlaylistToFavorites(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await removePlaylistFromFavorites(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/import')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				const ret = await importPlaylist(req.body.pl, req.authToken);
				res.json(ret);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(optionalAuth, getLang, async (req: any, res) => {
			try {
				const pl = await getPlaylistContents(req.params.plaid, req.authToken, req.query.filter, req.lang, +req.query.from, +req.query.size);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removePlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.put(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				const pl = await editPlaylist(req.params.plaid, req.body, req.authToken);
				res.json(pl);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addKaraToPlaylist(req.body.kids, req.params.plaid, req.authToken, req.body.pos);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/contributor/:username')
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removeContributorToPlaylist(req.params.plaid, req.params.username, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addContributorToPlaylist(req.params.plaid, req.params.username, req.authToken);
				res.json();
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
