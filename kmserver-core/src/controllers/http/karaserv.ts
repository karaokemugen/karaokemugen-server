import { Router } from 'express';

import { selectAllKaras } from '../../dao/kara';
import {getSettings} from '../../lib/dao/database';
import { RepositoryManifest } from '../../lib/types/repo';
import {getConfig} from '../../lib/utils/config';
import { getGitDiff, getLatestGitCommit } from '../../services/git';
import { postSuggestionToKaraBase } from '../../services/gitlab';
import {getAllKaras, getAllMedias, getAllYears, getBaseStats, getKara, getRawKara, newKaraIssue} from '../../services/kara';
import {getTag, getTags} from '../../services/tag';
import { optionalAuth } from '../middlewares/auth';

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

	router.route('/karas')
		.get(async (req: any, res) => {
			try {
				const karas = await getAllKaras({
					filter: req.query.filter,
					from: req.query.from,
					size: req.query.size
				});
				res.json(karas);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/stats')
		.get(async (_, res) => {
			try {
				res.json(await getBaseStats());
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/random')
		.get(optionalAuth, async (req: any, res) => {
			const karas = await selectAllKaras({
				filter: req.query.filter,
				random: req.query.size,
				username: req.authToken?.username,
				forceCollections: req.query.force_collections?.split(':')
			});
			res.json(karas.map(k => k.kid));
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
					favorites: req.query.favorites,
					forceCollections: req.query.force_collections?.split(':')
				}, req.authToken);
				res.json(karas);
			} catch (err) {
				res.status(500).json(err);
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
				res.status(err.code || 500).json(err);
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/raw')
		.get(async (req: any, res) => {
			try {
				const kara = await getRawKara(req.params.kid);
				res.json(kara);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/problem')
		.post(async (req: any, res) => {
			try {
				const url = await newKaraIssue(req.params.kid, req.body.type, req.body.comment, req.body.username);
				res.status(200).json(url);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/recent')
		.get(async (req: any, res) => {
			try {
				const karas = await getAllKaras({
					filter: req.query.filter,
					from: req.query.from,
					size: req.query.size,
					order: 'recent'
				});
				res.json(karas);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/tags/:tagtype([0-9]+)')
		.get(async (req: any, res) => {
			try {
				const tags = await getTags({
					filter: req.query.filter,
					type: req.params.tagtype,
					order: req.query.order,
					from: req.query.from,
					size: req.query.size,
					stripEmpty: Boolean(req.query.stripEmpty),
					includeStaging: Boolean(req.query.includeStaging),
					collections: req.query.collections?.split(',')
				});
				res.json(tags);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/tags/:tid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(async (req: any, res) => {
			try {
				const tag = await getTag(req.params.tid);
				res.json(tag);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/tags')
		.get(async (req: any, res) => {
			try {
				const tags = await getTags({
					filter: req.query.filter,
					type: null,
					from: req.query.from,
					size: req.query.size,
					stripEmpty: Boolean(req.query.stripEmpty),
					includeStaging: Boolean(req.query.includeStaging),
					collections: req.query.collections?.split(',')
				});
				res.json(tags);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/medias')
		// Remove when KM App 6.0 is deprecated. KM 7+ uses POST.
		.get(async (_req, res) => {
			try {
				const medias = await getAllMedias();
				res.json(medias);
			} catch (err) {
				res.status(500).json(err);
			}
		})
		.post(async (req, res) => {
			try {
				const medias = await getAllMedias(req.body.collections);
				res.json(medias);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/years')
		.get(async (req, res) => {
			try {
				const years = await getAllYears({
					collections: typeof req.query.collections === 'string' ? req.query.collections?.split(',') : undefined
				});
				res.json(years);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/suggest')
		.post(async (req, res) => {
			try {
				if (getConfig().Gitlab.Enabled) {
					const url = await postSuggestionToKaraBase(req.body.title, req.body.serie, req.body.type, req.body.link, req.body.username,);
					res.json(url);
				} else {
					res.status(403).json('Gitlab is not enabled');
				}
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/repository')
		.get(async (_req, res) => {
			res.status(200).json({
				Git: getConfig().System.Repositories[0].Git,
				FullArchiveURL: getConfig().System.Repositories[0].FullArchiveURL,
				SourceArchiveURL: getConfig().System.Repositories[0].SourceArchiveURL,
				LatestCommit: await getLatestGitCommit(),
				ProjectID: getConfig().Gitlab.ProjectID
			} as RepositoryManifest);
		});
	router.route('/karas/repository/diff')
		.get(async (req: any, res) => {
			try {
				const diff = await getGitDiff(req.query.commit);
				res.status(200).type('text/plain').send(diff);
			} catch (err) {
				res.status(err?.code || 500).send(err.msg);
			}
		});
	router.route('/karas/repository/diff/full')
		.get(async (req: any, res) => {
			try {
				const diff = await getGitDiff(req.query.commit, true);
				res.status(200).json(diff);
			} catch (err) {
				res.status(err?.code || 500).send(err.msg);
			}
		});
}
