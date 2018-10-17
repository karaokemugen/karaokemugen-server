import {asyncExists, asyncReadFile} from '../_utils/files';
import testJSON from 'is-valid-json';
import {getConfig} from '../_utils/config';
import {basename, resolve} from 'path';
import {initValidators, check} from '../_utils/validators';

const header = {
	version: 2,
	description: 'Karaoke Mugen Series File'
};

const seriesConstraintsV2 = {
	name: {presence: {allowEmpty: false}},
	aliases: {seriesAliasesValidator: true},
	i18n: {seriesi18nValidator: true}
};

export async function readSeriesFile(seriesFile) {
	let file;
	const conf = getConfig();
	try {
		file = resolve(conf.appPath, conf.Path.Series, seriesFile);
		await asyncExists(file);
	} catch(err) {
		throw `No series file found : ${file}`;
	}
	return await getDataFromSeriesFile(file);
}

export async function getDataFromSeriesFile(file) {
	const seriesFileData = await asyncReadFile(file, 'utf-8');
	if (!testJSON(seriesFileData)) throw `Syntax error in file ${file}`;
	const seriesData = JSON.parse(seriesFileData);
	if (header > +seriesData.header) throw `Series file is too old (version found: ${seriesData.header.version}, expected version: ${header.version})`;
	const validationErrors = seriesDataValidationErrors(seriesData.series);
	if (validationErrors) {
		throw `Series data is not valid: ${JSON.stringify(validationErrors)}`;
	}
	seriesData.series.seriefile = basename(file);
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