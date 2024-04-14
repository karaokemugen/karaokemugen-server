import { Router } from 'express';

import {getSettings} from '../../lib/dao/database.js';
import { APIMessage } from '../../lib/services/frontend.js';
import { RepositoryManifest } from '../../lib/types/repo.js';
import {getConfig} from '../../lib/utils/config.js';
import { getGitDiff, getLatestGitCommit } from '../../services/git.js';
import { createKaraIssue, createSuggestionIssue } from '../../services/gitlab.js';
import {getAllKaras, getAllMedias, getAllYears, getBaseStats, getHardsubsCache, getKara} from '../../services/kara.js';
import {getTag, getTags} from '../../services/tag.js';
import { optionalAuth } from '../middlewares/auth.js';

export default function KSController(router: Router) {
	router.route('/karas/lastUpdate')
		.get(async (_, res) => {
			try {
				const settings: any = await getSettings();
				res.send(settings.lastGeneration);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/stats')
		.get(async (_, res) => {
			try {
				res.json(await getBaseStats());
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/search')
		.get(optionalAuth, async (req: any, res) => {
			try {
				const karas = await getAllKaras({
					filter: req.query.filter,
					from: req.query.from,
					size: req.query.size,
					q: req.query.q,
					username: req.authToken?.username,
					order: req.query.order,
					random: req.query.random,
					favorites: req.query.favorites,
					safeOnly: req.query.safeOnly,
					userAnimeList: req.query.userAnimeList,
					forPlayer: req.query.forPlayer,
					ignoreCollections : req.query.ignoreCollections,
					forceCollections: req.query.collections?.split(',')
				}, req.authToken, req.query.includeStaging);
				res.json(karas);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(optionalAuth, async (req: any, res) => {
			try {
				const kara = await getKara({
					q: `k:${req.params.kid}`,
					ignoreCollections: true
				}, req?.authToken);
				res.json(kara);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	// Hardsubs helper route
	// This is to simplify queries to get hardsubs simply by their KIDs
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/hardsub')
		.get((req, res) => {
			const hardsubbedMediafile = getHardsubsCache().get(req.params.kid);
			hardsubbedMediafile
				? res.redirect(301, `/hardsubs/${hardsubbedMediafile}`)
				: res.status(404).send();
	});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/problem')
		.post(async (req: any, res) => {
			try {
				const url = await createKaraIssue(req.params.kid, req.body.type, req.body.comment, req.body.username);
				res.status(200).json(url);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/tags/:tid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(async (req: any, res) => {
			try {
				const tag = await getTag(req.params.tid);
				if (tag) res.json(tag);
				res.status(404);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/tags')
		.get(async (req: any, res) => {
			try {
				const tags = await getTags({
					filter: req.query.filter,
					type: req.query.type,
					from: req.query.from,
					size: req.query.size,
					order: req.query.order,
					stripEmpty: Boolean(req.query.stripEmpty),
					includeStaging: Boolean(req.query.includeStaging),
					forceCollections: req.query.collections?.split(',')
				});
				res.json(tags);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/medias')
		// Remove when KM App 6.0 is deprecated. KM 7+ uses POST.
		.get(async (_req, res) => {
			try {
				const medias = await getAllMedias();
				res.json(medias);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		})
		.post(async (req, res) => {
			try {
				const medias = await getAllMedias(req.body.collections);
				res.json(medias);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/years')
		.get(async (req, res) => {
			try {
				const years = await getAllYears({
					order: req.query.order as 'recent' | 'karacount',
					collections: typeof req.query.collections === 'string' ? req.query.collections?.split(',') : undefined
				});
				res.json(years);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/suggest')
		.post(async (req, res) => {
			try {
				if (getConfig().Gitlab.Enabled) {
					const url = await createSuggestionIssue(req.body.title, req.body.serie, req.body.type, req.body.link, req.body.username,);
					res.json(url);
				} else {
					res.status(403).json(APIMessage('GITLAB_DISABLED'));
				}
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/repository')
		.get(async (_req, res) => {
			res.status(200).json({
				Git: getConfig().System.Repositories[0].Git.URL,
				FullArchiveURL: getConfig().System.Repositories[0].FullArchiveURL,
				SourceArchiveURL: getConfig().System.Repositories[0].SourceArchiveURL,
				LatestCommit: await getLatestGitCommit(),
				ProjectID: getConfig().System.Repositories[0].Git.ProjectID
			} as RepositoryManifest);
		});
	router.route('/karas/repository/diff')
		.get(async (req: any, res) => {
			try {
				const diff = await getGitDiff(req.query.commit);
				res.status(200).type('text/plain').send(diff);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/repository/diff/full')
		.get(async (req: any, res) => {
			try {
				const diff = await getGitDiff(req.query.commit, true);
				res.status(200).json(diff);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
}
