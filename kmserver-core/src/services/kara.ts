import { resolve, basename } from 'path';
import { promises as fs } from 'fs';
import parallel from 'p-map';
import {createHash} from 'crypto';

import {selectAllKaras, selectAllYears, selectBaseStats, selectAllMedias, refreshKaraStats} from '../dao/kara';
import { KaraList, KaraParams } from '../lib/types/kara';
import { consolidateData } from '../lib/services/kara';
import { ASSToLyrics } from '../lib/utils/ass';
import { getASS } from '../lib/dao/karafile';
import { generateDatabase } from '../lib/services/generation';
import { createImagePreviews } from '../lib/utils/previews';
import logger from '../lib/utils/logger';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import { gitlabPostNewIssue } from './gitlab';
import { DownloadBundleServer, KaraMetaFile, MetaFile, ShinDownloadBundle, TagMetaFile } from '../lib/types/downloads';
import sentry from '../utils/sentry';
import { JWTTokenWithRoles } from '../lib/types/user';
import { TagFile } from '../lib/types/tag';
import { updateGit } from './git';
import { findUserByName } from './user';
import { getState } from '../utils/state';
import { downloadFile } from '../lib/utils/downloader';
import { resolveFileInDirs } from '../lib/utils/files';
import { DBKara } from '../lib/types/database/kara';
import { copyFromData } from '../lib/dao/database';
import { generateHardsubs } from '../utils/hardsubs';

export async function getBaseStats() {
	try {
		return await selectBaseStats();
	} catch(err) {
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
		i18n: i18n,
		content: data
	};
}

export async function getAllYears() {
	try {
		return await selectAllYears();
	} catch(err) {
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
		const karas = await getAllKaras({});
		refreshKaraStats();
		// Download master.zip from gitlab to serve it ourselves
		const repo = getConfig().System.Repositories[0];
		const downloadURL = repo.SourceArchiveURL;
		const destFile = resolve(getState().dataPath, repo.BaseDir, 'master.zip');
		const downloadItem = {
			filename: destFile,
			url: downloadURL,
			id: '',
		};
		downloadFile(downloadItem);
		computeSubchecksums();
		await Promise.all([
			createImagePreviews(karas, 'full', 1280),
			generateHardsubs(karas)
		]);
	} catch(err) {
		logger.error('Generation failed', {service: 'Gen', obj: err});
		sentry.error(err, 'Fatal');
	}
}

export async function computeSubchecksums() {
	logger.info('Starting computing checksums', {service: 'Kara'});
	const karas = await getAllKaras({});
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
export function getAllmedias() {
	return selectAllMedias();
}

export async function getKara(params: KaraParams, token?: JWTTokenWithRoles) {
	try {
		const karas = await selectAllKaras({
			order: params.order,
			q: params.q,
			username: token?.username.toLowerCase()
		});
		if (!karas[0]) return;
		karas[0].lyrics = null;
		if (karas[0].subfile) {
			const ASS = await getASS(karas[0].subfile, karas[0].repository);
			if (ASS) karas[0].lyrics = ASSToLyrics(ASS);
		}
		return karas[0];
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function getAllKaras(params: KaraParams, token?: JWTTokenWithRoles): Promise<KaraList> {
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
		let pl = await selectAllKaras({
			filter: params.filter,
			from: +params.from,
			size: +params.size,
			order: params.order,
			q: params.q || '',
			username: token?.username,
			favorites: params.favorites,
			random: params.random
		});
		return formatKaraList(pl, +params.from, pl[0]?.count || 0);
	} catch(err) {
		// Skip Sentry if the error has a code.
		if (err?.code) throw err;
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		logger.error('Getting karas failed', {service: 'Karas', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function aggregateKaras(kids: string[]): Promise<ShinDownloadBundle> {
	const DBKaras = (await selectAllKaras({
		q: `k:${kids.join(',')}`
	}));
	const allTagFiles: Set<string> = new Set();
	const lyrics: MetaFile[] = [];
	const karas: KaraMetaFile[] = [];
	const tags: TagMetaFile[] = [];
	for (const kara of DBKaras) {
		for (const tagFile of kara.tagfiles) {
			if (!allTagFiles.has(tagFile)) {
				allTagFiles.add(tagFile);
				const tagPath = resolve(resolvedPathRepos('Tags')[0], tagFile);
				const tagData: TagFile = JSON.parse(await fs.readFile(tagPath, 'utf-8'));
				tags.push({file: tagFile, data: tagData});
			}
		}
		if (kara.subfile) {
			const lyricsData = await fs.readFile(resolve(resolvedPathRepos('Lyrics')[0], kara.subfile), 'utf-8');
			lyrics.push({
				file: kara.subfile,
				data: lyricsData
			});
		}
		karas.push({
			file: kara.karafile,
			data: JSON.parse(await fs.readFile(resolve(resolvedPathRepos('Karaokes')[0], kara.karafile), 'utf-8'))
		});
	}
	return {
		karas,
		lyrics,
		tags
	};
}

export async function getRawKara(kid: string): Promise<DownloadBundleServer> {
	try {
		const kara = (await selectAllKaras({
			q: `k:${kid}`
		}))[0];
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
	} catch(err) {
		if (typeof err === 'object') {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(err);
		}
		throw err;
	}
}

export async function newKaraIssue(kid: string, type: 'Media' | 'Metadata' | 'Lyrics', comment: string, username: string) {
	const karas = await selectAllKaras({
		q: `k:${kid}`
	});
	const kara = karas[0];
	logger.debug('Kara:', {service: 'GitLab', obj: kara});
	let singerOrSerie = kara.series.length > 0 && kara.series[0].name || (kara.singers.length > 0 && kara.singers[0].name) || '';
	let langs = (kara.langs.length > 0 && kara.langs[0].name.toUpperCase()) || '';
	let songtype = (kara.songtypes.length > 0 && kara.songtypes[0].name) || '';
	const karaName = `${langs} - ${singerOrSerie} - ${songtype}${kara.songorder || ''} - ${kara.titles.eng}`;
	const conf = getConfig();
	const issueTemplate = conf.Gitlab.IssueTemplate.KaraProblem[type];
	let title = issueTemplate.Title || '$kara';
	title = title.replace('$kara', karaName);
	let desc = issueTemplate.Description || '';
	desc = desc.replace('$username', username)
		.replace('$comment', comment);
	try {
		if (conf.Gitlab.Enabled) return await gitlabPostNewIssue(title, desc, issueTemplate.Labels);
	} catch(err) {
		logger.error('Call to Gitlab API failed', {service: 'GitLab', obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err, 'Warning');
		throw err;
	}
}
