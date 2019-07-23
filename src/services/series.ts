import {selectAllSeries, countSeries, selectSerieByName} from '../dao/series';
import { Series } from '../lib/types/series';
import { writeSeriesFile } from '../lib/dao/seriesfile';
import { resolvedPathImport } from '../lib/utils/config';
import { findSeriesInImportedFiles } from '../dao/seriesfile';

export async function getOrAddSerieID(seriesObj: Series) {
	let serie = await selectSerieByName(seriesObj.name);
	if (serie) return serie.sid;
	// If no serie found, create it and return the sid we generated
	serie = await findSeriesInImportedFiles(seriesObj.name);
	if (serie) return serie.sid;
	await writeSeriesFile(seriesObj, resolvedPathImport());
	return seriesObj.sid;
}

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