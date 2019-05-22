import {selectAllSeries, countSeries} from '../dao/series';

export async function getAllSeries(filter, lang, from = 0, size = 9999999999) {
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