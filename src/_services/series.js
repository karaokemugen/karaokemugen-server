import {selectAllSeries} from '../_dao/series';

export async function getAllSeries(filter, lang) {
	return await selectAllSeries(filter, lang);
}