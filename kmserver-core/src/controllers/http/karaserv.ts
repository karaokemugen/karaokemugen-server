import {aggregateKaras, getRawKara, getBaseStats, getKara, getAllKaras, getAllYears, newKaraIssue, getAllmedias} from '../../services/kara';
import {getTags, getTag} from '../../services/tag';
import {getAllSeries} from '../../services/series';
import {getSettings} from '../../lib/dao/database';
import { Router } from 'express';
import {getConfig} from '../../lib/utils/config';
import { postSuggestionToKaraBase } from '../../lib/services/gitlab';
import { optionalAuth } from '../middlewares/auth';
import { selectAllKaras } from '../../dao/kara';
import { getGitDiff, getLatestGitCommit } from '../../services/git';

export default function KSController(router: Router) {
	router.route('/karas/lastUpdate')
		.get(async (_, res) => {
			try {
				const settings: any = await getSettings();
				res.send(settings.lastGeneration);
			} catch(err) {
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
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/stats')
		.get(async (_, res) => {
			try {
				res.json(await getBaseStats());
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/random')
		.get(optionalAuth, async (req: any, res) => {
			const karas = await selectAllKaras({
				filter: req.query.filter,
				random: req.query.size,
				username: req.authToken?.username
			});
			res.json(karas.map(k => k.kid));
		});
	router.route('/karas/download')
		.get(optionalAuth, async (req: any, res) => {
			try {
				const payload = await aggregateKaras(req.body.kids);
				res.json(payload);
			} catch(err) {
				console.log(err);
				res.status(500).json(err);
			}
		});
	router.route('/karas/search')
		// Route used by KMApp to get Kara lists with comparison
		.post(optionalAuth, async (req: any, res) => {
			try {
				const karas = await getAllKaras({
					filter: req.body.filter,
					from: req.body.from,
					size: req.body.size,
					q: req.body.q,
					compare: req.body.compare,
					localKaras: req.body.localKaras,
					order: req.body.order,
					username: req.authToken?.username,
					favorites: req.body.favorites
				}, req.authToken);
				res.json(karas);
			} catch(err) {
				res.status(500).json(err);
			}
		})
		// Route used by KMExplorer
		.get(optionalAuth, async (req: any, res) => {
			try {
				const karas = await getAllKaras({
					filter: req.query.filter,
					from: req.query.from,
					size: req.query.size,
					q: req.query.q,
					username: req.authToken?.username,
					order: req.query.order,
					favorites: req.query.favorites
				}, req.authToken);
				res.json(karas);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(optionalAuth, async (req: any, res) => {
			try {
				const kara = await getKara({
					q: `k:${req.params.kid}`,
				}, req?.authToken);
				res.json(kara);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/raw')
		.get(async (req: any, res) => {
			try {
				const kara = await getRawKara(req.params.kid);
				res.json(kara);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/:kid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/problem')
		.post(async (req: any, res) => {
			try {
				const url = await newKaraIssue(req.params.kid, req.body.type, req.body.comment, req.body.username);
				res.status(200).json(url);
			} catch(err) {
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
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/tags/:tagtype([0-9]+)')
		.get(async (req: any, res) => {
			try {
				const tags = await getTags({filter: req.query.filter, type: req.params.tagtype, order: req.query.order, from: req.query.from, size: req.query.size, stripEmpty: Boolean(req.query.stripEmpty)});
				res.json(tags);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/tags/:tid([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
		.get(async (req: any, res) => {
			try {
				const tag = await getTag(req.params.tid, false);
				res.json(tag);
			} catch (err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/tags')
		.get(async (req: any, res) => {
			try {
				const tags = await getTags(({filter: req.query.filter, type: null, from: req.query.from, size: req.query.size}));
				res.json(tags);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/medias')
		.get(async (_req, res) => {
			try {
				const medias = await getAllmedias();
				res.json(medias);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	// KM <4.0 route
	router.route('/karas/series')
		.get(async (req: any, res) => {
			try {
				const series = await getAllSeries(req.query.filter, req.query.from, req.query.size);
				res.json(series);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/years')
		.get(async (_, res) => {
			try {
				const years = await getAllYears();
				res.json(years);
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/suggest')
		.post(async (req, res) => {
			try {
				if (getConfig().Gitlab.Enabled) {
					const url = await postSuggestionToKaraBase(req.body.title, req.body.serie, req.body.type, req.body.link, req.body.username, );
					res.json(url);
				} else {
					res.status(403).json('Gitlab is not enabled');
				}
			} catch(err) {
				res.status(500).json(err);
			}
		});
	router.route('/karas/repository')
		.get(async (_req, res) => {
			res.status(200).json({
				Git: getConfig().System.Repositories[0].Git,
				FullArchiveURL: getConfig().System.Repositories[0].FullArchiveURL,
				latestCommit: await getLatestGitCommit()
			});
		});
	router.route('/karas/repository/diff')
		.get(async (req: any, res) => {
			res.status(200).send(await getGitDiff(req.query.commit));
		});
}
