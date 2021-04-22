import { Router } from 'express';
import { addContributorToPlaylist, addKaraToPlaylist, createPlaylist, editPlaylist, editPLC, exportPlaylist, getPlaylistContents, getPlaylists, importPlaylist, removeContributorToPlaylist, removeKaraFromPlaylist, removePlaylist } from '../../services/playlist';
import { optionalAuth, requireAuth, requireValidUser } from '../middlewares/auth';
import { getLang } from '../middlewares/lang';

export default function PLController(router: Router) {
	router.route('/playlist')
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await createPlaylist(req.body, req.authToken.username);
				res.json();
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		})
		.get(optionalAuth, async (req: any, res) => {
			try {
				// Forceur
				req.body.public = true;
				const pls = await getPlaylists(req.body, req.authToken);
				res.json(pls);
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/playlist/content/delete')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await removeKaraFromPlaylist(req.body.plcids, req.authToken);
				res.json();
			} catch(err) {
				console.log(err);
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/playlist/content/edit')
		.put(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				await editPLC(req.body.plcids, req.body.plcParams, req.authToken);
				res.json();
			} catch(err) {
				console.log(err);
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/export')
		.get(optionalAuth, getLang, async (req: any, res) => {
			try {
				const pl = await exportPlaylist(req.params.plaid, req.authToken);
				res.json(pl);
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/playlist/import')
		.post(requireAuth, requireValidUser, getLang, async (req: any, res) => {
			try {
				const ret = await importPlaylist(req.body.pl, req.body.replace, req.authToken);
				res.json(ret);
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(optionalAuth, getLang, async (req: any, res) => {
			try {
				const pl = await getPlaylistContents(req.params.plaid, req.authToken, req.query.filter, req.lang, req.query.from, req.query.size);
				res.json(pl);
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		})
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removePlaylist(req.params.plaid, req.authToken);
				res.json();
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		})
		.put(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await editPlaylist(req.params.plaid, req.body, req.authToken);
				res.json();
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		})
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addKaraToPlaylist(req.body.kids, req.params.plaid, req.authToken);
				res.json();
			} catch(err) {
				console.log(err);
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/playlist/:plaid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/contributor/:username')
		.delete(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await removeContributorToPlaylist(req.params.plaid, req.params.username, req.authToken);
				res.json();
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		})
		.post(requireAuth, requireValidUser, async (req: any, res) => {
			try {
				await addContributorToPlaylist(req.params.plaid, req.params.username, req.authToken);
				res.json();
			} catch(err) {
				res.status(err.code || 500).json(err);
			}
		});
}