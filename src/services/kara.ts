import {countKaras, selectAllKaras, selectAllYears, selectBaseStats} from '../dao/kara';
import { KaraList } from '../lib/types/kara';
import { consolidatei18n } from '../lib/services/kara';

export function getBaseStats() {
	return selectBaseStats();
}

export function formatKaraList(karaList: any[], from: number, count: number): KaraList {
	const {i18n, data} = consolidatei18n(karaList);
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

export async function getAllKaras(filter?: string, lang?: string, from = 0, size = 0, mode?: string, modeValue?: string): Promise<KaraList> {
	try {
		const [length, pl] = await Promise.all([
			countKaras(filter, mode, modeValue),
			selectAllKaras({
				filter: filter,
				lang: lang,
				from: +from,
				size: +size,
				mode: mode,
				modeValue: modeValue
			})
		]);
		return formatKaraList(pl, +from, length);
	} catch(err) {
		throw err;
	}
}

