import { addLikeToSuggestion, deleteSuggestion, insertSuggestion, selectSuggestions, selectSuggestionsLanguages, updateSuggestionSearchVector } from '../dao/suggestions.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import { Suggestion, SuggestionParams } from '../types/suggestions.js';
import sentry from '../utils/sentry.js';

const service = 'Suggestions';

export async function getSuggestions(params: SuggestionParams) {
	try {
		const res = await selectSuggestions({
			filter: params.filter,
			from: +params.from,
			size: +params.size,
			order: params.order,
			random: params.random,
			languages: params.languages
		});
		return {
			infos: {
				count: (res.length > 0 && +res[0].count) || 0,
				from: +params.from || 0,
				to: +params.from || 0 + res.length
			},
			content: res
		};
	} catch (err) {
		logger.error('Unable to fetch suggestions', {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('GET_SUGGESTIONS_ERROR');
	}
}

export async function getSuggestionsLanguages() {
	try {
		const rows = await selectSuggestionsLanguages();
		return rows.map(row => row.language);
	} catch (err) {
		logger.error('Unable to fetch suggestions languages', {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('GET_SUGGESTION_LANGUAGES_ERROR');
	}
}

export async function updateLike(id: number) {
	try {
		await addLikeToSuggestion(id);
		return true;
	} catch (err) {
		logger.error(`Unable to update like to suggestion ${id}`, {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('UPDATE_SUGGESTION_LIKE_ERROR');
	}
}

async function addSuggestion(suggestions: Suggestion[]) {
	try {
		await insertSuggestion(suggestions);
		return true;
	} catch (err) {
		logger.error('Unable to add suggestion', {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('ADD_SUGGESTION_ERROR');
	}
}

export async function addSuggestionsFromFile(fileData: string, source: string) {
	logger.info('Importing suggestions from CSV file...', {service});
	const data = fileData
		.replaceAll('\r', '')
		.split('\n')
		.map(l => {
			const line = l.split(';');
			return {
				song: `${line[0]}${line[1] ? ` - ${line[1]}` : ''}`,
				language: line[2],
				source
			};
		});
	await addSuggestion(data);
	await updateSuggestionSearchVector();
	logger.info('Imported suggestions!', {service});
}

export async function removeSuggestion(id: number) {
	try {
		await deleteSuggestion(id);
		return true;
	} catch (err) {
		logger.error(`Unable to remove suggestion ${id}`, {service, obj: err});
		sentry.error(err);
		throw new ErrorKM('REMOVE_SUGGESTION_ERROR');
	}
}
