import {createHash} from 'crypto';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import parallel from 'p-map';
import { basename, resolve } from 'path';

import {refreshKaraStats, selectAllKaras, selectAllMedias, selectAllYears, selectBaseStats} from '../dao/kara';
import { copyFromData } from '../lib/dao/database';
import { getASS } from '../lib/dao/karafile';
import { generateDatabase } from '../lib/services/generation';
import { consolidateData } from '../lib/services/kara';
import { DBKara } from '../lib/types/database/kara';
import { DownloadBundleServer } from '../lib/types/downloads';
import { KaraList, KaraParams } from '../lib/types/kara';
import { JWTTokenWithRoles } from '../lib/types/user';
import { ASSToLyrics } from '../lib/utils/ass';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import {uuidRegexp} from '../lib/utils/constants';
import { downloadFile } from '../lib/utils/downloader';
import { resolveFileInDirs } from '../lib/utils/files';
import logger from '../lib/utils/logger';
import { createImagePreviews } from '../lib/utils/previews';
import { generateHardsubs } from '../utils/hardsubs';
import sentry from '../utils/sentry';
import { getState } from '../utils/state';
import { updateGit } from './git';
import { gitlabPostNewIssue } from './gitlab';
import { clearOldInboxEntries, clearUnusedStagingTags } from './inbox';
import { findUserByName } from './user';

// KID => Filename
const hardsubsCache: Map<string, string> = new Map();

export async function getBaseStats() {
	try {
		return await selectBaseStats();
	} catch (err) {
		sentry.error(err);
		throw err;
	}
}

export function formatKaraList(karaList: any[], from: number, count: number): KaraList {
	const {i18n, data} = consolidateData(karaList);
	return {
		infos: {
			count: +count,
			from: +from,
			to: +from + data.length
		},
		i18n,
		content: data
	};
}

export async function getAllYears(params: {collections: string[]}) {
	try {
		return await selectAllYears(params.collections);
	} catch (err) {
		sentry.error(err);
		throw err;
	}
}

export async function updateRepo() {
	await updateGit();
	await generate();
}

export async function generate() {
	try {
		await generateDatabase({validateOnly: false});
		const karas = await getAllKaras({ ignoreCollections: true }, undefined, true);
		refreshKaraStats();
		const conf = getConfig();
		// Download master.zip from gitlab to serve it ourselves
		const repo = conf.System.Repositories[0];
		if (repo.SourceArchiveURL) {
			const downloadURL = repo.SourceArchiveURL;
			const destFile = resolve(getState().dataPath, repo.BaseDir, 'master.zip');
			const downloadItem = {
				filename: destFile,
				url: downloadURL,
				id: '',
			};
			downloadFile(downloadItem);
		}
		computeSubchecksums();
		createBaseDumps();
		const promises = [createImagePreviews(karas, 'full', 1280)];
		if (conf.Hardsub.Enabled) {
			promises.push(generateHardsubs(karas));
			generateHardsubsCache(karas);
		}
		if (conf.KaraExplorer.Import) promises.push(clearOldInboxEntries(), clearUnusedStagingTags());
		if (conf.System.Repositories[0].OnUpdateTrigger) promises.push(updateTrigger());
		await Promise.all(promises);
	} catch (err) {
		logger.error('Generation failed', {service: 'Gen', obj: err});
		sentry.error(err, 'fatal');
	}
}

function generateHardsubsCache(karas: KaraList) {
	hardsubsCache.clear();
	for (const kara of karas.content) {
		hardsubsCache.set(kara.kid, kara.hardsubbed_mediafile);
	}
}

export function getHardsubsCache() {
	return hardsubsCache;
}

async function createBaseDumps() {
	await Promise.all([
		createFileBaseDump(),
		createDBBaseDump()
	]).catch(err => {
		logger.error('Unable to create dump', { service: 'Gen', obj: err});
		sentry.error(err);
	});
}

async function createDBBaseDump() {
	const dump = await selectAllKaras({ ignoreCollections: true }, false);
	const dumpFile = resolve(getState().dataPath, getConfig().System.Path.Dumps, 'basedb.json');
	await fs.writeFile(dumpFile, JSON.stringify(dump, null, 2), 'utf-8');
}

async function createFileBaseDump() {
	const repo = getConfig().System.Repositories[0];
	const kdir = resolvedPathRepos('Karaokes', repo.Name)[0];
	const tdir = resolvedPathRepos('Tags', repo.Name)[0];
	const karaFiles = await fs.readdir(kdir);
	const tagFiles = await fs.readdir(tdir);
	const dump = {
		Karaokes: [],
		Tags: [],
	};
	for (const karaFile of karaFiles) {
		const karaData = await fs.readFile(resolve(kdir, karaFile), 'utf-8');
		dump.Karaokes.push(JSON.parse(karaData));
	}
	for (const tagFile of tagFiles) {
		const tagData = await fs.readFile(resolve(tdir, tagFile), 'utf-8');
		dump.Tags.push(JSON.parse(tagData));
	}
	const dumpFile = resolve(getState().dataPath, getConfig().System.Path.Dumps, 'basefiles.json');
	await fs.writeFile(dumpFile, JSON.stringify(dump, null, 2), 'utf-8');
}

async function updateTrigger() {
	const trigger = getConfig().System.Repositories[0].OnUpdateTrigger;
	const [cmd, args] = trigger.split(/ (.+)/);
	logger.info(`Update trigger: ${trigger}`, { service: 'Gen' });
	try {
		await execa(cmd, args.split(' '));
	} catch (err) {
		logger.error('Update trigger failed', { service: 'Gen', obj: err});
	}
}

export async function computeSubchecksums() {
	logger.info('Starting computing checksums', {service: 'Kara'});
	const karas = await getAllKaras({ ignoreCollections: true }, undefined, true);
	const mapper = async (lyrics: any[]) => {
		return checksumASS(lyrics);
	};
	const lyricsMap: Map<string, DBKara> = new Map();
	for (const kara of karas.content.filter(k => k.subfile)) {
		lyricsMap.set(kara.kid, kara);
	}
	const checksums = await parallel([...lyricsMap], mapper, {
		stopOnError: false,
		concurrency: 32
	});
	await copyFromData('kara_subchecksum', checksums);
	logger.info('Finished computing checksums', {service: 'Kara'});
}

async function checksumASS(lyrics: any[]): Promise<string[]> {
	const subfile = await resolveFileInDirs(lyrics[1].subfile, resolvedPathRepos('Lyrics', lyrics[1].repository));
	let subdata = await fs.readFile(subfile[0], 'utf-8');
	subdata = subdata.replace(/\r/g, '');
	return [lyrics[1].kid, createHash('md5').update(subdata, 'utf-8').digest('hex')];
}
export function getAllMedias() {
	return selectAllMedias();
}

export async function getKara(params: KaraParams, token?: JWTTokenWithRoles) {
	try {
		const karas = await selectAllKaras({
			order: params.order,
			q: params.q,
			username: token?.username.toLowerCase(),
			ignoreCollections: true
		}, true);
		if (!karas[0]) return;
		karas[0].lyrics = null;
		if (karas[0].subfile) {
			const ASS = await getASS(karas[0].subfile, karas[0].repository);
			if (ASS) karas[0].lyrics = ASSToLyrics(ASS);
		}
		return karas[0];
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function getAllKaras(params: KaraParams, token?: JWTTokenWithRoles, includeStaging = false): Promise<KaraList<DBKara>> {
	try {
		if (token) token.username = token.username.toLowerCase();
		// User seeking favorites from someone, check if that's okay or not.
		if (params.favorites) {
			const user = await findUserByName(params.favorites);
			if (user) {
				if (!user.flag_displayfavorites && user.login !== token?.username) throw {code: 403};
			} else {
				throw {code: 404};
			}
		}
		if (params.forceCollections) {
			for (const collection of params.forceCollections) {
				if (!uuidRegexp.test(collection)) throw {code: 400};
			}
		}
		const pl = await selectAllKaras({
			filter: params.filter,
			from: +params.from,
			size: +params.size,
			order: params.order,
			q: params.q || '',
			username: token?.username,
			favorites: params.favorites,
			random: params.random,
			ignoreCollections: params.ignoreCollections,
			forceCollections: params.forceCollections || []
		}, includeStaging);
		return formatKaraList(pl, +params.from, pl[0]?.count || 0);
	} catch (err) {
		// Skip Sentry if the error has a code.
		if (err?.code) throw err;
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		logger.error('Getting karas failed', {service: 'Karas', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function getRawKara(kid: string): Promise<DownloadBundleServer> {
	try {
		const kara = (await selectAllKaras({
			q: `k:${kid}`,
			ignoreCollections: true
		}, true))[0];
		if (!kara) throw 'Unknown song';
		// Create a set of tagfiles to get only unique tagfiles.
		const tagfiles = new Set(kara.tagfiles);
		const files = {
			kara: resolve(resolvedPathRepos('Karaokes')[0], kara.karafile),
			tags: Array.from(tagfiles).map(f => {
				return f
					? resolve(resolvedPathRepos('Tags')[0], f)
					: null;
			}),
			lyrics: kara.subfile ? resolve(resolvedPathRepos('Lyrics')[0], kara.subfile) : null
		};
		let lyricsData = null;
		if (kara.subfile) lyricsData = await fs.readFile(files.lyrics, 'utf-8');
		const data = {
			kara: {file: kara.karafile, data: JSON.parse(await fs.readFile(files.kara, 'utf-8'))},
			lyrics: {file: kara.subfile || null, data: lyricsData},
			tags: [],
		};
		for (const tagFile of files.tags) {
			if (tagFile) data.tags.push({
				file: basename(tagFile),
				data: JSON.parse(await fs.readFile(tagFile, 'utf-8'))
			});
		}
		return {
			header: {
				description: 'Karaoke Mugen Karaoke Bundle File'
			},
			...data
		};
	} catch (err) {
		if (typeof err === 'object') {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(err);
		}
		throw err;
	}
}

export async function newKaraIssue(kid: string, type: 'Media' | 'Metadata' | 'Lyrics', comment: string, username: string) {
	const karas = await selectAllKaras({
		q: `k:${kid}`,
		ignoreCollections: true
	}, true);
	const kara = karas[0];
	logger.debug('Kara:', {service: 'GitLab', obj: kara});
	const singerOrSerie =
		(kara.series.length > 0 && kara.series[0].name) ||
		(kara.singers.length > 0 && kara.singers[0].name) || '';
	const langs = (kara.langs.length > 0 && kara.langs[0].name.toUpperCase()) || '';
	const songtype = (kara.songtypes.length > 0 && kara.songtypes[0].name) || '';
	const karaName = `${langs} - ${singerOrSerie} - ${songtype}${kara.songorder || ''} - ${kara.titles[kara.titles_default_language]}`;
	const conf = getConfig();
	const issueTemplate = conf.Gitlab.IssueTemplate.KaraProblem[type];
	let title = issueTemplate.Title || '$kara';
	title = title.replace('$kara', karaName);
	let desc = issueTemplate.Description || '';
	desc = desc.replace('$username', username)
		.replace('$comment', comment);
	try {
		if (conf.Gitlab.Enabled) return await gitlabPostNewIssue(title, desc, issueTemplate.Labels);
	} catch (err) {
		logger.error('Call to Gitlab API failed', {service: 'GitLab', obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err, 'warning');
		throw err;
	}
}
