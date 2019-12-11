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
export async function getAllKaras(filter?: string, lang?: string, from = 0, size = 0, mode?: string, modeValue?: string): Promise<KaraList> {
	try {
		const pl = await selectAllKaras({
				filter: filter,
				lang: lang,
				from: +from,
				size: +size,
				mode: mode,
				modeValue: modeValue
			});
		return formatKaraList(pl, +from, pl[0].count, lang);
	} catch(err) {
		throw err;
	}
}

