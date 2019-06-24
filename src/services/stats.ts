import { uuidRegexp } from '../lib/utils/constants';
import testJSON from 'is-valid-json';
import { check } from '../lib/utils/validators';
import {
	upsertInstance,
	replaceFavorites,
	upsertPlayed,
	upsertRequests,
	getFavoritesStats as dbGetFavoritesStats,
	getRequestedStats as dbGetRequestedStats,
	getPlayedStats as dbGetPlayedStats } from '../dao/stats';
import logger from '../lib/utils/logger';

const payloadConstraints = {
	'instance.instance_id': {presence: true, format: uuidRegexp},
	'instance.version': {presence: {allowEmpty: false }},
	'instance.config': {presence: {allowEmpty: false }},
	favorites: {favoritesValidator: true},
	viewcounts: {songItemValidator: true},
	requests: {songItemValidator: true}
};

export async function processStatsPayload(payload) {
	try {
		if (!testJSON(payload)) throw 'Syntax error in JSON data';
		const validationErrors = check(payload, payloadConstraints);
		if (validationErrors) throw `Payload is not valid: ${JSON.stringify(validationErrors)}`;
		// If payload is version 1, it's going to be transformed a bit (old KM versions prior to 2.5 which did have incorrect field names)
		if (!payload.payloadVersion) {
			payload.viewcounts = payload.viewcounts.map(v => {
				return {
					kid: v.kid,
					played_at: v.modified_at,
					session_started_at: v.session_started_at
				};
			});
		}
		await Promise.all([
			upsertInstance(payload.instance),
			replaceFavorites(payload.instance.instance_id, payload.favorites),
			upsertPlayed(payload.instance.instance_id, payload.viewcounts),
			upsertRequests(payload.instance.instance_id, payload.requests)
		]);
		logger.info(`[Stats] Received payload from instance ${payload.instance.instance_id}`);
	} catch(err) {
		logger.error(`[Stats] Error with payload from ${payload.instance.instance_id} : ${err}`);
		logger.debug(`[Stats] Payload in error : ${JSON.stringify(payload,null,2)}`);
		throw err;
	}
}

export async function getFavoritesStats() {
	return await dbGetFavoritesStats();
}

export async function getRequestedStats() {
	return await dbGetRequestedStats();
}

export async function getPlayedStats() {
	return await dbGetPlayedStats();
}