import {asyncExists, asyncReadFile} from '../_utils/files';
import testJSON from 'is-valid-json';
import logger from 'winston';
import {getConfig} from '../_utils/config';
import {resolve} from 'path';

export async function readSeriesFile() {
	const conf = getConfig();
	const seriesFile = resolve(conf.appPath, conf.Path.Series);
	if (!await asyncExists(seriesFile)) {
		logger.error('[Series] No alternative series names file found!');
		throw 'No series file found';
	}
	let seriesData = await asyncReadFile(seriesFile, 'utf-8');
	if (!testJSON(seriesData)) {
		logger.error('[Series] Alternative series names file contains errors!');
		throw 'Syntax error in series.json';
	}
	return JSON.parse(seriesData);
}

export function findSeries(serie, seriesFile) {
	return seriesFile.series.find(s => {
		return s.name === serie;
	});
}