import { convertToASS as srt2ass } from 'convert-srt-to-ass';
import {createHash} from 'crypto';
import { execa } from 'execa';
import { promises as fs } from 'fs';
import parallel from 'p-map';
import { parse, resolve } from 'path';

import { refreshKaraStats, selectAllKaras, selectAllMedias, selectAllYears, selectBaseStats} from '../dao/kara.js';
import { copyFromData } from '../lib/dao/database.js';
import { getLyrics } from '../lib/dao/karafile.js';
import { generateDatabase } from '../lib/services/generation.js';
import { formatKaraList } from '../lib/services/kara.js';
import { readAllRepoManifests } from '../lib/services/repo.js';
import { DBKara } from '../lib/types/database/kara.js';
import { KaraList, KaraParams } from '../lib/types/kara.js';
import { JWTTokenWithRoles } from '../lib/types/user.js';
import { ASSToLyrics } from '../lib/utils/ass.js';
import { getConfig, resolvedPathRepos } from '../lib/utils/config.js';
import {uuidRegexp} from '../lib/utils/constants.js';
import { downloadFile } from '../lib/utils/downloader.js';
import { ErrorKM } from '../lib/utils/error.js';
import { resolveFileInDirs } from '../lib/utils/files.js';
import logger from '../lib/utils/logger.js';
import { createImagePreviews } from '../lib/utils/previews.js';
import { generateHardsubs } from '../utils/hardsubs.js';
import sentry from '../utils/sentry.js';
import { getState } from '../utils/state.js';
import { updateGit } from './git.js';
import { clearOldInboxEntries, clearUnusedStagingTags, removeProcessedInboxes } from './inbox.js';
import { findUserByName } from './user.js';

const service = 'Kara';

// KID => Filename
let hardsubsCache: Map<string, string> = new Map();

export async function getBaseStats() {
	try {
		return await selectBaseStats();
	} catch (err) {
		logger.error('Error getting base stats', { service, obj: err });
		sentry.error(err);
		throw new ErrorKM('GET_BASESTATS_ERROR');
	}
}

export async function getAllYears(params: { order: 'recent' | 'karacount', collections: string[] }) {
	try {
		return await selectAllYears(params);
	} catch (err) {
		logger.error('Error getting years', { service, obj: err });
		sentry.error(err);
		throw new ErrorKM('GET_YEARS_ERROR');
	}
}

let generationAbortController = new AbortController();
let generationInProgress = false;

export async function updateRepo() {
	await updateGit();
	if (generationInProgress) {
		generationAbortController.abort();
		generationAbortController = new AbortController();
	}
	try {
		generationInProgress = true;
		await execa('yarn', ['start', '--generate'], {
			cwd: resolve(),
			cancelSignal: generationAbortController.signal
		});
	} catch (err) {
		if (err.isCanceled) {
			logger.error('Generation aborted', { service });
			throw new ErrorKM('GEN_ABORTED', 409, false);
		} else {
			throw err;
		}
	} finally {
		generationInProgress = false;
	}
	const karas = await getAllKaras({ ignoreCollections: true }, undefined, true);
	const promises = [createImagePreviews(karas, 'full', 1280)];
	if (getConfig().Hardsub.Enabled) {
		// Fuck you typescript.
		promises.push(generateHardsubs(karas) as any) ;
		generateHardsubsCache(karas);
	}
	await Promise.all(promises);
}

export async function generate() {
	try {
		await removeProcessedInboxes();
		await readAllRepoManifests();
		await generateDatabase({validateOnly: false});
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
		const promises = [];
		if (conf.Frontend.Import.Enabled) promises.push(clearOldInboxEntries());
		if (conf.System.Repositories[0].OnUpdateTrigger) promises.push(updateTrigger());
		promises.push(refreshKaraStats());
		await Promise.all(promises);
		if (conf.Frontend.Import.Enabled) await clearUnusedStagingTags();
	} catch (err) {
		logger.error('Generation failed', {service, obj: err});
		sentry.error(err, 'fatal');
	}
}

export function generateHardsubsCache(karas: KaraList) {
	// Create a second map to fill and replace the real one by this one once done.
	const newHardsubsCache: Map<string, string> = new Map();
	for (const kara of karas.content) {
		newHardsubsCache.set(kara.kid, kara.hardsubbed_mediafile);
	}
	hardsubsCache = newHardsubsCache;
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
	const karaFiles = (await fs.readdir(kdir)).filter(filename => filename.toLowerCase().endsWith('.json'));
	const tagFiles = (await fs.readdir(tdir)).filter(filename => filename.toLowerCase().endsWith('.json'));
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
	for (const kara of karas.content.filter(k => k.lyrics_infos[0]?.filename)) {
		lyricsMap.set(kara.kid, kara);
	}
	const checksums = await parallel([...lyricsMap], mapper, {
		stopOnError: false,
		concurrency: 32
	});
	await copyFromData('kara_subchecksum', checksums, true);
	logger.info('Finished computing checksums', {service});
}

async function checksumASS(lyrics: DBKara[]): Promise<string[]> {
	// We receive a map so the second item is the DBKara we need.
	const subfile = await resolveFileInDirs(lyrics[1].lyrics_infos[0].filename, resolvedPathRepos('Lyrics', lyrics[1].repository));
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
		if (!karas[0]) throw new ErrorKM('NO_KARA_FOUND', 404, false);
		const kara = karas[0];
		kara.lyrics = null;
		if (kara.lyrics_infos[0]) {
			// FIXME: add support for converting lrc/vtt on the fly here
			const ext = parse(kara.lyrics_infos[0].filename).ext;
			let lyrics = await getLyrics(kara.lyrics_infos[0].filename, kara.repository);
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
		throw err instanceof ErrorKM ? err : new ErrorKM('GET_KARA_ERROR');
	}
}

export async function getAllKaras(params: KaraParams, token?: JWTTokenWithRoles, includeStaging = false): Promise<KaraList<DBKara>> {
	try {
		if (token) token.username = token.username.toLowerCase();
		// User seeking favorites from someone, check if that's okay or not.
		if (params.favorites) {
			const user = await findUserByName(params.favorites);
			if (user) {
				if (!user.flag_displayfavorites && user.login !== token?.username) throw new ErrorKM('GET_FAVORITES_FROM_USER_FORBIDDEN_ERROR', 403, false);
			} else {
				throw new ErrorKM('GET_FAVORITES_FROM_USER_NOT_FOUND_ERROR', 404, false);
			}
		}
		if (params.forceCollections?.length > 0 && params.forceCollections[0]) {
			for (const collection of params.forceCollections) {
				if (!uuidRegexp.test(collection)) {
					logger.error(`Invalid collection in ${params.forceCollections.join(', ')}`, { service });
					throw new ErrorKM('GET_KARA_COLLECTION_FORMAT_ERROR', 400, false);
				}
			}
		}
		const pl = await selectAllKaras(params, includeStaging);
		return formatKaraList(pl, +params.from, pl[0]?.count || 0);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		logger.error('Getting karas failed', {service, obj: err});
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('GET_KARAS_ERROR');
	}
}
