import { uuidRegexp } from './constants';
import testJSON from 'is-valid-json';
import { check } from '../_utils/validators';
import {
	upsertInstance,
	replaceFavorites,
	upsertPlayed,
	upsertRequests,
	getFavoritesStats as dbGetFavoritesStats,
	getRequestedStats as dbGetRequestedStats,
	getPlayedStats as dbGetPlayedStats } from '../_dao/stats';
import logger from 'winston';

const payloadConstraints = {
	'instance.instance_id': {presence: true, format: uuidRegexp},
	'instance.version': {presence: {allowEmpty: false }},
	'instance.config': {presence: {allowEmpty: false }}
};

export async function processStatsPayload(payload) {
	try {
		if (!testJSON(payload)) throw 'Syntax error in JSON data';
		const validationErrors = check(payload, payloadConstraints);
		if (validationErrors) throw `Payload is not valid: ${JSON.stringify(validationErrors)}`;
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