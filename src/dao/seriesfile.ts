import {sanitizeFile, asyncWriteFile, asyncReadFile} from '../utils/files';
import testJSON from 'is-valid-json';
import {resolve} from 'path';
import {initValidators, check} from '../utils/validators';
import {uuidRegexp} from '../services/constants';
import {getConfig} from '../utils/config';

const header = {
	version: 3,
	description: 'Karaoke Mugen Series File'
};

const seriesConstraintsV2 = {
	name: {presence: {allowEmpty: false}},
	aliases: {seriesAliasesValidator: true},
	sid: {presence: true, format: uuidRegexp},
	i18n: {seriesi18nValidator: true}
};

export async function getDataFromSeriesFile(file) {
	const seriesFileData: any = await asyncReadFile(file, 'utf-8');
	if (!testJSON(seriesFileData)) throw `Syntax error in file ${file}`;
	const seriesData = JSON.parse(seriesFileData);
	if (header.version > +seriesData.header) throw `Series file is too old (version found: ${seriesData.header.version}, expected version: ${header.version})`;
	const validationErrors = seriesDataValidationErrors(seriesData.series);
	if (validationErrors) {
		throw `Series data is not valid: ${JSON.stringify(validationErrors)}`;
	}
	return seriesData.series;
}

export function seriesDataValidationErrors(seriesData) {
	initValidators();
	return check(seriesData, seriesConstraintsV2);
}

export function findSeries(serie, seriesData) {
	return seriesData.find(s => {
		return s.name === serie;
	});
}

export async function writeSeriesFile(series) {
	const conf = getConfig();
	const seriesFile = resolve(conf.Path.Inbox,  `${sanitizeFile(series.name)}.series.json`);
	const seriesData = {
		header: header,
		series: series
	};
	//Remove useless data
	return await asyncWriteFile(seriesFile, JSON.stringify(seriesData, null, 2), {encoding: 'utf8'});
}
