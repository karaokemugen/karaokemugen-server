import {selectAllKaras, selectAllYears, selectBaseStats} from '../dao/kara';
import { KaraList } from '../lib/types/kara';
import { consolidateData } from '../lib/services/kara';
import { DBKara } from '../lib/types/database/kara';
import { ASSToLyrics } from '../lib/utils/ass';
import { getASS } from '../lib/dao/karafile';
import { generateDatabase } from '../lib/services/generation';
import { createImagePreviews } from '../lib/utils/previews';
import logger from '../lib/utils/logger';

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

export async function getKara(filter?: string, lang?: string, from = 0, size = 0, mode?: string, modeValue?: string): Promise<DBKara> {
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
			const ASS = await getASS(karas[0].subfile);
			if (ASS) karas[0].lyrics = ASSToLyrics(ASS);
		}
		return karas[0];
	} catch(err) {
		throw err;
	}
}
export async function getAllKaras(filter?: string, lang?: string, from = 0, size = 0, mode?: string, modeValue?: string, compare?: 'updated' | 'missing', localKarasArr?: any): Promise<KaraList> {
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
		if (Array.isArray(localKarasArr) && localKarasArr.length > 0) {
			localKarasArr.forEach(k => localKaras.set(k.kid, k.modified_at));
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

