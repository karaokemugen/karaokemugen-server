import {selectAllSeries, countSeries} from '../_dao/series';

export async function getAllSeries(filter, lang, from, size) {
	const count = await countSeries(filter);
	const series = await selectAllSeries(filter, lang, +from, +size);
	return {
		content: series,
		infos: {
			count: +count,
			from: +from,
			to: +from + series.length
		}
	};
}