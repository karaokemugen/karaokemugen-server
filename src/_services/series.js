import {selectAllSeries} from '../_dao/series';

export async function getSeries(filter, lang) {
	return await selectAllSeries(filter, lang);
}