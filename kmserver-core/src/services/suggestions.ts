import fs from 'fs/promises';

import { addLikeToSuggestion, deleteSuggestion, insertSuggestion, selectSuggestions, selectSuggestionsLanguages, updateSuggestionSearchVector } from '../dao/suggestions';
import logger from '../lib/utils/logger';
import { Suggestion, SuggestionParams } from '../types/suggestions';
import sentry from '../utils/sentry';

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
				from: +params.from,
				to: +params.from + res.length
			},
			content: res
		};
	} catch (err) {
		logger.error('Unable to fetch suggestions', {service: 'Suggestions', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function getSuggestionsLanguages() {
	try {
		const rows = await selectSuggestionsLanguages();
		return rows.map(row => row.language);
	} catch (err) {
		logger.error('Unable to fetch suggestions languages', {service: 'Suggestions', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function updateLike(id: number) {
	try {
		await addLikeToSuggestion(id);
		return true;
	} catch (err) {
		logger.error(`Unable to update like to suggestion ${id}`, {service: 'Suggestions', obj: err});
		sentry.error(err);
		throw err;
	}
}

async function addSuggestion(suggestions: Suggestion[]) {
	try {
		await insertSuggestion(suggestions);
		return true;
	} catch (err) {
		logger.error('Unable to add suggestion', {service: 'Suggestions', obj: err});
		sentry.error(err);
		throw err;
	}
}

export async function addSuggestionsFromFile(file: string, source: string) {
	logger.info('Importing suggestions from CSV file...', {service: 'Suggestions'});
	const fileData = await fs.readFile(file, 'utf-8');
	const data = fileData.split('\n').map(l => {
		const line = l.split(';');
		return {
			song: `${line[0]}${line[1] ? ` - ${line[1]}` : ''}`,
			language: line[2],
			source
		};
	});
	await addSuggestion(data);
	await updateSuggestionSearchVector();
	logger.info('Imported suggestions!', {service: 'Suggestions'});
}

export async function removeSuggestion(id: number) {
	try {
		await deleteSuggestion(id);
		return true;
	} catch (err) {
		logger.error(`Unable to remove suggestion ${id}`, {service: 'Suggestions', obj: err});
		sentry.error(err);
		throw err;
	}
}
