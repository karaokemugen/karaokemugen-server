import { convertToASS as srt2ass } from 'convert-srt-to-ass';
import {createHash} from 'crypto';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import parallel from 'p-map';
import { parse, resolve } from 'path';

import {refreshKaraStats, selectAllKaras, selectAllMedias, selectAllYears, selectBaseStats} from '../dao/kara';
import { copyFromData } from '../lib/dao/database';
import { getLyrics } from '../lib/dao/karafile';
import { generateDatabase } from '../lib/services/generation';
import { formatKaraList } from '../lib/services/kara';
import { DBKara } from '../lib/types/database/kara';
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

const service = 'Kara';

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
		await computeSubchecksums();
		createBaseDumps();
		const karas = await getAllKaras({ ignoreCollections: true }, undefined, true);
		const promises = [createImagePreviews(karas, 'full', 1280)];
		if (conf.Hardsub.Enabled) {
			promises.push(generateHardsubs(karas));
			generateHardsubsCache(karas);
		}
		if (conf.KaraExplorer.Import) promises.push(clearOldInboxEntries(), clearUnusedStagingTags());
		if (conf.System.Repositories[0].OnUpdateTrigger) promises.push(updateTrigger());
		await Promise.all(promises);
	} catch (err) {
		logger.error('Generation failed', {service, obj: err});
		sentry.error(err, 'fatal');
	}
}

export function generateHardsubsCache(karas: KaraList) {
	hardsubsCache.clear();
	for (const kara of karas.content) {
		hardsubsCache.set(kara.kid, kara.hardsubbed_mediafile);
	}
	logger.info('Hardsubs cache generated', {service});
}

export function getHardsubsCache() {
	return hardsubsCache;
}

async function createBaseDumps() {
	await Promise.all([
		createFileBaseDump(),
		createDBBaseDump()
	]).catch(err => {
		logger.error('Unable to create dump', { service, obj: err});
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
	logger.info(`Update trigger: ${trigger}`, { service });
	try {
		await execa(cmd, args.split(' '));
	} catch (err) {
		logger.error('Update trigger failed', { service, obj: err});
	}
}

export async function computeSubchecksums() {
	logger.info('Starting computing checksums', {service});
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
	logger.info('Finished computing checksums', {service});
}

async function checksumASS(lyrics: any[]): Promise<string[]> {
	const subfile = await resolveFileInDirs(lyrics[1].subfile, resolvedPathRepos('Lyrics', lyrics[1].repository));
	let subdata = await fs.readFile(subfile[0], 'utf-8');
	subdata = subdata.replace(/\r/g, '');
	return [lyrics[1].kid, createHash('md5').update(subdata, 'utf-8').digest('hex')];
}

export function getAllMedias(collections?: string[]) {
	return selectAllMedias(collections);
}

export async function getKara(params: KaraParams, token?: JWTTokenWithRoles) {
	try {
		const karas = await selectAllKaras({
			order: params.order,
			q: params.q,
			username: token?.username.toLowerCase(),
			ignoreCollections: true
		}, true);
		if (!karas[0]) throw {code: 404};
		const kara = karas[0];
		kara.lyrics = null;
		if (kara.subfile) {
			// FIXME: add support for converting lrc/vtt on the fly here
			const ext = parse(kara.subfile).ext;
			let lyrics = await getLyrics(kara.subfile, kara.repository);
			// If any other format we return.
			if (ext === '.srt') {
				lyrics = srt2ass(lyrics);
			}
			kara.lyrics = ASSToLyrics(lyrics);
		}
		return kara;
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
		logger.error('Getting karas failed', {service, obj: err});
		sentry.error(err);
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
	const serieOrSingergroupOrSinger =
		(kara.series.length > 0 && kara.series[0].name) ||
		(kara.singergroups.length > 0 && kara.singergroups[0].name) ||
		(kara.singers.length > 0 && kara.singers[0].name) || '';
	const langs = (kara.langs.length > 0 && kara.langs[0].name.toUpperCase()) || '';
	const songtype = (kara.songtypes.length > 0 && kara.songtypes[0].name) || '';
	const karaName = `${langs} - ${serieOrSingergroupOrSinger} - ${songtype}${kara.songorder || ''} - ${kara.titles[kara.titles_default_language]}`;
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
