import {selectAllKaras, selectAllYears, selectBaseStats} from '../dao/kara';
import { KaraList, ModeParam } from '../lib/types/kara';
import { consolidateData } from '../lib/services/kara';
import { DBKara } from '../lib/types/database/kara';
import { ASSToLyrics } from '../lib/utils/ass';
import { getASS } from '../lib/dao/karafile';
import { generateDatabase } from '../lib/services/generation';
import { createImagePreviews } from '../lib/utils/previews';
import logger from '../lib/utils/logger';
import { getConfig, resolvedPathRepos } from '../lib/utils/config';
import { gitlabPostNewIssue } from '../lib/services/gitlab';
import { asyncReadFile } from '../lib/utils/files';
import { resolve, basename } from 'path';

export async function getBaseStats() {
	return await selectBaseStats();
}

export function formatKaraList(karaList: any[], from: number, count: number, lang: string): KaraList {
	const langs = [lang, 'eng'];
	const {i18n, data} = consolidateData(karaList, langs);
	return {
		infos: {
			count: +count,
			from: from,
			to: from + data.length
		},
		i18n: i18n,
		content: data
	};
}

export async function getAllYears() {
	return await selectAllYears();
}

export async function generate() {
	try {
		await generateDatabase(false, false);
		const karas = await getAllKaras();
		await createImagePreviews(karas);
	} catch(err) {
		logger.error(`[Gen] ${err}`);
	}
}

export async function getKara(filter?: string, lang?: string, from = 0, size = 0, mode?: ModeParam, modeValue?: string) {
	try {
		const karas = await selectAllKaras({
			filter: filter,
			lang: lang,
			from: +from,
			size: +size,
			mode: mode,
			modeValue: modeValue
		});
		karas[0].lyrics = null;
		if (karas[0].subfile) {
			const ASS = await getASS(karas[0].subfile, karas[0].repository);
			if (ASS) karas[0].lyrics = ASSToLyrics(ASS);
		}
		return karas[0];
	} catch(err) {
		throw err;
	}
}

export async function getAllKaras(filter?: string, lang?: string, from = 0, size = 0, mode?: ModeParam, modeValue?: string, compare?: 'updated' | 'missing', localKarasObj?: any): Promise<KaraList> {
	try {
		let trueFrom = from;
		let trueSize = size;
		if (compare) {
			trueFrom = null;
			trueSize = null;
		}
		let pl = await selectAllKaras({
			filter: filter,
			lang: lang,
			from: +trueFrom,
			size: +trueSize,
			mode: mode,
			modeValue: modeValue || ''
		});
		const localKaras = new Map();
		if (localKarasObj && Object.keys(localKarasObj).length > 0){
			Object.keys(localKarasObj).forEach(kid => localKaras.set(kid, localKarasObj[kid]));
		}
		if (compare === 'updated') {
			pl = pl.filter((k: DBKara) => new Date(localKaras.get(k.kid)) < k.modified_at);
		}
		if (compare === 'missing') {
			pl = pl.filter((k: DBKara) => !localKaras.has(k.kid));
		}
		let count = 0;
		if (pl[0]) count = pl[0].count;
		if (compare) {
			count = pl.length;
			if (from > 0) {
				pl = pl.slice(+from, +from + +size || (pl.length - +from));
			} else {
				pl = pl.slice(0, +size || pl.length);
			}
		}
		return formatKaraList(pl, +from, count, lang);
	} catch(err) {
		console.log(err);
		logger.error(`[GetAllKaras] ${err}`);
		throw err;
	}
}

export async function getRawKara(kid: string) {
	const kara = (await selectAllKaras({
		mode: 'kid',
		modeValue: kid
	}))[0];
	const files = {
		kara: resolve(resolvedPathRepos('Karas')[0], kara.karafile),
		series: kara.seriefiles.map(f => resolve(resolvedPathRepos('Series')[0], f)),
		tags: kara.tagfiles.map(f => resolve(resolvedPathRepos('Tags')[0], f)),
		lyrics: resolve(resolvedPathRepos('Lyrics')[0], kara.subfile)
	};
	const data = {
		kara: {file: kara.karafile, data: JSON.parse(await asyncReadFile(files.kara, 'utf-8'))},
		lyrics: {file: kara.subfile, data: await asyncReadFile(files.lyrics, 'utf-8')},
		series: [],
		tags: [],
	};
	for (const seriesFile of files.series) {
		data.series.push({
			file: basename(seriesFile),
			data: JSON.parse(await asyncReadFile(seriesFile, 'utf-8'))
		});
	}
	for (const tagFile of files.tags) {
		data.tags.push({
			file: basename(tagFile),
			data: JSON.parse(await asyncReadFile(tagFile, 'utf-8'))
		});
	}
	return data;
}

export async function newKaraIssue(kid: string, type: 'quality' | 'time', message: string, author: string) {
	const karas = await selectAllKaras({
		mode: 'kid',
		modeValue: kid
	});
	const kara = karas[0];
	const karaName = `${kara.langs[0].name.toUpperCase()} - ${kara.serie[0] || kara.singers[0].name} - ${kara.songtypes[0].name}${kara.songorder || ''} - ${kara.title}`;
	const conf = getConfig();
	let title = conf.Gitlab.IssueTemplate.KaraProblem.Title || '$kara';
	logger.debug('[GitLab] Kara: '+JSON.stringify(kara, null, 2));
	title = title.replace('$kara', karaName);
	let desc = conf.Gitlab.IssueTemplate.KaraProblem.Description || '';
	desc = desc.replace('$author', author)
		.replace('$type', type)
		.replace('$message', message);
	try {
		if (conf.Gitlab.Enabled) return gitlabPostNewIssue(title, desc, conf.Gitlab.IssueTemplate.KaraProblem.Labels);
	} catch(err) {
		logger.error(`[KaraProblem] Call to Gitlab API failed : ${err}`);
	}
}