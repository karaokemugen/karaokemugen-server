import {selectAllKaras, selectAllYears, selectBaseStats, selectAllMedias} from '../dao/kara';
import { KaraList, KaraParams } from '../lib/types/kara';
import { consolidateData } from '../lib/services/kara';
import { DBKara } from '../lib/types/database/kara';
import { ASSToLyrics } from '../lib/utils/ass';
import { getASS } from '../lib/dao/karafile';
import { generateDatabase } from '../lib/services/generation';
import { createImagePreviews } from '../lib/utils/previews';
import logger from '../lib/utils/logger';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import { gitlabPostNewIssue } from '../lib/services/gitlab';
import { asyncReadFile, sanitizeFile } from '../lib/utils/files';
import { resolve, basename } from 'path';
import { DownloadBundle } from '../lib/types/downloads';
import sentry from '../utils/sentry';
import { Token } from '../lib/types/user';

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

export async function generate() {
	try {
		await generateDatabase({validateOnly: false});
		const karas = await getAllKaras({});
		await createImagePreviews(karas);
	} catch(err) {
		logger.error('', {service: 'Gen', obj: err});
		sentry.error(err, 'Fatal');
	}
}

export function getAllmedias() {
	return selectAllMedias();
}

export async function getKara(params: KaraParams, token?: Token) {
	try {
		const karas = await selectAllKaras({
			mode: params.mode,
			modeValue: params.modeValue,
			username: token?.username
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

export async function getAllKaras(params: KaraParams, token?: Token): Promise<KaraList> {
	try {
		// When compare is used because we're queried from KM App in order to tell which karaoke is missing or updated, we redefine from/size so we get absolutely all songs from database.
		let trueFrom = params.from;
		let trueSize = params.size;
		if (params.compare) {
			trueFrom = null;
			trueSize = null;
		}
		let pl = await selectAllKaras({
			filter: params.filter,
			from: +trueFrom,
			size: +trueSize,
			mode: params.mode,
			modeValue: params.modeValue || '',
			username: token?.username,
			sort: params.sort,
			favorites: params.favorites
		});
		// Let's build a map of KM App's KIDs if it's provided, and then filter the results depending on if we want updated songs or missing songs.
		// Missing songs are those not present in localKaras, updated songs are present but have a lower modification date
		const localKaras = new Map();
		if (params.localKaras && Object.keys(params.localKaras).length > 0){
			Object.keys(params.localKaras).forEach(kid => localKaras.set(kid, params.localKaras[kid]));
		}
		if (params.compare === 'updated') {
			pl = pl.filter((k: DBKara) => new Date(localKaras.get(k.kid)) < k.modified_at);
			for (const i in pl) {
				pl[i].count = pl.length;
			}
		}
		if (params.compare === 'missing') {
			pl = pl.filter((k: DBKara) => !localKaras.has(k.kid));
			for (const i in pl) {
				pl[i].count = pl.length;
			}
		}
		// We're getting song count from the first element in our results. Each element returns the count field from database.
		let count = 0;
		if (pl[0]) count = pl[0].count;
		// If compare is provided, we slice our list according to the real from/size asked by KM App's so we return the correct set of results.
		if (params.compare) {
			count = pl.length;
			if (params.from > 0) {
				pl = pl.slice(+params.from, +params.from + +params.size || (pl.length - +params.from));
			} else {
				pl = pl.slice(0, +params.size || pl.length);
			}
		}
		return formatKaraList(pl, +params.from, count);
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		logger.error('', {service: 'GetAllKaras', obj: err});
		throw err;
	}
}

export async function getRawKara(kid: string): Promise<DownloadBundle> {
	try {
		const kara = (await selectAllKaras({
			mode: 'kid',
			modeValue: kid
		}))[0];
		if (!kara) throw 'Unknown song';
		const files = {
			kara: resolve(resolvedPathRepos('Karas')[0], kara.karafile),
			tags: kara.tagfiles.map(f => {
				return f
					? resolve(resolvedPathRepos('Tags')[0], f)
					: null;
			}),
			lyrics: kara.subfile ? resolve(resolvedPathRepos('Lyrics')[0], kara.subfile) : null
		};
		let lyricsData = null;
		if (kara.subfile) lyricsData = await asyncReadFile(files.lyrics, 'utf-8');
		const data = {
			kara: {file: kara.karafile, data: JSON.parse(await asyncReadFile(files.kara, 'utf-8'))},
			lyrics: {file: kara.subfile || null, data: lyricsData},
			series: [],
			tags: [],
		};
		for (const tagFile of files.tags) {
			if (tagFile) data.tags.push({
				file: basename(tagFile),
				data: JSON.parse(await asyncReadFile(tagFile, 'utf-8'))
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

export async function newKaraIssue(kid: string, type: 'quality' | 'time', comment: string, username: string) {
	const karas = await selectAllKaras({
		mode: 'kid',
		modeValue: kid
	});
	const kara = karas[0];
	logger.debug('Kara:', {service: 'GitLab', obj: kara});
	let singerOrSerie = kara.series.length > 0 && kara.series[0].name || (kara.singers.length > 0 && kara.singers[0].name) || '';
	let langs = (kara.langs.length > 0 && kara.langs[0].name.toUpperCase()) || '';
	let songtype = (kara.songtypes.length > 0 && kara.songtypes[0].name) || '';
	const karaName = `${langs} - ${singerOrSerie} - ${songtype}${kara.songorder || ''} - ${kara.title}`;
	const conf = getConfig();
	const issueTemplate = type === 'quality' ? conf.Gitlab.IssueTemplate.KaraProblem.Quality : conf.Gitlab.IssueTemplate.KaraProblem.Time;
	let title = issueTemplate.Title || '$kara';
	title = title.replace('$kara', karaName);
	let desc = issueTemplate.Description || '';
	desc = desc.replace('$username', username)
		.replace('$type', type)
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
