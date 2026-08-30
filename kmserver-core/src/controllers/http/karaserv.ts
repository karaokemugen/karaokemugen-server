import { Router } from 'express';
import { resolve } from 'path';
import z from 'zod';

import {getSettings} from '../../lib/dao/database.js';
import { APIMessage } from '../../lib/services/frontend.js';
import { getRepoManifest } from '../../lib/services/repo.js';
import { RepositoryManifest } from '../../lib/types/repo.js';
import {getConfig} from '../../lib/utils/config.js';
import { orderParams } from '../../lib/utils/constants.js';
import { ErrorKM } from '../../lib/utils/error.js';
import { check, zGitCommit, zQParam, zUUIDList } from '../../lib/utils/validators.js';
import { getGitDiff, getLatestGitCommit } from '../../services/git.js';
import { createKaraIssue, createSuggestionIssue } from '../../services/gitlab.js';
import {getAllKaras, getAllMedias, getAllYears, getBaseStats, getHardsubsCache, getKara, getOtherLikedKIDs} from '../../services/kara.js';
import {getTag, getTags} from '../../services/tag.js';
import { getState } from '../../utils/state.js';
import { optionalAuth } from '../middlewares/auth.js';
import { validateUUID } from '../middlewares/validation.js';

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
				check(req.query, z.object({
					filter: z.string().optional(),
					from: z.coerce.number().int().min(0).optional(),
					size: z.coerce.number().int().min(1).optional(),
					q: zQParam.optional(),
					order: z.enum(orderParams).optional(),
					random: z.coerce.number().int().min(0).optional(),
					favorites: z.string().optional(),
					safeOnly: z.coerce.boolean().optional(),
					userAnimeList: z.string().optional(),
					forPlayer: z.coerce.boolean().optional(),
					ignoreCollections: z.coerce.boolean().optional(),
					collections: zUUIDList.optional()
				}));
				const karas = await getAllKaras({
					...req.query,
					username: req.authToken?.username,
					collections: req.query.collections?.split(','),
				}, req.authToken, req.query.includeStaging);
				res.json(karas);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/tags/:tid')
		.get(validateUUID('tid'), async (req: any, res) => {
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
				check(req.query, z.object({
					filter: z.string().optional(),
					type: z.coerce.number(),
					from: z.coerce.number().int().optional(),
					size: z.coerce.number().int().optional(),
					order: z.enum(['karacount', 'az']).optional(),
					stripEmpty: z.coerce.boolean().optional(),
					collections: zUUIDList.optional(),
					includeStaging: z.coerce.boolean().optional(),
				}));
				const tags = await getTags(req.query);
				res.json(tags);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/medias')
		.post(async (req, res) => {
			try {
				check(req.body, z.object({
					collections: zUUIDList.optional()
				}));
				const medias = await getAllMedias(req.body.collections.split(','));
				res.json(medias);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/years')
		.get(async (req, res) => {
			try {
				check(req.query, z.object({
					order: z.enum(['recent', 'karacount']).optional(),
					collections: zUUIDList.optional()
				}));
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
		.post(optionalAuth, async (req: any, res) => {
			try {
				// If login needed, raise error if not logged in
				if (!req.authToken?.username.toLowerCase() && getConfig().Frontend.Suggestions.LoginNeeded) {
					throw new ErrorKM('LOGIN_NEEDED', 401, false);
				}
				if (getConfig().Gitlab.Enabled) {
					check(req.body, z.object({
						title: z.string(),
						serie: z.string().optional(),
						singer: z.string(),
						version: z.string(),
						link: z.url(),
						lyricsLink: z.url().optional(),
						comment: z.string().optional(),
						username: z.string(),
					}))
					const url = await createSuggestionIssue(req.body);
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
				Git: getConfig().System.Repositories[0].Git?.URL,
				FullArchiveURL: getConfig().System.Repositories[0].FullArchiveURL,
				SourceArchiveURL: getConfig().System.Repositories[0].SourceArchiveURL,
				LatestCommit: await getLatestGitCommit(resolve(getState().dataPath, getConfig().System.Repositories[0].BaseDir), getConfig().System.Repositories[0].Git?.Branch),
				// Remove in KM 11.0 : ProjectID shouldn't be returned anymore
				ProjectID: getRepoManifest(getConfig().System.Repositories[0].Name)?.projectID,
				Manifest: getRepoManifest(getConfig().System.Repositories[0].Name)
			} as RepositoryManifest);
		});
	router.route('/karas/repository/diff')
		.get(async (req: any, res) => {
			try {
				check(req.query, z.object({
					commit: zGitCommit,
				}));
				const diff = await getGitDiff(req.query.commit);
				res.status(200).type('text/plain').send(diff);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/repository/diff/full')
		.get(async (req: any, res) => {
			try {
				check(req.query, z.object({
					commit: zGitCommit,
				}));
				const diff = await getGitDiff(req.query.commit, true);
				res.status(200).json(diff);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});

	router.route('/karas/:kid')
		.get(validateUUID('kid'), optionalAuth, async (req: any, res) => {
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
	router.route('/karas/:kid/hardsub')
		.get(validateUUID('kid'), (req, res) => {
			const hardsubbedMediafile = getHardsubsCache().get(req.params.kid);
			hardsubbedMediafile
				? res.redirect(301, `/hardsubs/${hardsubbedMediafile}`)
				: res.status(404).send();
	});
	router.route('/karas/:kid/problem')
		.post(validateUUID('kid'), optionalAuth, async (req: any, res) => {
			try {
				// If login needed, raise error if not logged in
				if (!req.authToken?.username.toLowerCase() && getConfig().Frontend.Problem.LoginNeeded) {
					throw new ErrorKM('LOGIN_NEEDED', 401, false);
				}
				check(req.body, z.object({
					username: z.string(),
					type: z.enum(['Media', 'Metadata', 'Lyrics']),
					comment: z.string(),
				}));
				const url = await createKaraIssue(req.params.kid, req.body.type, req.body.comment, req.body.username);
				res.status(200).json(url);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	router.route('/karas/:kid/otherlikedsongs')
		.get(validateUUID('kid'), async (req: any, res) => {
			try {
				check(req.query, z.object({
					limit: z.coerce.number().int().min(1).optional()
				}));
				const kids = await getOtherLikedKIDs(req.params.kid, req.query.limit);
				res.status(200).json(kids);
			} catch (err) {
				res.status(err.code || 500).json(APIMessage(err.message));
			}
		});
	}
