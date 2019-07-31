import {selectAllSeries, countSeries, selectSerieByName} from '../dao/series';
import { Series } from '../lib/types/series';
import { writeSeriesFile } from '../lib/dao/seriesfile';
import { resolvedPathImport } from '../lib/utils/config';
import { findSeriesInImportedFiles } from '../dao/seriesfile';
import { IDQueryResult } from '../lib/types/kara';

export async function getOrAddSerieID(seriesObj: Series): Promise<IDQueryResult> {
	let serie = await selectSerieByName(seriesObj.name);
	if (serie) return {id: serie.sid, new: false};
	// If no serie found, create it and return the sid we generated
	serie = await findSeriesInImportedFiles(seriesObj.name);
	if (serie) return {id: serie.sid, new: false};
	await writeSeriesFile(seriesObj, resolvedPathImport());
	return {id: seriesObj.sid, new: true};
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